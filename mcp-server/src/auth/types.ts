import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";

/**
 * Referência ao sujeito (utilizador Operoz) por trás de um grant/token.
 *
 * `apiToken` é o único campo em texto puro no store — é o credential Operoz real
 * que precisa ser reenviado à API a cada pedido MCP. Tratar o ficheiro do store
 * como um `.env` (modo 0600, fora de backups externos).
 */
export type SubjectRef = {
  /** UUID do utilizador Operoz (informativo — usado em log/consentimento). */
  userId?: string;
  /** E-mail do utilizador Operoz (informativo). */
  userEmail?: string;
  /** UUID do `APIToken` no Django — permite revogação (DELETE /api/users/api-tokens/<id>/). */
  apiTokenId?: string;
  /** Token Operoz em texto puro (`operoz_api_…`). NUNCA logar. */
  apiToken: string;
};

/** Cliente registado por Dynamic Client Registration (RFC 7591). */
export type StoredClient = {
  info: OAuthClientInformationFull;
  /** epoch ms — usado para eviction LRU quando `MCP_OAUTH_MAX_CLIENTS` é excedido. */
  lastUsedAt: number;
  createdAt: number;
};

/** Authorization code emitido depois do consentimento (single-use, TTL curto). */
export type StoredGrant = {
  /** SHA-256 do authorization code (a chave do mapa já é o hash; aqui fica redundante para debug). */
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scopes: string[];
  /** `resource` (RFC 8707) normalizado, se o cliente enviou. */
  resource?: string;
  subject: SubjectRef;
  expiresAt: number;
  createdAt: number;
};

export type StoredTokenKind = "access" | "refresh";

/** Access ou refresh token emitido por nós (prefixos `ozmcp_at_` / `ozmcp_rt_`). */
export type StoredToken = {
  kind: StoredTokenKind;
  clientId: string;
  scopes: string[];
  resource?: string;
  subject: SubjectRef;
  expiresAt: number;
  createdAt: number;
  /** epoch ms da última revalidação do `subject.apiToken` contra a API Operoz. */
  lastValidatedAt?: number;
};

/** Autorização pendente: criada no `/authorize`, consumida no `/oauth/web-callback`. */
export type StoredPending = {
  clientId: string;
  clientName: string;
  clientUri?: string;
  redirectUri: string;
  codeChallenge: string;
  state?: string;
  scopes: string[];
  resource?: string;
  expiresAt: number;
  createdAt: number;
};

/**
 * Recibo de um ticket já consumido com sucesso pelo `/oauth/web-callback`.
 *
 * Existe para tornar o callback **idempotente**: o `mcp-server` commita o grant
 * antes de responder ao Django, então uma resposta perdida (timeout de rede) deixa
 * o Django sem saber que já deu certo. Guardando o `redirectUrl` emitido, a mesma
 * chamada repetida devolve exatamente a mesma resposta em vez de `409` — o que
 * permite ao Django retentar em vez de apagar um `APIToken` que já está em uso.
 *
 * Fica no store durável (não em memória) para sobreviver a restart do container.
 */
export type StoredConsumedTicket = {
  clientId: string;
  /**
   * `<redirect_uri>?code=…&state=…` devolvido na primeira chamada bem-sucedida.
   *
   * `undefined` = reserva: o ticket já foi reclamado por uma chamada em curso, mas
   * o `code` ainda não foi emitido. Uma chamada concorrente que veja isto recebe
   * `409` (ambíguo, retentável) em vez de `400` (rejeição definitiva, que faria o
   * Django apagar um `APIToken` que está prestes a ficar em uso).
   */
  redirectUrl?: string;
  consumedAt: number;
  expiresAt: number;
};

/** Formato serializado do ficheiro JSON. Chaves são hashes SHA-256 (hex), exceto `clients`. */
export type StoreSnapshot = {
  version: 1;
  /** clientId (público, não é segredo) → cliente. */
  clients: Record<string, StoredClient>;
  /** sha256(code) → grant. */
  grants: Record<string, StoredGrant>;
  /** sha256(token) → token. */
  tokens: Record<string, StoredToken>;
  /** sha256(ticket) → pendente. */
  pendings: Record<string, StoredPending>;
  /** sha256(ticket) → recibo de consumo (idempotência do callback). */
  consumed: Record<string, StoredConsumedTicket>;
};

export function emptySnapshot(): StoreSnapshot {
  return { version: 1, clients: {}, grants: {}, tokens: {}, pendings: {}, consumed: {} };
}
