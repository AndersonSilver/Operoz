import { createHash, randomBytes } from "node:crypto";
import type { Server } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { computeCallbackSignature } from "../src/auth/callback-signature.js";
import { loadOAuthConfig, type OAuthConfig } from "../src/auth/oauth-config.js";
import { createOAuthRouter, type OAuthRuntime } from "../src/auth/router.js";
import { JsonFileAuthStore } from "../src/auth/store.js";

const SECRET = "segredo-hml";
const WEB_BASE = "https://hml.operoz.io";
const REDIRECT_URI = "https://claude.ai/api/mcp/auth_callback";

let dir: string;
let server: Server;
let baseUrl: string;
let runtime: OAuthRuntime;
let config: OAuthConfig;
let now = 1_765_000_000_000;

const validateApiToken = vi.fn(async () => ({ id: "user-1", email: "a@b.c" }));
const deleteApiToken = vi.fn(async () => true);

function buildConfig(overrides: Record<string, string> = {}): OAuthConfig {
  const parsed = loadOAuthConfig({
    MCP_OAUTH_ISSUER_URL: "http://localhost/",
    MCP_OAUTH_RESOURCE_URL: "http://localhost/mcp",
    MCP_OAUTH_WEB_BASE_URL: WEB_BASE,
    MCP_OAUTH_WEB_ORIGINS: `${WEB_BASE},https://www.operoz.io`,
    MCP_WEB_CALLBACK_SECRET: SECRET,
    MCP_OAUTH_STORE_PATH: join(dir, "oauth-store.json"),
    OPEROZ_API_BASE_URL: "http://operoz.local",
    ...overrides,
  });
  if (!parsed) throw new Error("config não carregou");
  return parsed;
}

async function start(configOverrides: Record<string, string> = {}): Promise<void> {
  config = buildConfig(configOverrides);
  const store = new JsonFileAuthStore({ filePath: config.storePath, maxClients: config.maxClients, now: () => now });
  runtime = createOAuthRouter({
    config,
    store,
    rateLimitEnabled: false,
    deps: { validateApiToken, deleteApiToken, now: () => now },
  });

  const app = express();
  app.set("trust proxy", 1);
  app.use(runtime.router);

  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (typeof address === "string" || address === null) throw new Error("sem porta");
  baseUrl = `http://127.0.0.1:${address.port}`;
}

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "operoz-oauth-flow-"));
  now = 1_765_000_000_000;
  validateApiToken.mockClear();
  deleteApiToken.mockClear();
  validateApiToken.mockResolvedValue({ id: "user-1", email: "a@b.c" });
  await start();
});

afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await rm(dir, { recursive: true, force: true });
});

async function registerClient(name = "Claude"): Promise<string> {
  const response = await fetch(`${baseUrl}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_name: name,
      client_uri: "https://claude.ai",
      redirect_uris: [REDIRECT_URI],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    }),
  });
  expect(response.status).toBe(201);
  const body = (await response.json()) as { client_id: string };
  return body.client_id;
}

function pkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

async function authorize(
  clientId: string,
  challenge: string,
  extra: Record<string, string> = {}
): Promise<{ status: number; location: string | null }> {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    code_challenge: challenge,
    code_challenge_method: "S256",
    scope: "mcp:tools",
    state: "estado-original",
    ...extra,
  });
  const response = await fetch(`${baseUrl}/authorize?${params}`, { redirect: "manual" });
  return { status: response.status, location: response.headers.get("location") };
}

function ticketFrom(location: string | null): string {
  expect(location).toContain(`${WEB_BASE}/mcp-authorize/`);
  return decodeURIComponent(location!.slice(`${WEB_BASE}/mcp-authorize/`.length));
}

async function postCallback(
  ticket: string,
  overrides: { body?: string; secret?: string; timestamp?: string; origin?: string } = {}
): Promise<Response> {
  const body =
    overrides.body ??
    JSON.stringify({
      ticket,
      api_token_id: "apitoken-1",
      api_token: "operoz_api_realtoken",
      user_id: "user-1",
      user_email: "a@b.c",
    });
  const timestamp = overrides.timestamp ?? String(Math.floor(now / 1000));
  const signature = computeCallbackSignature(overrides.secret ?? SECRET, timestamp, body);

  return fetch(`${baseUrl}/oauth/web-callback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Operoz-Timestamp": timestamp,
      "X-Operoz-Signature": signature,
      ...(overrides.origin ? { Origin: overrides.origin } : {}),
    },
    body,
  });
}

