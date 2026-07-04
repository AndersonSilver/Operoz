import { describe, expect, it, vi } from "vitest";

import type { OperozClient } from "../src/client.js";
import { buildPath, executeOperation, findOperation } from "../src/tools/registry/execute.js";
import type { ToolOperation } from "../src/tools/registry/types.js";

describe("buildPath", () => {
  it("substitui parâmetros de path e faz encode", () => {
    const path = buildPath("/workspaces/{workspace_slug}/projects/{project_id}/", {
      workspace_slug: "acme co",
      project_id: "123",
    });
    expect(path).toBe("/workspaces/acme%20co/projects/123/");
  });

  it("lança erro quando falta parâmetro obrigatório", () => {
    expect(() => buildPath("/workspaces/{workspace_slug}/", {})).toThrow(/workspace_slug/);
  });

  it("lança erro quando o parâmetro é string vazia", () => {
    expect(() => buildPath("/workspaces/{workspace_slug}/", { workspace_slug: "  " })).toThrow();
  });
});

describe("findOperation", () => {
  const ops: ToolOperation[] = [
    {
      name: "operoz_list_boards",
      domain: "boards",
      surface: "app",
      method: "GET",
      path: "/workspaces/{workspace_slug}/boards/",
      pathParams: ["workspace_slug"],
      description: "Lista boards",
    },
  ];

  it("encontra operação pelo nome", () => {
    expect(findOperation(ops, "operoz_list_boards")?.domain).toBe("boards");
  });

  it("devolve undefined para nome desconhecido", () => {
    expect(findOperation(ops, "operoz_inexistente")).toBeUndefined();
  });
});

describe("executeOperation", () => {
  function fakeClient() {
    return { request: vi.fn().mockResolvedValue({ ok: true }) } as unknown as OperozClient;
  }

  it("resolve o path e chama client.request com a surface certa", async () => {
    const client = fakeClient();
    const op: ToolOperation = {
      name: "operoz_get_instance",
      domain: "instance",
      surface: "instances",
      method: "GET",
      path: "/",
      pathParams: [],
      description: "Estado da instância",
    };

    await executeOperation(client, op, {});

    expect(client.request).toHaveBeenCalledWith(
      expect.objectContaining({ surface: "instances", method: "GET", path: "/" })
    );
  });

  it("só envia body quando a operação declara body: true", async () => {
    const client = fakeClient();
    const op: ToolOperation = {
      name: "operoz_create_board",
      domain: "boards",
      surface: "app",
      method: "POST",
      path: "/workspaces/{workspace_slug}/boards/",
      pathParams: ["workspace_slug"],
      description: "Cria board",
      body: true,
    };

    await executeOperation(client, op, { workspace_slug: "acme", body: { name: "Sprint 1" } });

    expect(client.request).toHaveBeenCalledWith(
      expect.objectContaining({ path: "/workspaces/acme/boards/", body: { name: "Sprint 1" } })
    );
  });

  it("ignora body quando a operação não declara body", async () => {
    const client = fakeClient();
    const op: ToolOperation = {
      name: "operoz_list_boards",
      domain: "boards",
      surface: "app",
      method: "GET",
      path: "/workspaces/{workspace_slug}/boards/",
      pathParams: ["workspace_slug"],
      description: "Lista boards",
    };

    await executeOperation(client, op, { workspace_slug: "acme", body: { name: "ignorado" } });

    expect(client.request).toHaveBeenCalledWith(expect.objectContaining({ body: undefined }));
  });
});
