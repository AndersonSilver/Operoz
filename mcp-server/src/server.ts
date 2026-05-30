import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import type { OperisClient } from "./client.js";
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
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: OPERIS_TOOLS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const args = (request.params.arguments ?? {}) as Record<string, unknown>;
    return handleToolCall(client, request.params.name, args);
  });

  return server;
}
