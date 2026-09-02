import type { IncomingMessage } from "node:http";

import { InvalidTokenError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { describe, expect, it, vi } from "vitest";

import { credentialFingerprint, resolveRequestAuth, wwwAuthenticateHeader } from "../src/auth/request-auth.js";
import type { OperozConfig } from "../src/config.js";

const BASE: OperozConfig = { baseUrl: "http://localhost:8000" };

function request(headers: Record<string, string>): IncomingMessage {
  return { headers } as unknown as IncomingMessage;
}

function authInfo(overrides: Partial<AuthInfo> = {}): AuthInfo {
  return {
    token: "ozmcp_at_x",
    clientId: "client-1",
    scopes: ["mcp:tools"],
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    extra: { apiToken: "operoz_api_real", userId: "u1", userEmail: "a@b.c" },
    ...overrides,
  };
}

describe("resolveRequestAuth — tabela de decisão", () => {
  it("1. X-Api-Key presente → LEGADO (mesmo com Bearer ozmcp_at_ junto)", async () => {
    const verifier = { verifyAccessToken: vi.fn() };
    const resolved = await resolveRequestAuth(
      request({ "x-api-key": "operoz_api_estatico", authorization: "Bearer ozmcp_at_qualquer" }),
      BASE,
      verifier
    );

    expect(resolved.kind).toBe("legacy");
    expect(resolved.kind === "legacy" && resolved.config.apiKey).toBe("operoz_api_estatico");
    expect(verifier.verifyAccessToken).not.toHaveBeenCalled();
  });

  it("2. X-Operoz-Session presente → LEGADO", async () => {
    const resolved = await resolveRequestAuth(request({ "x-operoz-session": "sessionid=abc" }), BASE);

    expect(resolved.kind).toBe("legacy");
    expect(resolved.kind === "legacy" && resolved.config.sessionCookie).toBe("sessionid=abc");
  });

  it("3a. Bearer com prefixo ozmcp_at_ → OAUTH", async () => {
    const verifier = { verifyAccessToken: vi.fn().mockResolvedValue(authInfo()) };
    const resolved = await resolveRequestAuth(request({ authorization: "Bearer ozmcp_at_abc" }), BASE, verifier);

    expect(resolved.kind).toBe("oauth");
    expect(resolved.kind === "oauth" && resolved.config.apiKey).toBe("operoz_api_real");
    expect(verifier.verifyAccessToken).toHaveBeenCalledWith("ozmcp_at_abc");
  });

  it("3b. Bearer com token estático Operoz → LEGADO (sem tocar no verificador)", async () => {
    const verifier = { verifyAccessToken: vi.fn() };
    const resolved = await resolveRequestAuth(request({ authorization: "Bearer operoz_api_abc" }), BASE, verifier);

    expect(resolved.kind).toBe("legacy");
    expect(resolved.kind === "legacy" && resolved.config.apiKey).toBe("operoz_api_abc");
    expect(verifier.verifyAccessToken).not.toHaveBeenCalled();
  });

  it("3b. Bearer com token pré-rebrand operoz_api_ → LEGADO", async () => {
    const resolved = await resolveRequestAuth(request({ authorization: "Bearer operoz_api_antigo" }), BASE);

    expect(resolved.kind).toBe("legacy");
    expect(resolved.kind === "legacy" && resolved.config.apiKey).toBe("operoz_api_antigo");
  });

  it("4. nada → 401", async () => {
    const resolved = await resolveRequestAuth(request({}), BASE);

    expect(resolved.kind).toBe("unauthorized");
    expect(resolved.kind === "unauthorized" && resolved.error).toMatch(/Credenciais em falta/);
  });

  it("4. sem headers mas com defaults de ambiente → LEGADO (comportamento atual preservado)", async () => {
    const resolved = await resolveRequestAuth(request({}), {
      baseUrl: "http://localhost:8000",
      apiKey: "operoz_api_do_env",
    });

    expect(resolved.kind).toBe("legacy");
    expect(resolved.kind === "legacy" && resolved.config.apiKey).toBe("operoz_api_do_env");
  });

  it("Bearer maiúsculo/minúsculo é tratado igual", async () => {
    const verifier = { verifyAccessToken: vi.fn().mockResolvedValue(authInfo()) };
    const resolved = await resolveRequestAuth(request({ authorization: "bearer ozmcp_at_abc" }), BASE, verifier);
    expect(resolved.kind).toBe("oauth");
  });

  it("X-Api-Key vazio não conta como legado", async () => {
    const resolved = await resolveRequestAuth(request({ "x-api-key": "   " }), BASE);
    expect(resolved.kind).toBe("unauthorized");
  });
});

describe("resolveRequestAuth — falhas do caminho OAuth", () => {
  it("token OAuth inválido → 401 com a mensagem do SDK", async () => {
    const verifier = {
      verifyAccessToken: vi.fn().mockRejectedValue(new InvalidTokenError("Access token expirado.")),
    };
    const resolved = await resolveRequestAuth(request({ authorization: "Bearer ozmcp_at_abc" }), BASE, verifier);

    expect(resolved.kind).toBe("unauthorized");
    expect(resolved.kind === "unauthorized" && resolved.error).toBe("Access token expirado.");
  });

  it("erro inesperado do verificador não vaza detalhe", async () => {
    const verifier = { verifyAccessToken: vi.fn().mockRejectedValue(new Error("stack interno secreto")) };
    const resolved = await resolveRequestAuth(request({ authorization: "Bearer ozmcp_at_abc" }), BASE, verifier);

    expect(resolved.kind === "unauthorized" && resolved.error).toBe("Access token inválido.");
  });

  it("token OAuth sem credencial Operoz associada → 401", async () => {
    const verifier = { verifyAccessToken: vi.fn().mockResolvedValue(authInfo({ extra: {} })) };
    const resolved = await resolveRequestAuth(request({ authorization: "Bearer ozmcp_at_abc" }), BASE, verifier);

    expect(resolved.kind).toBe("unauthorized");
  });

  it("prefixo OAuth sem OAuth ativo → 401 (não cai para legado)", async () => {
    const resolved = await resolveRequestAuth(request({ authorization: "Bearer ozmcp_at_abc" }), BASE);

    expect(resolved.kind).toBe("unauthorized");
    expect(resolved.kind === "unauthorized" && resolved.error).toMatch(/OAuth não está ativo/);
  });

  it("o caminho OAuth nunca herda sessionCookie do ambiente", async () => {
    const verifier = { verifyAccessToken: vi.fn().mockResolvedValue(authInfo()) };
    const resolved = await resolveRequestAuth(
      request({ authorization: "Bearer ozmcp_at_abc" }),
      {
        baseUrl: "http://localhost:8000",
        apiKey: "operoz_api_do_env",
        sessionCookie: "sessionid=do_env",
      },
      verifier
    );

    expect(resolved.kind === "oauth" && resolved.config.apiKey).toBe("operoz_api_real");
    expect(resolved.kind === "oauth" && resolved.config.sessionCookie).toBeUndefined();
  });
});

describe("credentialFingerprint", () => {
  const fp = (apiKey?: string, sessionCookie?: string) =>
    credentialFingerprint({ baseUrl: "http://localhost:8000", apiKey, sessionCookie });

  it("é estável para a mesma credencial", () => {
    expect(fp("tok", "sessionid=a")).toBe(fp("tok", "sessionid=a"));
  });

  it("nunca colide quando o delimitador aparece dentro dos próprios valores", () => {
    // O sessionCookie real contém espaços e `;` (vem de `cookies.join("; ")`), por
    // isso concatenar com um delimitador simples seria ambíguo. Estes dois pares
    // colidiriam com `${apiKey} ${sessionCookie}`.
    expect(fp("tok", "en x")).not.toBe(fp("tok en", "x"));
  });

  it("distingue campo vazio de campo ausente na outra posição", () => {
    expect(fp("tok", "")).not.toBe(fp("", "tok"));
    expect(fp("tok", undefined)).not.toBe(fp(undefined, "tok"));
  });

  it("não colide com aspas ou barras invertidas nos valores", () => {
    expect(fp('a"', "b")).not.toBe(fp("a", '"b'));
    expect(fp("a\\", "b")).not.toBe(fp("a", "\\b"));
  });

  it("muda quando qualquer uma das duas credenciais muda", () => {
    expect(fp("tok", "sessionid=a")).not.toBe(fp("tok2", "sessionid=a"));
    expect(fp("tok", "sessionid=a")).not.toBe(fp("tok", "sessionid=b"));
  });

  it("não expõe a credencial no valor devolvido", () => {
    const fingerprint = fp("operoz_api_supersegredo", "sessionid=segredo");
    expect(fingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(fingerprint).not.toContain("supersegredo");
  });
});

describe("wwwAuthenticateHeader", () => {
  it("monta o header no mesmo formato do requireBearerAuth do SDK", () => {
    expect(wwwAuthenticateHeader("invalid_token", "Token expirado.")).toBe(
      'Bearer error="invalid_token", error_description="Token expirado."'
    );
  });

  it("inclui resource_metadata quando disponível", () => {
    expect(
      wwwAuthenticateHeader("invalid_token", "x", "https://mcp.operoz.io/.well-known/oauth-protected-resource/mcp")
    ).toBe(
      'Bearer error="invalid_token", error_description="x", resource_metadata="https://mcp.operoz.io/.well-known/oauth-protected-resource/mcp"'
    );
  });
});