async function exchangeCode(clientId: string, code: string, verifier: string): Promise<Response> {
  return fetch(`${baseUrl}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      code,
      code_verifier: verifier,
      redirect_uri: REDIRECT_URI,
    }).toString(),
  });
}

describe("descoberta OAuth (smoke test contra deriva do SDK)", () => {
  it("serve /.well-known/oauth-authorization-server com os endpoints esperados", async () => {
    const response = await fetch(`${baseUrl}/.well-known/oauth-authorization-server`);
    expect(response.status).toBe(200);
    const metadata = (await response.json()) as Record<string, unknown>;
    expect(metadata.authorization_endpoint).toBe("http://localhost/authorize");
    expect(metadata.token_endpoint).toBe("http://localhost/token");
    expect(metadata.registration_endpoint).toBe("http://localhost/register");
    expect(metadata.revocation_endpoint).toBe("http://localhost/revoke");
    expect(metadata.code_challenge_methods_supported).toEqual(["S256"]);
  });

  it("serve o PRM em /.well-known/oauth-protected-resource/mcp", async () => {
    const response = await fetch(`${baseUrl}/.well-known/oauth-protected-resource/mcp`);
    expect(response.status).toBe(200);
    const metadata = (await response.json()) as Record<string, unknown>;
    expect(metadata.resource).toBe("http://localhost/mcp");
    expect(metadata.authorization_servers).toEqual(["http://localhost/"]);
    expect(runtime.resourceMetadataUrl).toBe("http://localhost/.well-known/oauth-protected-resource/mcp");
  });
});

describe("fluxo OAuth completo", () => {
  it("percorre register → authorize → lookup → callback → token", async () => {
    const clientId = await registerClient();
    const { verifier, challenge } = pkce();

    // /authorize redireciona para a página do apps/web, com o ticket no PATH.
    const redirect = await authorize(clientId, challenge);
    expect(redirect.status).toBe(302);
    const ticket = ticketFrom(redirect.location);
    expect(redirect.location).not.toContain("?");

    // Lookup público (idempotente, sem redirect_uri nem state).
    const lookup = await fetch(`${baseUrl}/oauth/pending/${ticket}`, { headers: { Origin: WEB_BASE } });
    expect(lookup.status).toBe(200);
    expect(lookup.headers.get("access-control-allow-origin")).toBe(WEB_BASE);
    expect(lookup.headers.get("access-control-allow-credentials")).toBeNull();
    const view = (await lookup.json()) as Record<string, unknown>;
    expect(view).toMatchObject({ client_name: "Claude", client_uri: "https://claude.ai", scopes: ["mcp:tools"] });
    expect(view.redirect_uri).toBeUndefined();
    expect(view.state).toBeUndefined();

    // Refresh na tela de consentimento: o lookup não consome.
    expect((await fetch(`${baseUrl}/oauth/pending/${ticket}`)).status).toBe(200);

    // Handoff assinado do Django.
    const callback = await postCallback(ticket);
    expect(callback.status).toBe(200);
    const { redirect_url: redirectUrl } = (await callback.json()) as { redirect_url: string };
    const finalUrl = new URL(redirectUrl);
    expect(finalUrl.origin + finalUrl.pathname).toBe(REDIRECT_URI);
    expect(finalUrl.searchParams.get("state")).toBe("estado-original");
    const code = finalUrl.searchParams.get("code")!;
    expect(code.startsWith("ozmcp_ac_")).toBe(true);

    // O mcp-server valida o APIToken recebido antes de emitir o code.
    expect(validateApiToken).toHaveBeenCalledWith("http://operoz.local", "operoz_api_realtoken");

    // Troca do code por tokens.
    const tokenResponse = await exchangeCode(clientId, code, verifier);
    expect(tokenResponse.status).toBe(200);
    const tokens = (await tokenResponse.json()) as Record<string, string>;
    expect(tokens.access_token.startsWith("ozmcp_at_")).toBe(true);
    expect(tokens.refresh_token.startsWith("ozmcp_rt_")).toBe(true);
    expect(tokens.token_type).toBe("Bearer");

    // O access token resolve para a credencial Operoz real.
    const authInfo = await runtime.provider.verifyAccessToken(tokens.access_token);
    expect(authInfo.extra?.apiToken).toBe("operoz_api_realtoken");
    expect(authInfo.extra?.userEmail).toBe("a@b.c");
    expect(authInfo.scopes).toEqual(["mcp:tools"]);
  });

  it("consome o authorization code uma única vez", async () => {
    const clientId = await registerClient();
    const { verifier, challenge } = pkce();
    const ticket = ticketFrom((await authorize(clientId, challenge)).location);
    const { redirect_url: redirectUrl } = (await (await postCallback(ticket)).json()) as { redirect_url: string };
    const code = new URL(redirectUrl).searchParams.get("code")!;

    expect((await exchangeCode(clientId, code, verifier)).status).toBe(200);
    expect((await exchangeCode(clientId, code, verifier)).status).toBe(400);
  });

  it("recusa code_verifier errado (PKCE)", async () => {
    const clientId = await registerClient();
    const { challenge } = pkce();
    const ticket = ticketFrom((await authorize(clientId, challenge)).location);
    const { redirect_url: redirectUrl } = (await (await postCallback(ticket)).json()) as { redirect_url: string };
    const code = new URL(redirectUrl).searchParams.get("code")!;

    const response = await exchangeCode(clientId, code, "verificador-errado");
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("invalid_grant");
  });

  it("roda o refresh token e invalida o antigo", async () => {
    const clientId = await registerClient();
    const { verifier, challenge } = pkce();
    const ticket = ticketFrom((await authorize(clientId, challenge)).location);
    const { redirect_url: redirectUrl } = (await (await postCallback(ticket)).json()) as { redirect_url: string };
    const code = new URL(redirectUrl).searchParams.get("code")!;
    const tokens = (await (await exchangeCode(clientId, code, verifier)).json()) as Record<string, string>;

    const refreshBody = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      refresh_token: tokens.refresh_token,
    }).toString();

    const first = await fetch(`${baseUrl}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: refreshBody,
    });
    expect(first.status).toBe(200);
    const rotated = (await first.json()) as Record<string, string>;
    expect(rotated.refresh_token).not.toBe(tokens.refresh_token);

    const replay = await fetch(`${baseUrl}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: refreshBody,
    });
    expect(replay.status).toBe(400);
  });
});

describe("ticket pendente", () => {
  it("404 invalid_ticket para ticket inexistente", async () => {
    const response = await fetch(`${baseUrl}/oauth/pending/${"a".repeat(43)}`);
    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe("invalid_ticket");
  });

  it("404 invalid_ticket para formato inválido (mesma resposta, sem oráculo)", async () => {
    const response = await fetch(`${baseUrl}/oauth/pending/curto`);
    expect(response.status).toBe(404);
    expect((await response.json()).error).toBe("invalid_ticket");
  });

  it("expira o ticket depois do MCP_OAUTH_PENDING_TTL", async () => {
    const clientId = await registerClient();
    const { challenge } = pkce();
    const ticket = ticketFrom((await authorize(clientId, challenge)).location);

    now += 601_000;

    expect((await fetch(`${baseUrl}/oauth/pending/${ticket}`)).status).toBe(404);
    const callback = await postCallback(ticket);
    expect(callback.status).toBe(400);
    expect((await callback.json()).error).toBe("invalid_ticket");
  });

  it("não devolve CORS para origem fora da allowlist", async () => {
    const response = await fetch(`${baseUrl}/oauth/pending/${"a".repeat(43)}`, {
      headers: { Origin: "https://atacante.example" },
    });
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("aceita apex e www (as duas variantes do host canónico)", async () => {
    const clientId = await registerClient();
    const { challenge } = pkce();
    const ticket = ticketFrom((await authorize(clientId, challenge)).location);

    const apex = await fetch(`${baseUrl}/oauth/pending/${ticket}`, { headers: { Origin: "https://www.operoz.io" } });
    expect(apex.headers.get("access-control-allow-origin")).toBe("https://www.operoz.io");
  });
});

describe("deny (Cancelar)", () => {
  it("devolve redirect com error=access_denied e o state preservado", async () => {
    const clientId = await registerClient();
    const { challenge } = pkce();
    const ticket = ticketFrom((await authorize(clientId, challenge)).location);

    const response = await fetch(`${baseUrl}/oauth/pending/${ticket}/deny`, { method: "POST" });
    expect(response.status).toBe(200);
    const { redirect_url: redirectUrl } = (await response.json()) as { redirect_url: string };
    const url = new URL(redirectUrl);
    expect(url.searchParams.get("error")).toBe("access_denied");
    expect(url.searchParams.get("state")).toBe("estado-original");

    // Consome o ticket: o callback já não funciona (`invalid_ticket` — o 409
    // `ticket_consumed` é reservado ao replay do próprio callback).
    const callback = await postCallback(ticket);
    expect(callback.status).toBe(400);
    expect((await callback.json()).error).toBe("invalid_ticket");
  });

  it("404 quando o ticket não existe", async () => {
    const response = await fetch(`${baseUrl}/oauth/pending/${"a".repeat(43)}/deny`, { method: "POST" });
    expect(response.status).toBe(404);
  });
});

describe("/oauth/web-callback", () => {
  async function freshTicket(): Promise<string> {
    const clientId = await registerClient();
    const { challenge } = pkce();
    return ticketFrom((await authorize(clientId, challenge)).location);
  }

  it("401 invalid_signature com segredo errado", async () => {
    const ticket = await freshTicket();
    const response = await postCallback(ticket, { secret: "segredo-errado" });
    expect(response.status).toBe(401);
    expect((await response.json()).error).toBe("invalid_signature");
  });

  it("401 sem headers de assinatura", async () => {
    const ticket = await freshTicket();
    const response = await fetch(`${baseUrl}/oauth/web-callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticket, api_token: "operoz_api_x" }),
    });
    expect(response.status).toBe(401);
  });

  it("401 com timestamp fora da janela (replay)", async () => {
    const ticket = await freshTicket();
    const response = await postCallback(ticket, { timestamp: String(Math.floor(now / 1000) - 400) });
    expect(response.status).toBe(401);
  });

  it("401 quando o corpo é adulterado depois de assinado", async () => {
    const ticket = await freshTicket();
    const timestamp = String(Math.floor(now / 1000));
    const signedBody = JSON.stringify({ ticket, api_token: "operoz_api_bom" });
    const signature = computeCallbackSignature(SECRET, timestamp, signedBody);

    const response = await fetch(`${baseUrl}/oauth/web-callback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Operoz-Timestamp": timestamp,
        "X-Operoz-Signature": signature,
      },
      body: JSON.stringify({ ticket, api_token: "operoz_api_ATACANTE" }),
    });
    expect(response.status).toBe(401);
  });

  it("403 quando vem header Origin (não pode ser chamado pelo browser)", async () => {
    const ticket = await freshTicket();
    const response = await postCallback(ticket, { origin: WEB_BASE });
    expect(response.status).toBe(403);
  });

  it("é idempotente: a mesma chamada repetida devolve 200 com o MESMO redirect_url", async () => {
    // O grant é commitado antes de a resposta sair. Se a resposta se perder (timeout),
    // o Django tem de poder retentar sem que o token que ele mintou seja descartado.
    const ticket = await freshTicket();

    const first = await postCallback(ticket);
    expect(first.status).toBe(200);
    const firstUrl = ((await first.json()) as { redirect_url: string }).redirect_url;

    const replay = await postCallback(ticket);
    expect(replay.status).toBe(200);
    const replayUrl = ((await replay.json()) as { redirect_url: string }).redirect_url;

    expect(replayUrl).toBe(firstUrl);
  });

  it("na repetição não minta nem revalida nada de novo", async () => {
    const ticket = await freshTicket();
    expect((await postCallback(ticket)).status).toBe(200);

    validateApiToken.mockClear();
    expect((await postCallback(ticket)).status).toBe(200);
    expect(validateApiToken).not.toHaveBeenCalled();
  });

  it("o recibo de idempotência é durável (sobrevive a restart do processo)", async () => {
    const ticket = await freshTicket();
    const first = await postCallback(ticket);
    const firstUrl = ((await first.json()) as { redirect_url: string }).redirect_url;

    // Reabre o servidor sobre o MESMO ficheiro de store — equivale a um restart do
    // container. Um Map em memória perderia o recibo aqui.
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await start();

    const afterRestart = await postCallback(ticket);
    expect(afterRestart.status).toBe(200);
    expect(((await afterRestart.json()) as { redirect_url: string }).redirect_url).toBe(firstUrl);
  });

  it("400 invalid_ticket quando o ticket foi consumido sem deixar recibo de sucesso", async () => {
    const ticket = await freshTicket();
    // Consumido por fora do callback (é o que o `deny` faz): não há recibo, e o
    // pendente já não existe — indistinguível de um ticket desconhecido, de propósito.
    await runtime.provider.pendings.consume(ticket);

    const response = await postCallback(ticket);
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("invalid_ticket");
  });

  it("chamadas concorrentes nunca emitem dois codes diferentes", async () => {
    const ticket = await freshTicket();

    const responses = await Promise.all([postCallback(ticket), postCallback(ticket)]);
    const bodies = await Promise.all(responses.map(async (r) => ({ status: r.status, body: await r.json() })));

    const urls = new Set(bodies.filter((b) => b.status === 200).map((b) => b.body.redirect_url as string));
    expect(urls.size).toBe(1);
    for (const { status } of bodies) {
      expect([200, 409]).toContain(status);
    }
  });

  it("502 operoz_unreachable quando a API Operoz cai", async () => {
    const ticket = await freshTicket();
    validateApiToken.mockRejectedValueOnce(new Error("down"));

    const response = await postCallback(ticket);
    expect(response.status).toBe(502);
    expect((await response.json()).error).toBe("operoz_unreachable");

    // Não consumiu o ticket: dá para tentar de novo.
    validateApiToken.mockResolvedValue({ id: "user-1", email: "a@b.c" });
    expect((await postCallback(ticket)).status).toBe(200);
  });

  it("400 quando o APIToken recebido não é válido na Operoz", async () => {
    const ticket = await freshTicket();
    validateApiToken.mockResolvedValueOnce(undefined as never);

    const response = await postCallback(ticket);
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("invalid_api_token");
  });

  it("503 quando MCP_WEB_CALLBACK_SECRET não está configurado", async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await start({ MCP_WEB_CALLBACK_SECRET: "" });

    const response = await fetch(`${baseUrl}/oauth/web-callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    expect(response.status).toBe(503);
  });

  it("aceita assinatura do segundo segredo da lista (rotação)", async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await start({ MCP_WEB_CALLBACK_SECRET: `${SECRET},segredo-novo` });

    const ticket = await (async () => {
      const clientId = await registerClient();
      const { challenge } = pkce();
      return ticketFrom((await authorize(clientId, challenge)).location);
    })();

    expect((await postCallback(ticket, { secret: "segredo-novo" })).status).toBe(200);
  });

  it("descarta a autorização anterior do mesmo utilizador/cliente", async () => {
    const clientId = await registerClient();

    for (const _ of [1, 2]) {
      const { challenge } = pkce();
      const ticket = ticketFrom((await authorize(clientId, challenge)).location);
      expect((await postCallback(ticket)).status).toBe(200);
    }

    // A segunda autorização revoga o APIToken da primeira? Aqui os dois handoffs usam o
    // mesmo api_token_id, portanto não há APIToken órfão a apagar.
    expect(deleteApiToken).not.toHaveBeenCalled();
  });
});

