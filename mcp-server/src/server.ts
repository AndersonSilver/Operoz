import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import type { OperozClient } from "./client.js";
import { OPEROZ_TOOLS } from "./tools/definitions.js";
import { handleToolCall } from "./tools/handlers.js";

export function createOperozMcpServer(client: OperozClient): Server {
  const server = new Server(
    {
      name: "operoz",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: OPEROZ_TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name } = request.params;
    const args = (request.params.arguments ?? {}) as Record<string, unknown>;
    return handleToolCall(client, name, args);
  });

  return server;
}
