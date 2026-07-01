#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { OperozClient } from "./client.js";
import { loadConfig } from "./config.js";
import { createOperozMcpServer } from "./server.js";

async function main() {
  const config = loadConfig();
  const client = new OperozClient(config);
  const server = createOperozMcpServer(client);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
