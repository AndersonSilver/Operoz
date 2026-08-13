#!/usr/bin/env node
/* oxlint-disable no-async-endpoint-handlers -- Express 5 / handlers com await explícito */
/* oxlint-disable eslint-plugin-unicorn(prefer-add-event-listener) -- SDK transport.onclose */
import { randomUUID } from "node:crypto";
import express, { type Request, type Response } from "express";

import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

import { loadOAuthConfig, loadTrustProxy, OAuthConfigError } from "./auth/oauth-config.js";
import { credentialFingerprint, resolveRequestAuth, wwwAuthenticateHeader } from "./auth/request-auth.js";
import { createOAuthRouter, type OAuthRuntime } from "./auth/router.js";
import { OperozClient } from "./client.js";
import type { OperozConfig } from "./config.js";
import { loadConfig } from "./config.js";
import { createOperozMcpServer } from "./server.js";

type SessionState = {
  transport: StreamableHTTPServerTransport;
  client: OperozClient;
  /** SHA-256 da credencial que criou a sessão — impede sequestro de sessão por id vazado. */
  fingerprint: string;
};

const baseConfig = loadConfig();
const port = Number(process.env.MCP_HTTP_PORT ?? "3100");
const host = process.env.MCP_HTTP_HOST ?? "127.0.0.1";
const allowedHosts = process.env.MCP_ALLOWED_HOSTS?.split(",")
  .map((h) => h.trim())
  .filter(Boolean);

const transports: Record<string, SessionState> = {};

let oauth: OAuthRuntime | undefined;

function reject(res: Response, status: number, message: string) {
  res.status(status).json({
    jsonrpc: "2.0",
    error: { code: -32000, message },
    id: null,
  });
}

/** 401 com `WWW-Authenticate` (só adicionado — o corpo JSON-RPC continua igual). */
function rejectUnauthorized(res: Response, message: string) {
  if (oauth) {
    res.setHeader("WWW-Authenticate", wwwAuthenticateHeader("invalid_token", message, oauth.resourceMetadataUrl));
  }
  reject(res, 401, message);
}

async function mcpPostHandler(req: Request, res: Response) {
  const sessionId = req.headers["mcp-session-id"];
  const sid = typeof sessionId === "string" ? sessionId : undefined;

  try {
    const resolved = await resolveRequestAuth(req, baseConfig, oauth?.provider);

    if (sid && transports[sid]) {
      if (resolved.kind === "unauthorized") {
        rejectUnauthorized(res, resolved.error);
        return;
      }
      // Revalida a credencial a cada pedido: tokens OAuth expiram e ids de sessão
      // não podem valer como credencial por si só.
      if (transports[sid].fingerprint !== credentialFingerprint(resolved.config)) {
        rejectUnauthorized(res, "Credencial não corresponde à sessão MCP.");
        return;
      }
      await transports[sid].transport.handleRequest(req, res, req.body);
      return;
    }

    if (!sid && isInitializeRequest(req.body)) {
      if (resolved.kind === "unauthorized") {
        rejectUnauthorized(res, resolved.error);
        return;
      }

      const userConfig = resolved.config;
      const client = new OperozClient(userConfig);
      const fingerprint = credentialFingerprint(userConfig);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          transports[newSessionId] = { transport, client, fingerprint };
        },
      });

      transport.onclose = () => {
        const closedId = transport.sessionId;
        if (closedId && transports[closedId]) {
          delete transports[closedId];
        }
      };

      const server = createOperozMcpServer(client);
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    reject(res, 400, "Pedido inválido: falta mcp-session-id ou initialize.");
  } catch (error) {
    console.error("operoz-mcp http:", error);
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

  // Antes: qualquer `mcp-session-id` conhecido era aceite sem checar credencial —
  // um id vazado permitia sequestro de sessão entre utilizadores.
  const resolved = await resolveRequestAuth(req, baseConfig, oauth?.provider);
  if (resolved.kind === "unauthorized") {
    rejectUnauthorized(res, resolved.error);
    return;
  }
  if (transports[sid].fingerprint !== credentialFingerprint(resolved.config)) {
    rejectUnauthorized(res, "Credencial não corresponde à sessão MCP.");
    return;
  }

  await transports[sid].transport.handleRequest(req, res);
}

async function mcpDeleteHandler(req: Request, res: Response) {
  const sessionId = req.headers["mcp-session-id"];
  const sid = typeof sessionId === "string" ? sessionId : undefined;
  if (!sid || !transports[sid]) {
    res.status(400).send("Sessão MCP inválida ou expirada.");
    return;
  }

  const resolved = await resolveRequestAuth(req, baseConfig, oauth?.provider);
  if (resolved.kind === "unauthorized") {
    rejectUnauthorized(res, resolved.error);
    return;
  }
  if (transports[sid].fingerprint !== credentialFingerprint(resolved.config)) {
    rejectUnauthorized(res, "Credencial não corresponde à sessão MCP.");
    return;
  }

  await transports[sid].transport.handleRequest(req, res);
}

function setupOAuth(): OAuthRuntime | undefined {
  try {
    const oauthConfig = loadOAuthConfig();
    if (!oauthConfig) return undefined;
    if (oauthConfig.callbackSecrets.length === 0) {
      console.error(
        "operoz-mcp: OAuth ligado sem MCP_WEB_CALLBACK_SECRET — /oauth/web-callback vai responder 503 até configurar."
      );
    }
    return createOAuthRouter({ config: oauthConfig });
  } catch (error) {
    if (error instanceof OAuthConfigError) {
      // Config OAuth inválida não pode derrubar o servidor: quebraria todos os
      // clientes legados com token estático, que não dependem de OAuth nenhum.
      console.error("operoz-mcp: OAuth desligado por erro de configuração —", error.message);
      return undefined;
    }
    throw error;
  }
}

async function main() {
  const listenHost = host === "0.0.0.0" ? "0.0.0.0" : host;

  const root = express();
  // Atrás do Nginx Proxy Manager. TEM de vir antes de qualquer rota com
  // `express-rate-limit` (v8 lança ERR_ERL_UNEXPECTED_X_FORWARDED_FOR sem isto).
  root.set("trust proxy", loadTrustProxy());

  oauth = setupOAuth();

  root.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, service: "operoz-mcp", operoz: baseConfig.baseUrl, oauth: Boolean(oauth) });
  });

  // O router OAuth tem de estar montado na raiz e antes das rotas /mcp.
  if (oauth) {
    root.use(oauth.router);
  }

  const mcpApp = createMcpExpressApp({
    host: listenHost,
    ...(allowedHosts?.length ? { allowedHosts } : {}),
  });
  mcpApp.post("/mcp", mcpPostHandler);
  mcpApp.get("/mcp", mcpGetHandler);
  mcpApp.delete("/mcp", mcpDeleteHandler);
  root.use(mcpApp);

  root.listen(port, listenHost, () => {
    console.error(
      `Operoz MCP HTTP em http://${listenHost}:${port}/mcp → ${baseConfig.baseUrl}` +
        (oauth ? ` (OAuth: ${oauth.provider.config.issuerUrl.href})` : " (OAuth desligado)")
    );
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
