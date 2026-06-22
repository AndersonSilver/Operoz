import type { Tool } from "@modelcontextprotocol/sdk/types.js";

import type { ToolOperation } from "./types.js";
import { op } from "./types.js";

/** Perfil agent (Cursor): discover → execute */
export const AGENT_TOOL_NAMES = new Set([
  "operis_get_capabilities",
  "operis_discover",
  "operis_execute",
  "operis_sign_in",
  "operis_api_v1_request",
  "operis_api_app_request",
  "operis_get_openapi_schema",
]);

/** Perfil full: meta legado + registo completo */
export const FULL_META_TOOL_NAMES = new Set([...AGENT_TOOL_NAMES, "operis_list_operations"]);

export const META_TOOL_NAMES = FULL_META_TOOL_NAMES;

const CAPABILITIES_TOOL: Tool = {
  name: "operis_get_capabilities",
  description: "Mapa de domínios, contagens e perfil MCP activo (agent ou full).",
  inputSchema: { type: "object", properties: {} },
};

const DISCOVER_TOOL: Tool = {
  name: "operis_discover",
  description:
    "Descobre operações Operis por intenção (ex: list work items, create page). Devolve name, pathParams e método para operis_execute.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Intenção ou palavras-chave: list boards, update issue, workspace members, …",
      },
      domain: {
        type: "string",
        description: "Filtrar domínio: work_items, boards, pages, projects, workspaces, …",
      },
      surface: { type: "string", enum: ["v1", "app"], description: "v1 = API key; app = sessão (boards/web)" },
      limit: { type: "number", description: "Máximo de resultados (1–25, default 10)" },
    },
  },
};

const EXECUTE_TOOL: Tool = {
  name: "operis_execute",
  description:
    "Executa uma operação pelo name (de operis_discover). Path params no top-level; body/query como objetos.",
  inputSchema: {
    type: "object",
    properties: {
      operation: { type: "string", description: "Nome exacto da operação (ex: operis_work_items_list)" },
      body: { type: "object", description: "Corpo JSON (POST/PATCH/PUT)", additionalProperties: true },
      query: { type: "object", description: "Query string", additionalProperties: true },
    },
    required: ["operation"],
    additionalProperties: true,
  },
};

const LIST_OPERATIONS_TOOL: Tool = {
  name: "operis_list_operations",
  description: "Lista operações MCP (perfil full). No perfil agent, preferir operis_discover.",
  inputSchema: {
    type: "object",
    properties: {
      domain: { type: "string", description: "Filtrar por domínio: boards, pages, work_items, …" },
      surface: { type: "string", enum: ["v1", "app"] },
    },
  },
};

const OPENAPI_TOOL: Tool = {
  name: "operis_get_openapi_schema",
  description: "Schema OpenAPI em /api/schema/ (sessão ou DEBUG).",
  inputSchema: { type: "object", properties: {} },
};

const API_V1_TOOL: Tool = {
  name: "operis_api_v1_request",
  description: "Escape hatch: chamada genérica /api/v1/* com X-Api-Key.",
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
};

const API_APP_TOOL: Tool = {
  name: "operis_api_app_request",
  description: "Escape hatch: chamada genérica /api/* com sessão.",
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
};

const SIGN_IN_TOOL: Tool = {
  name: "operis_sign_in",
  description: "Login email/senha → cookie de sessão para API app.",
  inputSchema: {
    type: "object",
    properties: { email: { type: "string" }, password: { type: "string" } },
    required: ["email", "password"],
  },
};

/** Ferramentas expostas no perfil agent (default — optimizado para Cursor) */
export const AGENT_TOOLS: Tool[] = [
  CAPABILITIES_TOOL,
  DISCOVER_TOOL,
  EXECUTE_TOOL,
  SIGN_IN_TOOL,
  API_V1_TOOL,
  API_APP_TOOL,
  OPENAPI_TOOL,
];

/** Meta tools do perfil full (inclui list_operations legado) */
export const FULL_META_TOOLS: Tool[] = [...AGENT_TOOLS, LIST_OPERATIONS_TOOL];

/** @deprecated Use AGENT_TOOLS ou FULL_META_TOOLS */
export const META_TOOLS: Tool[] = FULL_META_TOOLS;

export const META_OPERATIONS: ToolOperation[] = [
  op("instance", "operis_get_instance", "Estado da instância Operis", "instances", "GET", "/", []),
  op("users", "operis_get_current_user", "Utilizador autenticado (v1)", "v1", "GET", "/users/me/", []),
];
