import { randomBytes } from "node:crypto";

import type { AuthorizationParams, OAuthServerProvider } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import {
  InvalidGrantError,
  InvalidTargetError,
  InvalidTokenError,
  ServerError,
} from "@modelcontextprotocol/sdk/server/auth/errors.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import type {
  OAuthClientInformationFull,
  OAuthTokenRevocationRequest,
  OAuthTokens,
} from "@modelcontextprotocol/sdk/shared/auth.js";
import type { Response } from "express";

import { OperozClientsStore } from "./clients-store.js";
import type { OAuthConfig } from "./oauth-config.js";
import {
  ACCESS_TOKEN_PREFIX,
  AUTHORIZATION_CODE_PREFIX,
  normalizeResource,
  REFRESH_TOKEN_PREFIX,
} from "./oauth-config.js";
import {
  deleteApiToken as defaultDeleteApiToken,
  validateApiToken as defaultValidateApiToken,
} from "./operoz-credentials.js";
import { PendingAuthorizations } from "./pending.js";
import type { AuthStore } from "./store.js";
import type { StoredPending, StoredToken, SubjectRef } from "./types.js";

export type OperozOAuthProviderDeps = {
  validateApiToken?: typeof defaultValidateApiToken;
  deleteApiToken?: typeof defaultDeleteApiToken;
  now?: () => number;
};

function randomToken(prefix: string): string {
  return `${prefix}${randomBytes(32).toString("base64url")}`;
}

export class OperozOAuthProvider implements OAuthServerProvider {
  readonly clientsStore: OperozClientsStore;
  readonly pendings: PendingAuthorizations;

  private readonly validateApiToken: typeof defaultValidateApiToken;
  private readonly deleteApiToken: typeof defaultDeleteApiToken;
  private readonly now: () => number;

  constructor(
    readonly config: OAuthConfig,
    private readonly store: AuthStore,
    deps: OperozOAuthProviderDeps = {}
  ) {
    this.clientsStore = new OperozClientsStore(store);
    this.now = deps.now ?? (() => Date.now());
    this.pendings = new PendingAuthorizations(store, config.pendingTtl, this.now);
    this.validateApiToken = deps.validateApiToken ?? defaultValidateApiToken;
    this.deleteApiToken = deps.deleteApiToken ?? defaultDeleteApiToken;
  }

  /** `resource` esperado deste servidor, normalizado (RFC 8707). */
  private get expectedResource(): string | undefined {
    return normalizeResource(this.config.resourceUrl);
  }

  private assertResource(requested: URL | string | undefined): string | undefined {
    if (requested === undefined) return undefined;
    const normalized = normalizeResource(requested);
    if (!normalized || normalized !== this.expectedResource) {
      throw new InvalidTargetError(`Recurso não suportado: ${String(requested)}`);
    }
    return normalized;
  }

  // ---------------------------------------------------------------------------
  // /authorize → redireciona para a página de consentimento do apps/web
  // ---------------------------------------------------------------------------

  async authorize(client: OAuthClientInformationFull, params: AuthorizationParams, res: Response): Promise<void> {
    const resource = this.assertResource(params.resource);

    const { ticket } = await this.pendings.create({
      clientId: client.client_id,
      clientName: client.client_name,
      clientUri: client.client_uri,
      redirectUri: params.redirectUri,
      codeChallenge: params.codeChallenge,
      state: params.state,
      scopes: params.scopes ?? [],
      resource,
    });

    // Ticket como SEGMENTO DE PATH, nunca query string: o `next_path` do apps/web é
    // montado a partir do `pathname` (descarta a query) e reinjetado sem
    // percent-encoding — uma query aqui não sobreviveria ao round-trip de login/SSO.
    res.redirect(302, `${this.config.webBaseUrl}/mcp-authorize/${encodeURIComponent(ticket)}`);
  }

  /**
   * Emite o authorization code depois do consentimento — chamado só por
   * `/oauth/web-callback`, já com o handoff assinado verificado.
   */
  async issueAuthorizationCode(pending: StoredPending, subject: SubjectRef): Promise<string> {
    const code = randomToken(AUTHORIZATION_CODE_PREFIX);
    const createdAt = this.now();
    await this.store.putGrant(code, {
      clientId: pending.clientId,
      redirectUri: pending.redirectUri,
      codeChallenge: pending.codeChallenge,
      scopes: pending.scopes,
      resource: pending.resource,
      subject,
      createdAt,
      expiresAt: createdAt + this.config.codeTtl * 1000,
    });
    return code;
  }

