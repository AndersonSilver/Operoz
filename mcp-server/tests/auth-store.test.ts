import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isAcceptableRedirectUri, OperozClientsStore } from "../src/auth/clients-store.js";
import { hashKey, JsonFileAuthStore } from "../src/auth/store.js";
import type { StoredToken } from "../src/auth/types.js";

let dir: string;
let filePath: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "operoz-auth-store-"));
  filePath = join(dir, "nested", "oauth-store.json");
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

function token(overrides: Partial<StoredToken> = {}): StoredToken {
  const now = Date.now();
  return {
    kind: "access",
    clientId: "client-1",
    scopes: ["mcp:tools"],
    subject: { apiToken: "operoz_api_abc", apiTokenId: "tok-1", userId: "user-1" },
    expiresAt: now + 60_000,
    createdAt: now,
    ...overrides,
  };
}

describe("JsonFileAuthStore", () => {
  it("faz round-trip de token entre instâncias (persistência real em disco)", async () => {
    const store = new JsonFileAuthStore({ filePath });
    await store.putToken("ozmcp_at_abc", token());

    const reopened = new JsonFileAuthStore({ filePath });
    const found = await reopened.getToken("ozmcp_at_abc");
    expect(found?.subject.apiToken).toBe("operoz_api_abc");
  });

  it("guarda tokens por hash SHA-256, nunca em texto puro", async () => {
    const store = new JsonFileAuthStore({ filePath });
    await store.putToken("ozmcp_at_segredo", token());

    const raw = await readFile(filePath, "utf8");
    expect(raw).not.toContain("ozmcp_at_segredo");
    expect(raw).toContain(hashKey("ozmcp_at_segredo"));
  });

  it("mantém apiToken em texto puro (precisa ser reenviado à API Operoz)", async () => {
    const store = new JsonFileAuthStore({ filePath });
    await store.putToken("ozmcp_at_abc", token());

    const raw = await readFile(filePath, "utf8");
    expect(raw).toContain("operoz_api_abc");
  });

  it("escreve atomicamente: não deixa ficheiro temporário para trás", async () => {
    const store = new JsonFileAuthStore({ filePath });
    await store.putToken("ozmcp_at_abc", token());
    await store.putToken("ozmcp_at_def", token());

    const { readdir } = await import("node:fs/promises");
    const files = await readdir(join(dir, "nested"));
    expect(files).toEqual(["oauth-store.json"]);
  });

  it("recupera de ficheiro corrompido recomeçando vazio", async () => {
    const { mkdir } = await import("node:fs/promises");
    await mkdir(join(dir, "nested"), { recursive: true });
    await writeFile(filePath, "{ isto não é json", "utf8");

    const store = new JsonFileAuthStore({ filePath });
    expect(await store.getToken("ozmcp_at_abc")).toBeUndefined();

    await store.putToken("ozmcp_at_abc", token());
    expect((await store.getToken("ozmcp_at_abc"))?.clientId).toBe("client-1");
  });

  it("expira tokens pelo TTL", async () => {
    let now = 1_000_000;
    const store = new JsonFileAuthStore({ filePath, now: () => now });
    await store.putToken("ozmcp_at_abc", token({ expiresAt: now + 1_000, createdAt: now }));

    expect(await store.getToken("ozmcp_at_abc")).toBeDefined();
    now += 2_000;
    expect(await store.getToken("ozmcp_at_abc")).toBeUndefined();
  });

  it("expira grants e pendentes pelo TTL", async () => {
    let now = 1_000_000;
    const store = new JsonFileAuthStore({ filePath, now: () => now });
    await store.putGrant("code-1", {
      clientId: "c",
      redirectUri: "https://claude.ai/cb",
      codeChallenge: "chal",
      scopes: [],
      subject: { apiToken: "t" },
      expiresAt: now + 100,
      createdAt: now,
    });
    await store.putPending("ticket-1", {
      clientId: "c",
      clientName: "Claude",
      redirectUri: "https://claude.ai/cb",
      codeChallenge: "chal",
      scopes: [],
      expiresAt: now + 100,
      createdAt: now,
    });

    now += 500;
    expect(await store.peekGrant("code-1")).toBeUndefined();
    expect(await store.peekPending("ticket-1")).toBeUndefined();
  });

  it("consome grant uma única vez", async () => {
    const store = new JsonFileAuthStore({ filePath });
    const now = Date.now();
    await store.putGrant("code-1", {
      clientId: "c",
      redirectUri: "https://claude.ai/cb",
      codeChallenge: "chal",
      scopes: [],
      subject: { apiToken: "t" },
      expiresAt: now + 60_000,
      createdAt: now,
    });

    expect(await store.consumeGrant("code-1")).toBeDefined();
    expect(await store.consumeGrant("code-1")).toBeUndefined();
  });

  it("consome pendente uma única vez, mesmo em chamadas concorrentes", async () => {
    const store = new JsonFileAuthStore({ filePath });
    const now = Date.now();
    await store.putPending("ticket-1", {
      clientId: "c",
      clientName: "Claude",
      redirectUri: "https://claude.ai/cb",
      codeChallenge: "chal",
      scopes: [],
      expiresAt: now + 60_000,
      createdAt: now,
    });

    const results = await Promise.all([store.consumePending("ticket-1"), store.consumePending("ticket-1")]);
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it("claimPendingForCallback é atómico: só o primeiro reclama, o resto vê a reserva", async () => {
    const store = new JsonFileAuthStore({ filePath });
    const now = Date.now();
    await store.putPending("ticket-1", {
      clientId: "c",
      clientName: "Claude",
      redirectUri: "https://claude.ai/cb",
      codeChallenge: "chal",
      scopes: [],
      expiresAt: now + 60_000,
      createdAt: now,
    });

    const [first, second] = await Promise.all([
      store.claimPendingForCallback("ticket-1", 60_000),
      store.claimPendingForCallback("ticket-1", 60_000),
    ]);

    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual(["already", "claimed"]);

    // Nunca existe uma janela em que o pendente sumiu e o recibo ainda não existe:
    // o perdedor vê a RESERVA (recibo sem redirectUrl), não "ticket desconhecido".
    const loser = first.status === "already" ? first : second;
    if (loser.status !== "already") throw new Error("esperava um perdedor");
    expect(loser.receipt.redirectUrl).toBeUndefined();
    expect(loser.receipt.clientId).toBe("c");
  });

  it("claimPendingForCallback devolve o recibo preenchido depois de concluído", async () => {
    const store = new JsonFileAuthStore({ filePath });
    const now = Date.now();
    await store.putPending("ticket-1", {
      clientId: "c",
      clientName: "Claude",
      redirectUri: "https://claude.ai/cb",
      codeChallenge: "chal",
      scopes: [],
      expiresAt: now + 60_000,
      createdAt: now,
    });

    await store.claimPendingForCallback("ticket-1", 60_000);
    await store.putConsumedTicket("ticket-1", {
      clientId: "c",
      redirectUrl: "https://claude.ai/cb?code=abc&state=s",
      consumedAt: now,
      expiresAt: now + 60_000,
    });

    const again = await store.claimPendingForCallback("ticket-1", 60_000);
    expect(again.status).toBe("already");
    if (again.status !== "already") throw new Error("esperava already");
    expect(again.receipt.redirectUrl).toBe("https://claude.ai/cb?code=abc&state=s");
  });

  it("claimPendingForCallback devolve missing para ticket inexistente", async () => {
    const store = new JsonFileAuthStore({ filePath });
    expect((await store.claimPendingForCallback("ticket-inexistente", 60_000)).status).toBe("missing");
  });

  it("o recibo de consumo sobrevive a reabrir o store (durável, não em memória)", async () => {
    const store = new JsonFileAuthStore({ filePath });
    const now = Date.now();
    await store.putConsumedTicket("ticket-1", {
      clientId: "c",
      redirectUrl: "https://claude.ai/cb?code=abc",
      consumedAt: now,
      expiresAt: now + 60_000,
    });

    const reopened = new JsonFileAuthStore({ filePath });
    expect((await reopened.getConsumedTicket("ticket-1"))?.redirectUrl).toBe("https://claude.ai/cb?code=abc");
  });

  it("expira o recibo de consumo pelo TTL", async () => {
    let now = 1_000_000;
    const store = new JsonFileAuthStore({ filePath, now: () => now });
    await store.putConsumedTicket("ticket-1", {
      clientId: "c",
      redirectUrl: "https://claude.ai/cb?code=abc",
      consumedAt: now,
      expiresAt: now + 1_000,
    });

    now += 2_000;
    expect(await store.getConsumedTicket("ticket-1")).toBeUndefined();
  });

  it("guarda o recibo por hash, nunca com o ticket em texto puro", async () => {
    const store = new JsonFileAuthStore({ filePath });
    const now = Date.now();
    await store.putConsumedTicket("ticket-secreto-abcdefghij", {
      clientId: "c",
      redirectUrl: "https://claude.ai/cb",
      consumedAt: now,
      expiresAt: now + 60_000,
    });

    const raw = await readFile(filePath, "utf8");
    expect(raw).not.toContain("ticket-secreto-abcdefghij");
    expect(raw).toContain(hashKey("ticket-secreto-abcdefghij"));
  });

  it("aplica eviction LRU quando excede maxClients", async () => {
    let now = 1_000;
    const store = new JsonFileAuthStore({ filePath, maxClients: 2, now: () => now });
    const info = (id: string) => ({
      client_id: id,
      redirect_uris: ["https://claude.ai/cb"],
    });

    for (const id of ["a", "b", "c"]) {
      now += 1_000;
      await store.putClient(id, { info: info(id) as never, createdAt: now, lastUsedAt: now });
    }

    expect(await store.getClient("a")).toBeUndefined();
    expect(await store.getClient("b")).toBeDefined();
    expect(await store.getClient("c")).toBeDefined();
  });

  it("remove tokens de um par cliente/utilizador", async () => {
    const store = new JsonFileAuthStore({ filePath });
    await store.putToken("ozmcp_at_1", token());
    await store.putToken("ozmcp_rt_1", token({ kind: "refresh" }));
    await store.putToken("ozmcp_at_outro", token({ clientId: "client-2" }));

    const removed = await store.deleteTokensForSubject("client-1", "tok-1", "user-1");
    expect(removed).toHaveLength(2);
    expect(await store.getToken("ozmcp_at_outro")).toBeDefined();
  });

  it("marca o momento da última revalidação", async () => {
    const store = new JsonFileAuthStore({ filePath });
    await store.putToken("ozmcp_at_abc", token());
    await store.markTokenValidated("ozmcp_at_abc", 12_345);
    expect((await store.getToken("ozmcp_at_abc"))?.lastValidatedAt).toBe(12_345);
  });
});

describe("OperozClientsStore", () => {
  it("aceita https e loopback http; recusa o resto", () => {
    expect(isAcceptableRedirectUri("https://claude.ai/api/mcp/auth_callback")).toBe(true);
    expect(isAcceptableRedirectUri("http://localhost:54321/callback")).toBe(true);
    expect(isAcceptableRedirectUri("http://127.0.0.1:1/cb")).toBe(true);
    expect(isAcceptableRedirectUri("http://exemplo.com/cb")).toBe(false);
    expect(isAcceptableRedirectUri("javascript:alert(1)")).toBe(false);
    expect(isAcceptableRedirectUri("https://claude.ai/cb#frag")).toBe(false);
    expect(isAcceptableRedirectUri("nao-e-url")).toBe(false);
  });

  it("regista e devolve cliente", async () => {
    const store = new JsonFileAuthStore({ filePath });
    const clients = new OperozClientsStore(store);
    const info = {
      client_id: "abc",
      client_name: "Claude",
      redirect_uris: ["https://claude.ai/cb"],
    } as never;

    await clients.registerClient(info);
    expect((await clients.getClient("abc"))?.client_name).toBe("Claude");
    expect(await clients.getClient("inexistente")).toBeUndefined();
  });

  it("recusa registo com redirect_uri inválido", async () => {
    const store = new JsonFileAuthStore({ filePath });
    const clients = new OperozClientsStore(store);
    await expect(
      clients.registerClient({ client_id: "abc", redirect_uris: ["http://evil.com/cb"] } as never)
    ).rejects.toThrow(/redirect_uri/);
  });

  it("recusa registo sem redirect_uris", async () => {
    const store = new JsonFileAuthStore({ filePath });
    const clients = new OperozClientsStore(store);
    await expect(clients.registerClient({ client_id: "abc", redirect_uris: [] } as never)).rejects.toThrow(
      /obrigatório/
    );
  });
});
