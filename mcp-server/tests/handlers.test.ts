import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { OperozClient } from "../src/client.js";

const ORIGINAL_PROFILE = process.env.OPEROZ_MCP_PROFILE;

async function loadHandlers(profile: "agent" | "full") {
  vi.resetModules();
  process.env.OPEROZ_MCP_PROFILE = profile;
  return import("../src/tools/handlers.js");
}

function fakeClient(): OperozClient {
  return { request: vi.fn().mockResolvedValue({ ok: true }) } as unknown as OperozClient;
}

describe("handleToolCall — perfil agent", () => {
  afterEach(() => {
    process.env.OPEROZ_MCP_PROFILE = ORIGINAL_PROFILE;
  });

  it("operoz_discover devolve matches e next_step", async () => {
    const { handleToolCall } = await loadHandlers("agent");
    const result = await handleToolCall(fakeClient(), "operoz_discover", { query: "board" });
    const payload = JSON.parse(result.content[0].text);
    expect(payload.next_step).toMatch(/operoz_execute/);
    expect(Array.isArray(payload.matches)).toBe(true);
  });

  it("recusa chamar uma operação diretamente pelo nome (não exposta no perfil agent)", async () => {
    const { handleToolCall } = await loadHandlers("agent");
    const result = await handleToolCall(fakeClient(), "operoz_list_boards_app", {});
    const payload = JSON.parse(result.content[0].text);
    expect(payload.error).toMatch(/não exposta no perfil agent/);
  });

  it("operoz_execute delega para a operação encontrada no registry", async () => {
    const { handleToolCall } = await loadHandlers("agent");
    const client = fakeClient();
    const result = await handleToolCall(client, "operoz_execute", {
      operation: "operoz_get_instance",
    });
    expect(client.request).toHaveBeenCalled();
    const payload = JSON.parse(result.content[0].text);
    expect(payload).toEqual({ ok: true });
  });

  it("operoz_execute com operação desconhecida devolve erro amigável", async () => {
    const { handleToolCall } = await loadHandlers("agent");
    const result = await handleToolCall(fakeClient(), "operoz_execute", { operation: "operoz_nao_existe" });
    const payload = JSON.parse(result.content[0].text);
    expect(payload.error).toMatch(/Operação desconhecida/);
  });
});

describe("handleToolCall — perfil full", () => {
  afterEach(() => {
    process.env.OPEROZ_MCP_PROFILE = ORIGINAL_PROFILE;
  });

  it("permite chamar uma operação diretamente pelo nome", async () => {
    const { handleToolCall } = await loadHandlers("full");
    const client = fakeClient();
    const result = await handleToolCall(client, "operoz_get_instance", {});
    expect(client.request).toHaveBeenCalled();
    const payload = JSON.parse(result.content[0].text);
    expect(payload).toEqual({ ok: true });
  });

  it("tool desconhecida devolve erro com dica", async () => {
    const { handleToolCall } = await loadHandlers("full");
    const result = await handleToolCall(fakeClient(), "operoz_isso_nao_existe", {});
    const payload = JSON.parse(result.content[0].text);
    expect(payload.error).toMatch(/Ferramenta desconhecida/);
  });
});