describe("revogação", () => {
  it("revoga o access token e apaga o APIToken Operoz", async () => {
    const clientId = await registerClient();
    const { verifier, challenge } = pkce();
    const ticket = ticketFrom((await authorize(clientId, challenge)).location);
    const { redirect_url: redirectUrl } = (await (await postCallback(ticket)).json()) as { redirect_url: string };
    const code = new URL(redirectUrl).searchParams.get("code")!;
    const tokens = (await (await exchangeCode(clientId, code, verifier)).json()) as Record<string, string>;

    const response = await fetch(`${baseUrl}/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, token: tokens.access_token }).toString(),
    });
    expect(response.status).toBe(200);

    expect(deleteApiToken).toHaveBeenCalledWith("http://operoz.local", "operoz_api_realtoken", "apitoken-1");
    await expect(runtime.provider.verifyAccessToken(tokens.access_token)).rejects.toThrow();
  });

  it("invalida o access token quando o APIToken Operoz é revogado na Operoz", async () => {
    const clientId = await registerClient();
    const { verifier, challenge } = pkce();
    const ticket = ticketFrom((await authorize(clientId, challenge)).location);
    const { redirect_url: redirectUrl } = (await (await postCallback(ticket)).json()) as { redirect_url: string };
    const code = new URL(redirectUrl).searchParams.get("code")!;
    const tokens = (await (await exchangeCode(clientId, code, verifier)).json()) as Record<string, string>;

    // Dentro do intervalo de revalidação: continua válido sem chamar a Operoz.
    validateApiToken.mockClear();
    await runtime.provider.verifyAccessToken(tokens.access_token);
    expect(validateApiToken).not.toHaveBeenCalled();

    // Passado o intervalo, revalida — e a Operoz diz que o token já não existe.
    now += 301_000;
    validateApiToken.mockResolvedValueOnce(undefined as never);
    await expect(runtime.provider.verifyAccessToken(tokens.access_token)).rejects.toThrow(/revogada/);
  });

  it("mantém a sessão viva quando a Operoz está inalcançável (fail-open temporário)", async () => {
    const clientId = await registerClient();
    const { verifier, challenge } = pkce();
    const ticket = ticketFrom((await authorize(clientId, challenge)).location);
    const { redirect_url: redirectUrl } = (await (await postCallback(ticket)).json()) as { redirect_url: string };
    const code = new URL(redirectUrl).searchParams.get("code")!;
    const tokens = (await (await exchangeCode(clientId, code, verifier)).json()) as Record<string, string>;

    now += 301_000;
    validateApiToken.mockRejectedValueOnce(new Error("down"));
    await expect(runtime.provider.verifyAccessToken(tokens.access_token)).resolves.toBeDefined();
  });
});

describe("parâmetro resource (RFC 8707)", () => {
  it("aceita o resource canónico mesmo com barra final", async () => {
    const clientId = await registerClient();
    const { challenge } = pkce();
    const redirect = await authorize(clientId, challenge, { resource: "http://localhost/mcp/" });
    expect(redirect.status).toBe(302);
    expect(redirect.location).toContain("/mcp-authorize/");
  });

  it("recusa resource de outro servidor", async () => {
    const clientId = await registerClient();
    const { challenge } = pkce();
    const redirect = await authorize(clientId, challenge, { resource: "https://outro.example/mcp" });
    expect(redirect.status).toBe(302);
    expect(redirect.location).toContain("error=invalid_target");
  });
});

describe("registo de clientes (DCR)", () => {
  it("recusa redirect_uri não-https e não-loopback", async () => {
    const response = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: "Mau",
        redirect_uris: ["http://exemplo.com/cb"],
        token_endpoint_auth_method: "none",
      }),
    });
    expect(response.status).toBe(400);
  });

  it("aceita loopback com porta efémera (apps nativos, RFC 8252)", async () => {
    const response = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_name: "Claude Desktop",
        redirect_uris: ["http://localhost:54321/callback"],
        token_endpoint_auth_method: "none",
      }),
    });
    expect(response.status).toBe(201);
  });
});
