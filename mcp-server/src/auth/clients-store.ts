import type { OAuthRegisteredClientsStore } from "@modelcontextprotocol/sdk/server/auth/clients.js";
import { InvalidClientMetadataError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import type { OAuthClientInformationFull } from "@modelcontextprotocol/sdk/shared/auth.js";

import type { AuthStore } from "./store.js";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

/**
 * Política de redirect URI: só `https:` (apps web) ou loopback HTTP (apps nativos,
 * RFC 8252 §7.3 — Claude Desktop). Qualquer outro esquema é recusado no registo,
 * não no `/authorize`, para o cliente falhar cedo e com mensagem clara.
 */
export function isAcceptableRedirectUri(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.hash) return false;
  if (url.protocol === "https:") return true;
  if (url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname)) return true;
  return false;
}

export class OperozClientsStore implements OAuthRegisteredClientsStore {
  constructor(private readonly store: AuthStore) {}

  async getClient(clientId: string): Promise<OAuthClientInformationFull | undefined> {
    const stored = await this.store.getClient(clientId);
    if (!stored) return undefined;
    await this.store.touchClient(clientId);
    return stored.info;
  }

  async registerClient(client: OAuthClientInformationFull): Promise<OAuthClientInformationFull> {
    const redirectUris = client.redirect_uris ?? [];
    if (redirectUris.length === 0) {
      throw new InvalidClientMetadataError("redirect_uris é obrigatório.");
    }
    for (const uri of redirectUris) {
      if (!isAcceptableRedirectUri(uri)) {
        throw new InvalidClientMetadataError(
          `redirect_uri não aceite: ${uri}. Use https: ou http://localhost (loopback).`
        );
      }
    }

    const now = Date.now();
    await this.store.putClient(client.client_id, { info: client, createdAt: now, lastUsedAt: now });
    return client;
  }
}
