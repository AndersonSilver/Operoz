import type { Tool } from "@modelcontextprotocol/sdk/types.js";

import type { ToolOperation } from "./types.js";

export function operationToMcpTool(operation: ToolOperation): Tool {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const param of operation.pathParams) {
    properties[param] = { type: "string", description: `Path: ${param}` };
    required.push(param);
  }

  if (operation.body) {
    properties.body = {
      type: "object",
      description: "Corpo JSON do pedido",
      additionalProperties: true,
    };
    if (["POST", "PATCH", "PUT"].includes(operation.method)) {
      required.push("body");
    }
  }

  if (operation.query) {
    properties.query = {
      type: "object",
      description: "Query string (filtros, paginação)",
      additionalProperties: true,
    };
  }

  return {
    name: operation.name,
    description: `[${operation.domain}] ${operation.description} (${operation.method} ${operation.path})`,
    inputSchema: {
      type: "object",
      properties: properties as Record<string, object>,
      required: required.length ? required : undefined,
    },
  };
}
