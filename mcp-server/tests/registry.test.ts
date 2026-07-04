import { describe, expect, it } from "vitest";

import { ALL_OPERATIONS, groupByDomain } from "../src/tools/registry/index.js";
import { AGENT_TOOL_NAMES, FULL_META_TOOL_NAMES } from "../src/tools/registry/meta.js";

const KNOWN_SURFACES = new Set(["v1", "app", "public", "instances", "auth"]);

describe("registro de operações", () => {
  it("não tem nomes duplicados", () => {
    const names = ALL_OPERATIONS.map((op) => op.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it("tem pelo menos uma operação por domínio conhecido", () => {
    const domains = groupByDomain();
    expect(Object.keys(domains).length).toBeGreaterThan(0);
    for (const names of Object.values(domains)) {
      expect(names.length).toBeGreaterThan(0);
    }
  });

  it("nenhum domínio concentra mais que 30% das operações (evita 'gaveta de miscelânea')", () => {
    const domains = groupByDomain();
    const total = ALL_OPERATIONS.length;
    for (const [domain, names] of Object.entries(domains)) {
      expect(names.length / total, `domínio "${domain}" concentra tools demais`).toBeLessThan(0.3);
    }
  });

  it("todo path param declarado aparece no template do path, e vice-versa", () => {
    for (const op of ALL_OPERATIONS) {
      const placeholders = [...op.path.matchAll(/\{([a-zA-Z0-9_]+)\}/g)].map((m) => m[1]);
      expect(new Set(placeholders), `path de ${op.name}`).toEqual(new Set(op.pathParams));
    }
  });

  it("toda operação usa uma surface conhecida", () => {
    for (const op of ALL_OPERATIONS) {
      expect(KNOWN_SURFACES.has(op.surface), `surface inválida em ${op.name}: ${op.surface}`).toBe(true);
    }
  });

  it("toda operação tem domain e description não vazios", () => {
    for (const op of ALL_OPERATIONS) {
      expect(op.domain.trim().length, op.name).toBeGreaterThan(0);
      expect(op.description.trim().length, op.name).toBeGreaterThan(0);
    }
  });

  it("AGENT_TOOL_NAMES é subconjunto de FULL_META_TOOL_NAMES", () => {
    for (const name of AGENT_TOOL_NAMES) {
      expect(FULL_META_TOOL_NAMES.has(name)).toBe(true);
    }
  });
});
