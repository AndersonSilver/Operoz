#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { OperisClient } from "./client.js";
import { loadConfig } from "./config.js";
import { createOperisMcpServer } from "./server.js";

async function main() {
  const config = loadConfig();
  const client = new OperisClient(config);
  const server = createOperisMcpServer(client);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
