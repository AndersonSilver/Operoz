import type { Tool } from "@modelcontextprotocol/sdk/types.js";

import type { ToolOperation } from "./types.js";
import { op } from "./types.js";

/** Ferramentas meta (não vêm do registo de rotas) */
export const META_TOOL_NAMES = new Set([
  "operis_get_capabilities",
  "operis_list_operations",
  "operis_get_openapi_schema",
  "operis_api_v1_request",
  "operis_api_app_request",
  "operis_sign_in",
]);

export const META_TOOLS: Tool[] = [
  {
    name: "operis_get_capabilities",
    description: "Mapa de domínios e contagens de ferramentas MCP Operis.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "operis_list_operations",
    description:
      "Lista todas as operações MCP disponíveis (nome, domínio, método, path). Use query domain para filtrar.",
    inputSchema: {
      type: "object",
      properties: {
        domain: { type: "string", description: "Filtrar por domínio: boards, pages, work_items, …" },
        surface: { type: "string", enum: ["v1", "app"] },
      },
    },
  },
  {
    name: "operis_get_openapi_schema",
    description: "Schema OpenAPI em /api/schema/ (sessão ou DEBUG).",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "operis_api_v1_request",
    description: "Chamada genérica /api/v1/* com X-Api-Key.",
    inputSchema: {
      type: "object",
      properties: {
        method: { type: "string", enum: ["GET", "POST", "PATCH", "PUT", "DELETE"] },
        path: { type: "string" },
        query: { type: "object", additionalProperties: true },
        body: { type: "object", additionalProperties: true },
      },
      required: ["method", "path"],
    },
  },
  {
    name: "operis_api_app_request",
    description: "Chamada genérica /api/* com sessão.",
    inputSchema: {
      type: "object",
      properties: {
        method: { type: "string", enum: ["GET", "POST", "PATCH", "PUT", "DELETE"] },
        path: { type: "string" },
        query: { type: "object", additionalProperties: true },
        body: { type: "object", additionalProperties: true },
      },
      required: ["method", "path"],
    },
  },
  {
    name: "operis_sign_in",
    description: "Login email/senha → cookie de sessão para API app.",
    inputSchema: {
      type: "object",
      properties: { email: { type: "string" }, password: { type: "string" } },
      required: ["email", "password"],
    },
  },
];

export const META_OPERATIONS: ToolOperation[] = [
  op("instance", "operis_get_instance", "Estado da instância Operis", "instances", "GET", "/", []),
  op("users", "operis_get_current_user", "Utilizador autenticado (v1)", "v1", "GET", "/users/me/", []),
];
