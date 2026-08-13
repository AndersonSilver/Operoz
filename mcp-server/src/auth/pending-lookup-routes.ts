/* oxlint-disable no-async-endpoint-handlers -- Express 5 / handlers com await explícito */
import express, { type NextFunction, type Request, type Response, type Router } from "express";
import { rateLimit } from "express-rate-limit";

import type { OAuthConfig } from "./oauth-config.js";
import type { PendingAuthorizations } from "./pending.js";

/**
 * CORS por allowlist, **sem** `Access-Control-Allow-Credentials`: estes endpoints são
 * chamados pela página do `apps/web` com `fetch` sem credenciais.
 */
function corsForOrigins(allowedOrigins: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (typeof origin === "string" && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Access-Control-Max-Age", "600");
    }
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  };
}

/** Express 5 tipa params como `string | string[]`; aqui só há um segmento. */
function ticketParam(req: Request): string {
  const raw = req.params.ticket;
  return Array.isArray(raw) ? (raw[0] ?? "") : (raw ?? "");
}

export type PendingLookupRoutesOptions = {
  config: OAuthConfig;
  pendings: PendingAuthorizations;
  /** Desliga o rate limit em teste. */
  rateLimitEnabled?: boolean;
};

/**
 * `GET  /oauth/pending/:ticket`      → metadados do consentimento (idempotente, não consome)
 * `POST /oauth/pending/:ticket/deny` → cancela e devolve o redirect de `access_denied`
 *
 * Ambos não autenticados: o ticket **não é segredo** (viaja num `Location` e num path
 * de navegação). O pior que um atacante com um ticket consegue é abortar uma
 * autorização pendente, que o utilizador simplesmente refaz.
 */
export function createPendingLookupRoutes(options: PendingLookupRoutesOptions): Router {
  const { config, pendings } = options;
  const router = express.Router();

  router.use(corsForOrigins(config.webOrigins));

  if (options.rateLimitEnabled !== false) {
    router.use(
      rateLimit({
        windowMs: 60 * 1000,
        limit: 60,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: "too_many_requests" },
      })
    );
  }

  router.get("/oauth/pending/:ticket", async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    const view = await pendings.lookup(ticketParam(req));
    if (!view) {
      // Resposta ÚNICA para desconhecido, expirado ou já consumido — não distinguir.
      res.status(404).json({ error: "invalid_ticket" });
      return;
    }
    res.status(200).json(view);
  });

  router.post("/oauth/pending/:ticket/deny", async (req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store");
    const pending = await pendings.consume(ticketParam(req));
    if (!pending) {
      res.status(404).json({ error: "invalid_ticket" });
      return;
    }

    // RFC 6749 §4.1.2.1 — erro vai para o redirect_uri, com o state original.
    const redirectUrl = new URL(pending.redirectUri);
    redirectUrl.searchParams.set("error", "access_denied");
    redirectUrl.searchParams.set("error_description", "O utilizador recusou a autorização.");
    if (pending.state) redirectUrl.searchParams.set("state", pending.state);

    res.status(200).json({ redirect_url: redirectUrl.href });
  });

  return router;
}
