import type { IncomingMessage } from "node:http";

import type { OperozConfig } from "./config.js";
import { loadConfig } from "./config.js";

/** Extrai credenciais do pedido HTTP (MCP centralizado — um token por utilizador). */
export function configFromRequest(req: IncomingMessage, baseDefaults?: OperozConfig): OperozConfig {
  const defaults = baseDefaults ?? loadConfig();

  const auth = req.headers.authorization;
  let apiKey = defaults.apiKey;
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
    apiKey = auth.slice(7).trim();
  }

  const headerKey = req.headers["x-api-key"];
  if (typeof headerKey === "string" && headerKey.trim()) {
    apiKey = headerKey.trim();
  }

  const sessionHeader = req.headers["x-operoz-session"];
  const sessionCookie =
    typeof sessionHeader === "string" && sessionHeader.trim() ? sessionHeader.trim() : defaults.sessionCookie;

  return {
    baseUrl: defaults.baseUrl,
    apiKey,
    sessionCookie,
  };
}
