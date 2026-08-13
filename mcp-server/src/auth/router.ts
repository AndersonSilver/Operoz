import express, { type Router } from "express";

import { mcpAuthRouter } from "@modelcontextprotocol/sdk/server/auth/router.js";

import type { OAuthConfig } from "./oauth-config.js";
import { createPendingLookupRoutes } from "./pending-lookup-routes.js";
import { OperozOAuthProvider, type OperozOAuthProviderDeps } from "./provider.js";
import { JsonFileAuthStore, type AuthStore } from "./store.js";
import { createWebCallbackRoutes } from "./web-callback-routes.js";

export type CreateOAuthRouterOptions = {
  config: OAuthConfig;
  /** Injetável em teste; por omissão usa o `JsonFileAuthStore` do `MCP_OAUTH_STORE_PATH`. */
  store?: AuthStore;
  deps?: OperozOAuthProviderDeps;
  /** Desliga rate limits em teste. */
  rateLimitEnabled?: boolean;
};

export type OAuthRuntime = {
  router: Router;
  provider: OperozOAuthProvider;
  store: AuthStore;
  /** URL da metadata de recurso protegido, para o header `WWW-Authenticate`. */
  resourceMetadataUrl: string;
};

/**
 * Ponto único de import para o `http.ts`: monta o `mcpAuthRouter` do SDK
 * (`/authorize`, `/token`, `/register`, `/revoke`, `/.well-known/*`) mais os dois
 * routers próprios (`/oauth/pending/*` e `/oauth/web-callback`).
 *
 * O router resultante TEM de ser montado na raiz da aplicação Express.
 */
export function createOAuthRouter(options: CreateOAuthRouterOptions): OAuthRuntime {
  const { config } = options;
  const store = options.store ?? new JsonFileAuthStore({ filePath: config.storePath, maxClients: config.maxClients });
  const provider = new OperozOAuthProvider(config, store, options.deps);

  const router = express.Router();

  // Rotas próprias primeiro: `mcpAuthRouter` monta `express.json()` em sub-routers,
  // e o `/oauth/web-callback` precisa do corpo cru.
  router.use(
    createPendingLookupRoutes({
      config,
      pendings: provider.pendings,
      ...(options.rateLimitEnabled === false ? { rateLimitEnabled: false } : {}),
    })
  );
  router.use(
    createWebCallbackRoutes({
      config,
      provider,
      store,
      ...(options.deps?.validateApiToken ? { validateApiToken: options.deps.validateApiToken } : {}),
      ...(options.deps?.now ? { now: options.deps.now } : {}),
    })
  );

  router.use(
    mcpAuthRouter({
      provider,
      issuerUrl: config.issuerUrl,
      resourceServerUrl: config.resourceUrl,
      scopesSupported: config.scopes,
      resourceName: "Operoz MCP",
      ...(options.rateLimitEnabled === false
        ? {
            authorizationOptions: { rateLimit: false as const },
            tokenOptions: { rateLimit: false as const },
            clientRegistrationOptions: { rateLimit: false as const },
            revocationOptions: { rateLimit: false as const },
          }
        : {}),
    })
  );

  const resourcePath = config.resourceUrl.pathname === "/" ? "" : config.resourceUrl.pathname;
  const resourceMetadataUrl = new URL(`/.well-known/oauth-protected-resource${resourcePath}`, config.resourceUrl).href;

  return { router, provider, store, resourceMetadataUrl };
}
