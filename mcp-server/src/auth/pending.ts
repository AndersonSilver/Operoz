import { randomBytes } from "node:crypto";

import type { AuthStore } from "./store.js";
import type { StoredPending } from "./types.js";

/**
 * Formato do ticket: base64url de 32 bytes (43 chars). Aceitamos uma faixa em vez de
 * tamanho exato para não amarrar o validador ao gerador.
 */
const TICKET_PATTERN = /^[A-Za-z0-9_-]{20,128}$/;

/** Limite do `client_name` renderizado na tela de consentimento (é auto-declarado pelo cliente). */
export const MAX_CLIENT_NAME_LENGTH = 120;

export function generateTicket(): string {
  return randomBytes(32).toString("base64url");
}

export function isValidTicketFormat(ticket: unknown): ticket is string {
  return typeof ticket === "string" && TICKET_PATTERN.test(ticket);
}

/** Nome auto-declarado: cortar e higienizar antes de guardar (renderizado como texto puro). */
export function sanitizeClientName(raw: string | undefined): string {
  // Remove caracteres de controlo (incluindo quebras de linha) — a UI renderiza como texto puro.
  const cleaned = (raw ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const fallback = cleaned || "Aplicação desconhecida";
  return fallback.slice(0, MAX_CLIENT_NAME_LENGTH);
}

/** Vista pública do pendente — **sem** `redirect_uri` nem `state` (não pode virar oráculo de redirect). */
export type PendingPublicView = {
  client_name: string;
  client_uri?: string;
  scopes: string[];
  expires_in: number;
};

export type CreatePendingInput = {
  clientId: string;
  clientName?: string;
  clientUri?: string;
  redirectUri: string;
  codeChallenge: string;
  state?: string;
  scopes: string[];
  resource?: string;
};

export class PendingAuthorizations {
  constructor(
    private readonly store: AuthStore,
    private readonly ttlSeconds: number,
    private readonly now: () => number = () => Date.now()
  ) {}

  async create(input: CreatePendingInput): Promise<{ ticket: string; pending: StoredPending }> {
    const ticket = generateTicket();
    const createdAt = this.now();
    const pending: StoredPending = {
      clientId: input.clientId,
      clientName: sanitizeClientName(input.clientName),
      clientUri: input.clientUri,
      redirectUri: input.redirectUri,
      codeChallenge: input.codeChallenge,
      state: input.state,
      scopes: input.scopes,
      resource: input.resource,
      createdAt,
      expiresAt: createdAt + this.ttlSeconds * 1000,
    };
    await this.store.putPending(ticket, pending);
    return { ticket, pending };
  }

  /** Lookup idempotente (a pessoa pode dar refresh na tela de consentimento). */
  async lookup(ticket: string): Promise<PendingPublicView | undefined> {
    if (!isValidTicketFormat(ticket)) return undefined;
    const pending = await this.store.peekPending(ticket);
    if (!pending) return undefined;
    return {
      client_name: pending.clientName,
      ...(pending.clientUri ? { client_uri: pending.clientUri } : {}),
      scopes: pending.scopes,
      expires_in: Math.max(0, Math.floor((pending.expiresAt - this.now()) / 1000)),
    };
  }

  /** Registo completo (uso interno: `/oauth/web-callback`). Não consome. */
  async lookupRaw(ticket: string): Promise<StoredPending | undefined> {
    if (!isValidTicketFormat(ticket)) return undefined;
    return this.store.peekPending(ticket);
  }

  /** Single-use: a primeira chamada bem-sucedida remove o ticket. */
  async consume(ticket: string): Promise<StoredPending | undefined> {
    if (!isValidTicketFormat(ticket)) return undefined;
    return this.store.consumePending(ticket);
  }
}
