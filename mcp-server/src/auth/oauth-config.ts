/** Prefixos dos tokens que **nós** emitimos — discriminador de legado vs OAuth. */
export const ACCESS_TOKEN_PREFIX = "ozmcp_at_";
export const REFRESH_TOKEN_PREFIX = "ozmcp_rt_";
export const AUTHORIZATION_CODE_PREFIX = "ozmcp_ac_";

export type OAuthConfig = {
  issuerUrl: URL;
  /** Identificador de recurso RFC 8707/9728 (default `${issuer}/mcp`). */
  resourceUrl: URL;
  /** Base do `apps/web` para onde o `/authorize` redireciona (sem barra final). */
  webBaseUrl: string;
  /** Allowlist de `Origin` para o CORS de `/oauth/pending/*`. */
  webOrigins: string[];
  storePath: string;
  accessTokenTtl: number;
  refreshTokenTtl: number;
  codeTtl: number;
  pendingTtl: number;
  scopes: string[];
  maxClients: number;
  /**
   * Lista de segredos HMAC aceites em `/oauth/web-callback`. CSV desde o dia 1 para
   * permitir rotação em duas etapas (adiciona-novo → remove-antigo) sem downtime.
   * Vazia = endpoint responde 503.
   */
  callbackSecrets: string[];
  revalidateInterval: number;
  tokenLabelPrefix: string;
  /** Base da API Operoz (reaproveita `OPEROZ_API_BASE_URL`). */
  operozBaseUrl: string;
};

export class OAuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OAuthConfigError";
  }
}

type Env = Record<string, string | undefined>;

function readString(env: Env, key: string): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

function readNumber(env: Env, key: string, fallback: number): number {
  const raw = readString(env, key);
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new OAuthConfigError(`${key} deve ser um número positivo (recebido: ${raw}).`);
  }
  return parsed;
}

function readCsv(env: Env, key: string): string[] {
  const raw = readString(env, key);
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

/** Normaliza uma origem (`scheme://host[:port]`) para comparação de allowlist. */
export function normalizeOrigin(raw: string): string | undefined {
  try {
    return new URL(raw).origin;
  } catch {
    return undefined;
  }
}

/**
 * Normaliza um identificador de recurso RFC 8707: sem fragmento e sem barra final.
 * Comparar strings cruas causaria falsos negativos (risco 1 do plano).
 */
export function normalizeResource(raw: string | URL | undefined): string | undefined {
  if (raw === undefined) return undefined;
  let url: URL;
  try {
    url = typeof raw === "string" ? new URL(raw) : new URL(raw.href);
  } catch {
    return undefined;
  }
  url.hash = "";
  const href = url.href;
  return stripTrailingSlash(href);
}

function truthy(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return undefined;
}

/**
 * Lê a configuração OAuth do ambiente.
 *
 * Devolve `undefined` quando o OAuth está desligado (sem `MCP_OAUTH_ISSUER_URL`, ou
 * `MCP_OAUTH_ENABLED=false`). Lança `OAuthConfigError` quando está ligado mas mal
 * configurado — quem chama decide se aborta ou apenas desliga o OAuth.
 */
export function loadOAuthConfig(env: Env = process.env): OAuthConfig | undefined {
  const issuerRaw = readString(env, "MCP_OAUTH_ISSUER_URL");
  const explicitEnabled = truthy(readString(env, "MCP_OAUTH_ENABLED"));

  if (explicitEnabled === false) return undefined;
  if (!issuerRaw) {
    if (explicitEnabled === true) {
      throw new OAuthConfigError("MCP_OAUTH_ENABLED=true exige MCP_OAUTH_ISSUER_URL.");
    }
    return undefined;
  }

  let issuerUrl: URL;
  try {
    issuerUrl = new URL(stripTrailingSlash(issuerRaw));
  } catch {
    throw new OAuthConfigError(`MCP_OAUTH_ISSUER_URL inválido: ${issuerRaw}`);
  }

  const resourceRaw = readString(env, "MCP_OAUTH_RESOURCE_URL") ?? `${stripTrailingSlash(issuerUrl.href)}/mcp`;
  let resourceUrl: URL;
  try {
    resourceUrl = new URL(resourceRaw);
  } catch {
    throw new OAuthConfigError(`MCP_OAUTH_RESOURCE_URL inválido: ${resourceRaw}`);
  }

  const webBaseRaw = readString(env, "MCP_OAUTH_WEB_BASE_URL");
  if (!webBaseRaw) {
    throw new OAuthConfigError(
      "MCP_OAUTH_WEB_BASE_URL é obrigatório com OAuth ligado — é para lá que o /authorize redireciona."
    );
  }
  let webBaseUrl: string;
  try {
    webBaseUrl = stripTrailingSlash(new URL(webBaseRaw).href);
  } catch {
    throw new OAuthConfigError(`MCP_OAUTH_WEB_BASE_URL inválido: ${webBaseRaw}`);
  }

  const originsRaw = readCsv(env, "MCP_OAUTH_WEB_ORIGINS");
  const originCandidates = originsRaw.length > 0 ? originsRaw : [webBaseUrl];
  const webOrigins: string[] = [];
  for (const candidate of originCandidates) {
    const origin = normalizeOrigin(candidate);
    if (!origin) {
      throw new OAuthConfigError(`MCP_OAUTH_WEB_ORIGINS contém origem inválida: ${candidate}`);
    }
    if (!webOrigins.includes(origin)) webOrigins.push(origin);
  }

  const scopes = readCsv(env, "MCP_OAUTH_SCOPES");

  return {
    issuerUrl,
    resourceUrl,
    webBaseUrl,
    webOrigins,
    storePath: readString(env, "MCP_OAUTH_STORE_PATH") ?? "/data/oauth-store.json",
    accessTokenTtl: readNumber(env, "MCP_OAUTH_ACCESS_TOKEN_TTL", 3600),
    refreshTokenTtl: readNumber(env, "MCP_OAUTH_REFRESH_TOKEN_TTL", 2_592_000),
    codeTtl: readNumber(env, "MCP_OAUTH_CODE_TTL", 120),
    pendingTtl: readNumber(env, "MCP_OAUTH_PENDING_TTL", 600),
    scopes: scopes.length > 0 ? scopes : ["mcp:tools"],
    maxClients: readNumber(env, "MCP_OAUTH_MAX_CLIENTS", 500),
    callbackSecrets: readCsv(env, "MCP_WEB_CALLBACK_SECRET"),
    revalidateInterval: readNumber(env, "MCP_OAUTH_REVALIDATE_INTERVAL", 300),
    tokenLabelPrefix: readString(env, "MCP_OAUTH_TOKEN_LABEL_PREFIX") ?? "MCP OAuth",
    operozBaseUrl: stripTrailingSlash(readString(env, "OPEROZ_API_BASE_URL") ?? "http://localhost:8000"),
  };
}

/** Hop count do `trust proxy` do Express (atrás do Nginx Proxy Manager). */
export function loadTrustProxy(env: Env = process.env): number | boolean {
  const raw = readString(env, "MCP_TRUST_PROXY");
  if (raw === undefined) return 1;
  const asBoolean = truthy(raw);
  if (asBoolean !== undefined) return asBoolean;
  const parsed = Number(raw);
  if (Number.isInteger(parsed) && parsed >= 0) return parsed;
  return 1;
}
