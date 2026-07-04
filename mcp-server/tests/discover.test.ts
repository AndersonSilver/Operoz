import { describe, expect, it } from "vitest";

import { discoverOperations } from "../src/tools/discover.js";
import type { ToolOperation } from "../src/tools/registry/types.js";

function op(overrides: Partial<ToolOperation>): ToolOperation {
  return {
    name: "operoz_op",
    domain: "work_items",
    surface: "app",
    method: "GET",
    path: "/workspaces/{workspace_slug}/issues/",
    pathParams: ["workspace_slug"],
    description: "Lista issues",
    ...overrides,
  };
}

const FIXTURE: ToolOperation[] = [
  op({ name: "operoz_list_boards", domain: "boards", description: "Lista boards do projeto" }),
  op({ name: "operoz_create_board", domain: "boards", method: "POST", description: "Cria board" }),
  op({ name: "operoz_list_issues_app", domain: "work_items", description: "Lista issues (app)" }),
  op({ name: "operoz_list_pages", domain: "pages", description: "Lista páginas do projeto" }),
];

describe("discoverOperations", () => {
  it("filtra por domain", () => {
    const matches = discoverOperations(FIXTURE, { domain: "boards" });
    expect(matches.map((m) => m.name).sort()).toEqual(["operoz_create_board", "operoz_list_boards"]);
  });

  it("filtra por surface", () => {
    const matches = discoverOperations(FIXTURE, { surface: "app" });
    expect(matches.length).toBe(FIXTURE.filter((o) => o.surface === "app").length);
  });

  it("query vazia devolve os primeiros N na ordem original", () => {
    const matches = discoverOperations(FIXTURE, { limit: 2 });
    expect(matches.map((m) => m.name)).toEqual(["operoz_list_boards", "operoz_create_board"]);
  });

  it("ranqueia por relevância — match no nome pontua mais que match parcial na descrição", () => {
    const matches = discoverOperations(FIXTURE, { query: "board" });
    expect(matches[0].name).toContain("board");
    expect(matches[0].score ?? 0).toBeGreaterThan(0);
  });

  it("query sem nenhum match de relevância devolve vazio (não inventa resultado)", () => {
    const matches = discoverOperations(FIXTURE, { query: "xyz-termo-sem-relacao-nenhuma", domain: "boards" });
    expect(matches).toEqual([]);
  });

  it("limit é sempre entre 1 e 25", () => {
    expect(discoverOperations(FIXTURE, { limit: 0 }).length).toBeLessThanOrEqual(1);
    expect(discoverOperations(FIXTURE, { limit: 1000 }).length).toBeLessThanOrEqual(25);
  });
});
