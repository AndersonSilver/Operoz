import { describe, expect, it } from "vitest";

import { loadTrustProxy } from "../src/auth/oauth-config.js";

describe("loadTrustProxy", () => {
  it("usa 1 (hop count) quando a variável não está definida", () => {
    expect(loadTrustProxy({})).toBe(1);
  });

  it("interpreta '1' como hop count numérico, não como true (ERR_ERL_PERMISSIVE_TRUST_PROXY)", () => {
    expect(loadTrustProxy({ MCP_TRUST_PROXY: "1" })).toBe(1);
  });

  it("interpreta '0' como hop count numérico, não como false", () => {
    expect(loadTrustProxy({ MCP_TRUST_PROXY: "0" })).toBe(0);
  });

  it("interpreta um hop count maior que 1", () => {
    expect(loadTrustProxy({ MCP_TRUST_PROXY: "2" })).toBe(2);
  });

  it("interpreta palavras como booleano (true/yes/on)", () => {
    expect(loadTrustProxy({ MCP_TRUST_PROXY: "true" })).toBe(true);
    expect(loadTrustProxy({ MCP_TRUST_PROXY: "yes" })).toBe(true);
  });

  it("interpreta palavras como booleano (false/no/off)", () => {
    expect(loadTrustProxy({ MCP_TRUST_PROXY: "false" })).toBe(false);
    expect(loadTrustProxy({ MCP_TRUST_PROXY: "off" })).toBe(false);
  });

  it("cai no default 1 para valor não reconhecido", () => {
    expect(loadTrustProxy({ MCP_TRUST_PROXY: "lorem" })).toBe(1);
  });
});
