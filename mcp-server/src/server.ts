import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import type { OperisClient } from "./client.js";
import { CONSULTORIA_TOOLS, handleConsultoriaCall } from "./consultoria/index.js";
import { OPERIS_TOOLS } from "./tools/definitions.js";
import { handleToolCall } from "./tools/handlers.js";

export function createOperisMcpServer(client: OperisClient): Server {
  const server = new Server(
    {
      name: "operis",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [...OPERIS_TOOLS, ...CONSULTORIA_TOOLS],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name } = request.params;
    const args = (request.params.arguments ?? {}) as Record<string, unknown>;
    if (name.startsWith("consultoria_")) {
      return handleConsultoriaCall(client, name, args);
    }
    return handleToolCall(client, name, args);
  });

  return server;
}