  /** Monta a URL final de retorno para o cliente OAuth (inclui o `state` guardado). */
  buildRedirectUrl(pending: StoredPending, code: string): string {
    const url = new URL(pending.redirectUri);
    url.searchParams.set("code", code);
    if (pending.state) url.searchParams.set("state", pending.state);
    return url.href;
  }

  // ---------------------------------------------------------------------------
  // /token
  // ---------------------------------------------------------------------------

  async challengeForAuthorizationCode(client: OAuthClientInformationFull, authorizationCode: string): Promise<string> {
    const grant = await this.store.peekGrant(authorizationCode);
    if (!grant || grant.clientId !== client.client_id) {
      throw new InvalidGrantError("Authorization code inválido ou expirado.");
    }
    return grant.codeChallenge;
  }

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    _codeVerifier?: string,
    redirectUri?: string,
    resource?: URL
  ): Promise<OAuthTokens> {
    const grant = await this.store.consumeGrant(authorizationCode);
    if (!grant || grant.clientId !== client.client_id) {
      throw new InvalidGrantError("Authorization code inválido ou expirado.");
    }
    if (redirectUri !== undefined && redirectUri !== grant.redirectUri) {
      throw new InvalidGrantError("redirect_uri não corresponde ao do pedido de autorização.");
    }
    if (resource !== undefined) {
      const normalized = this.assertResource(resource);
      if (grant.resource !== undefined && grant.resource !== normalized) {
        throw new InvalidTargetError("Recurso não corresponde ao do pedido de autorização.");
      }
    }

    return this.issueTokens(client.client_id, grant.scopes, grant.subject, grant.resource);
  }

  async exchangeRefreshToken(
    client: OAuthClientInformationFull,
    refreshToken: string,
    scopes?: string[],
    resource?: URL
  ): Promise<OAuthTokens> {
    if (!refreshToken.startsWith(REFRESH_TOKEN_PREFIX)) {
      throw new InvalidGrantError("Refresh token inválido.");
    }
    // Rotação: o refresh token antigo é consumido mesmo que a emissão nova falhe.
    const stored = await this.store.deleteToken(refreshToken);
    if (!stored || stored.kind !== "refresh" || stored.clientId !== client.client_id) {
      throw new InvalidGrantError("Refresh token inválido ou expirado.");
    }
    if (resource !== undefined) {
      const normalized = this.assertResource(resource);
      if (stored.resource !== undefined && stored.resource !== normalized) {
        throw new InvalidTargetError("Recurso não corresponde ao da autorização.");
      }
    }

    // Só é permitido reduzir escopo, nunca ampliar.
    let nextScopes = stored.scopes;
    if (scopes?.length) {
      const invalid = scopes.filter((scope) => !stored.scopes.includes(scope));
      if (invalid.length > 0) {
        throw new InvalidGrantError(`Escopo não concedido: ${invalid.join(" ")}`);
      }
      nextScopes = scopes;
    }

    return this.issueTokens(client.client_id, nextScopes, stored.subject, stored.resource);
  }

  private async issueTokens(
    clientId: string,
    scopes: string[],
    subject: SubjectRef,
    resource: string | undefined
  ): Promise<OAuthTokens> {
    const createdAt = this.now();
    const accessToken = randomToken(ACCESS_TOKEN_PREFIX);
    const refreshToken = randomToken(REFRESH_TOKEN_PREFIX);

    await this.store.putToken(accessToken, {
      kind: "access",
      clientId,
      scopes,
      resource,
      subject,
      createdAt,
      expiresAt: createdAt + this.config.accessTokenTtl * 1000,
      lastValidatedAt: createdAt,
    });
    await this.store.putToken(refreshToken, {
      kind: "refresh",
      clientId,
      scopes,
      resource,
      subject,
      createdAt,
      expiresAt: createdAt + this.config.refreshTokenTtl * 1000,
    });

    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: this.config.accessTokenTtl,
      refresh_token: refreshToken,
      scope: scopes.join(" "),
    };
  }

  // ---------------------------------------------------------------------------
  // Verificação de access token
  // ---------------------------------------------------------------------------

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    if (!token.startsWith(ACCESS_TOKEN_PREFIX)) {
      throw new InvalidTokenError("Access token inválido.");
    }

    const stored = await this.store.getToken(token);
    if (!stored || stored.kind !== "access") {
      throw new InvalidTokenError("Access token inválido ou expirado.");
    }
    if (stored.expiresAt <= this.now()) {
      await this.store.deleteToken(token);
      throw new InvalidTokenError("Access token expirado.");
    }

    await this.revalidateSubject(token, stored);

    return {
      token,
      clientId: stored.clientId,
      scopes: stored.scopes,
      expiresAt: Math.floor(stored.expiresAt / 1000),
      ...(stored.resource ? { resource: new URL(stored.resource) } : {}),
      extra: {
        apiToken: stored.subject.apiToken,
        apiTokenId: stored.subject.apiTokenId,
        userId: stored.subject.userId,
        userEmail: stored.subject.userEmail,
      },
    };
  }

  /**
   * Revalida periodicamente o `APIToken` Operoz por trás do access token: se o
   * utilizador revogar o token em Definições, o conector deixa de funcionar em até
   * `MCP_OAUTH_REVALIDATE_INTERVAL` segundos.
   *
   * Falha de rede não derruba a sessão (fail-open temporário) — só um `401/403` da
   * Operoz, que é resposta autoritativa de "token revogado", invalida.
   */
  private async revalidateSubject(token: string, stored: StoredToken): Promise<void> {
    const now = this.now();
    const age = now - (stored.lastValidatedAt ?? 0);
    if (age < this.config.revalidateInterval * 1000) return;

    let user: Awaited<ReturnType<typeof defaultValidateApiToken>>;
    try {
      user = await this.validateApiToken(this.config.operozBaseUrl, stored.subject.apiToken);
    } catch {
      // Operoz inalcançável: mantém a sessão viva e tenta de novo no próximo pedido.
      return;
    }

    if (!user) {
      await this.store.deleteToken(token);
      throw new InvalidTokenError("Credencial Operoz revogada.");
    }

    await this.store.markTokenValidated(token, now);
  }

  // ---------------------------------------------------------------------------
  // /revoke
  // ---------------------------------------------------------------------------

  async revokeToken(client: OAuthClientInformationFull, request: OAuthTokenRevocationRequest): Promise<void> {
    const raw = request.token;
    if (!raw.startsWith(ACCESS_TOKEN_PREFIX) && !raw.startsWith(REFRESH_TOKEN_PREFIX)) {
      // RFC 7009: token desconhecido não é erro.
      return;
    }

    const stored = await this.store.deleteToken(raw);
    if (!stored) return;
    if (stored.clientId !== client.client_id) return;

    // Remove o par (access+refresh) e revoga de verdade o APIToken Operoz.
    await this.store.deleteTokensForSubject(stored.clientId, stored.subject.apiTokenId, stored.subject.userId);

    if (stored.subject.apiTokenId) {
      await this.deleteApiToken(this.config.operozBaseUrl, stored.subject.apiToken, stored.subject.apiTokenId).catch(
        () => false
      );
    }
  }

  /**
   * Revoga a autorização anterior do mesmo par cliente/utilizador antes de aceitar
   * uma nova — evita acumular `APIToken`s na conta a cada reautorização.
   */
  async replacePreviousAuthorization(clientId: string, subject: SubjectRef): Promise<void> {
    const removed = await this.store.deleteTokensForSubject(clientId, undefined, subject.userId);
    const seen = new Set<string>();
    for (const token of removed) {
      const id = token.subject.apiTokenId;
      if (!id || id === subject.apiTokenId || seen.has(id)) continue;
      seen.add(id);
      await this.deleteApiToken(this.config.operozBaseUrl, token.subject.apiToken, id).catch(() => false);
    }
  }

  /** Usado pelo `/oauth/web-callback` para falhar com 500 controlado. */
  static serverError(message: string): ServerError {
    return new ServerError(message);
  }
}
