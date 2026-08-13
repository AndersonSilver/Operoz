import { createHash } from "node:crypto";
import type { IncomingMessage } from "node:http";

import { InvalidTokenError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

import { configFromRequest } from "../auth-from-request.js";
import type { OperozConfig } from "../config.js";
import { ACCESS_TOKEN_PREFIX } from "./oauth-config.js";

export type ResolvedAuth =
  | { kind: "legacy"; config: OperozConfig }
  | { kind: "oauth"; config: OperozConfig; authInfo: AuthInfo }
  | { kind: "unauthorized"; error: string };

export type OAuthVerifier = {
  verifyAccessToken(token: string): Promise<AuthInfo>;
};

/**
 * Header `WWW-Authenticate` equivalente ao que o `requireBearerAuth` do SDK geraria.
 * Não usamos esse middleware em `/mcp` de propósito: ele rejeita qualquer pedido sem
 * `Authorization`, o que quebraria clientes que só mandam `X-Api-Key`.
 */
export function wwwAuthenticateHeader(errorCode: string, description: string, resourceMetadataUrl?: string): string {
  let header = `Bearer error="${errorCode}", error_description="${description}"`;
  if (resourceMetadataUrl) {
    header += `, resource_metadata="${resourceMetadataUrl}"`;
  }
  return header;
}

function bearerToken(req: IncomingMessage): string | undefined {
  const auth = req.headers.authorization;
  if (typeof auth !== "string") return undefined;
  if (!auth.toLowerCase().startsWith("bearer ")) return undefined;
  const token = auth.slice(7).trim();
  return token || undefined;
}

/**
 * Discriminador legado-vs-OAuth. Tabela de decisão (§3 do plano):
 *
 * ```
 * 1. X-Api-Key presente                 -> LEGADO
 * 2. X-Operoz-Session presente          -> LEGADO
 * 3. Authorization: Bearer <t>
 *      t começa com "ozmcp_at_"         -> OAUTH
 *      caso contrário                   -> LEGADO
 * 4. nada                               -> 401
 * ```
 *
 * O prefixo discriminante é o **nosso** (`ozmcp_at_`), nunca `operoz_api_`: tokens
 * anteriores ao rebrand Plane→Operoz podem ser `plane_api_…`, e qualquer config
 * existente tem de continuar a funcionar byte a byte.
 */
export async function resolveRequestAuth(
  req: IncomingMessage,
  baseConfig: OperozConfig,
  verifier?: OAuthVerifier
): Promise<ResolvedAuth> {
  const headerKey = req.headers["x-api-key"];
  const hasApiKeyHeader = typeof headerKey === "string" && headerKey.trim().length > 0;

  const sessionHeader = req.headers["x-operoz-session"];
  const hasSessionHeader = typeof sessionHeader === "string" && sessionHeader.trim().length > 0;

  if (hasApiKeyHeader || hasSessionHeader) {
    return { kind: "legacy", config: configFromRequest(req, baseConfig) };
  }

  const token = bearerToken(req);

  if (token?.startsWith(ACCESS_TOKEN_PREFIX)) {
    if (!verifier) {
      return { kind: "unauthorized", error: "OAuth não está ativo neste servidor." };
    }
    let authInfo: AuthInfo;
    try {
      authInfo = await verifier.verifyAccessToken(token);
    } catch (error) {
      const message = error instanceof InvalidTokenError ? error.message : "Access token inválido.";
      return { kind: "unauthorized", error: message };
    }

    const apiToken = authInfo.extra?.apiToken;
    if (typeof apiToken !== "string" || !apiToken) {
      return { kind: "unauthorized", error: "Autorização sem credencial Operoz associada." };
    }

    return {
      kind: "oauth",
      config: { baseUrl: baseConfig.baseUrl, apiKey: apiToken },
      authInfo,
    };
  }

  if (token) {
    // Token estático colado no `Authorization: Bearer` — caminho legado, inalterado.
    return { kind: "legacy", config: configFromRequest(req, baseConfig) };
  }

  // Sem nenhum header de credencial: ainda assim pode haver defaults de ambiente
  // (OPEROZ_API_KEY / OPEROZ_SESSION_COOKIE) — o comportamento legado é mantido.
  const fallback = configFromRequest(req, baseConfig);
  if (fallback.apiKey || fallback.sessionCookie) {
    return { kind: "legacy", config: fallback };
  }

  return {
    kind: "unauthorized",
    error: "Credenciais em falta. Envie Authorization: Bearer <token> ou X-Api-Key (token Operoz).",
  };
}

/**
 * Fingerprint da credencial efetiva de uma sessão MCP. Gravado na sessão e
 * recomparado a cada pedido, para que um `mcp-session-id` vazado não valha por si
 * só como credencial.
 *
 * A entrada do hash é um array JSON, não uma concatenação com delimitador: o
 * `sessionCookie` contém espaços e `;` de verdade (vem de `cookies.join("; ")` no
 * `signIn`), então qualquer delimitador simples seria ambíguo — `("tok", "en x")` e
 * `("tok en", "x")` colidiriam no mesmo fingerprint, anulando exatamente a
 * proteção anti-sequestro que ele existe para dar. O JSON escapa aspas e barras
 * invertidas e a estrutura de array delimita as duas partes sem ambiguidade.
 */
export function credentialFingerprint(config: OperozConfig): string {
  const material = JSON.stringify([config.apiKey ?? "", config.sessionCookie ?? ""]);
  return createHash("sha256").update(material, "utf8").digest("hex");
}
