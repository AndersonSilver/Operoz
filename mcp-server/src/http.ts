#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";

import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

import { configFromRequest } from "./auth-from-request.js";
import { OperisClient } from "./client.js";
import { loadConfig } from "./config.js";
import { createOperisMcpServer } from "./server.js";

type SessionState = {
  transport: StreamableHTTPServerTransport;
  client: OperisClient;
};

const baseConfig = loadConfig();
const port = Number(process.env.MCP_HTTP_PORT ?? "3100");
const host = process.env.MCP_HTTP_HOST ?? "127.0.0.1";
const allowedHosts = process.env.MCP_ALLOWED_HOSTS?.split(",").map((h) => h.trim()).filter(Boolean);

const transports: Record<string, SessionState> = {};

function reject(res: Response, status: number, message: string) {
  res.status(status).json({
    jsonrpc: "2.0",
    error: { code: -32000, message },
    id: null,
  });
}

async function mcpPostHandler(req: Request, res: Response) {
  const sessionId = req.headers["mcp-session-id"];
  const sid = typeof sessionId === "string" ? sessionId : undefined;

  try {
    if (sid && transports[sid]) {
      await transports[sid].transport.handleRequest(req, res, req.body);
      return;
    }

    if (!sid && isInitializeRequest(req.body)) {
      const userConfig = configFromRequest(req, baseConfig);
      if (!userConfig.apiKey && !userConfig.sessionCookie) {
        reject(
          res,
          401,
          "Credenciais em falta. Envie Authorization: Bearer <token> ou X-Api-Key (token Operis).",
        );
        return;
      }

      const client = new OperisClient(userConfig);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          transports[newSessionId] = { transport, client };
        },
      });

      transport.onclose = () => {
        const closedId = transport.sessionId;
        if (closedId && transports[closedId]) {
          delete transports[closedId];
        }
      };

      const server = createOperisMcpServer(client);
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    reject(res, 400, "Pedido inválido: falta mcp-session-id ou initialize.");
  } catch (error) {
    console.error("operis-mcp http:", error);
    if (!res.headersSent) {
      reject(res, 500, "Erro interno do servidor MCP.");
    }
  }
}

async function mcpGetHandler(req: Request, res: Response) {
  const sessionId = req.headers["mcp-session-id"];
  const sid = typeof sessionId === "string" ? sessionId : undefined;
  if (!sid || !transports[sid]) {
    res.status(400).send("Sessão MCP inválida ou expirada.");
    return;
  }
  await transports[sid].transport.handleRequest(req, res);
}

async function main() {
  const app = createMcpExpressApp({
    host,
    ...(allowedHosts?.length ? { allowedHosts } : {}),
  });

  app.post("/mcp", mcpPostHandler);
  app.get("/mcp", mcpGetHandler);
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, service: "operis-mcp", operis: baseConfig.baseUrl });
  });

  app.listen(port, host, () => {
    console.error(`Operis MCP HTTP em http://${host}:${port}/mcp → ${baseConfig.baseUrl}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
