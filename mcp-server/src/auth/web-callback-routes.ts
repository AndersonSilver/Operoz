/* oxlint-disable no-async-endpoint-handlers -- Express 5 / handlers com await explícito */
import express, { type Request, type Response, type Router } from "express";

import { verifyCallbackSignature } from "./callback-signature.js";
import type { OAuthConfig } from "./oauth-config.js";
import { validateApiToken as defaultValidateApiToken } from "./operoz-credentials.js";
import { isValidTicketFormat } from "./pending.js";
import type { OperozOAuthProvider } from "./provider.js";
import type { AuthStore } from "./store.js";
import type { SubjectRef } from "./types.js";

const MAX_BODY_BYTES = 16 * 1024;

/**
 * Quanto tempo o recibo de consumo fica disponível para responder de forma
 * idempotente. Generoso de propósito: cobre o retry do Django e uma reinicialização
 * do container no meio do fluxo.
 */
const CONSUMED_RECEIPT_TTL_MS = 15 * 60 * 1000;

type CallbackPayload = {
  ticket?: unknown;
  api_token_id?: unknown;
  api_token?: unknown;
  user_id?: unknown;
  user_email?: unknown;
};

export type WebCallbackRoutesOptions = {
  config: OAuthConfig;
  provider: OperozOAuthProvider;
  store: AuthStore;
  validateApiToken?: typeof defaultValidateApiToken;
  now?: () => number;
};

/**
 * `POST /oauth/web-callback` — handoff assinado do `apps/api` (Django) para cá.
 *
 * Servidor-a-servidor: **nunca** chamado pelo browser. Sem CORS e `403` se vier
 * header `Origin`. A segurança do handoff está no HMAC (sobre o corpo cru) e na
 * sessão Django do passo anterior — não no sigilo do ticket.
 *
 * **Idempotente por desenho.** O grant é commitado no store *antes* de a resposta
 * sair daqui, então uma resposta perdida (timeout) deixaria o Django a achar que
 * falhou quando na verdade correu bem — e a apagar um `APIToken` que já está
 * amarrado a um grant vivo. Por isso a repetição da mesma chamada devolve
 * `200` com o **mesmo** `redirect_url`, e não `409`.
 */
export function createWebCallbackRoutes(options: WebCallbackRoutesOptions): Router {
  const { config, provider, store } = options;
  const now = options.now ?? (() => Date.now());
  const validateApiToken = options.validateApiToken ?? defaultValidateApiToken;

  const router = express.Router();

  router.post(
    "/oauth/web-callback",
    // Corpo CRU: a assinatura é sobre os bytes exatos do fio. Reserializar quebraria.
    express.raw({ type: () => true, limit: MAX_BODY_BYTES }),
    async (req: Request, res: Response) => {
      res.setHeader("Cache-Control", "no-store");

      if (req.headers.origin !== undefined) {
        res.status(403).json({ error: "browser_origin_not_allowed" });
        return;
      }

      if (config.callbackSecrets.length === 0) {
        res.status(503).json({ error: "callback_secret_not_configured" });
        return;
      }

      const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : "";
      const timestamp = req.headers["x-operoz-timestamp"];
      const signature = req.headers["x-operoz-signature"];

      const verification = verifyCallbackSignature({
        secrets: config.callbackSecrets,
        timestamp: typeof timestamp === "string" ? timestamp : undefined,
        signature: typeof signature === "string" ? signature : undefined,
        rawBody,
        nowSeconds: Math.floor(now() / 1000),
      });

      if (!verification.ok) {
        res.status(401).json({ error: "invalid_signature" });
        return;
      }

      let payload: CallbackPayload;
      try {
        payload = JSON.parse(rawBody) as CallbackPayload;
      } catch {
        res.status(400).json({ error: "invalid_body" });
        return;
      }

      const ticket = payload.ticket;
      const apiToken = payload.api_token;
      if (!isValidTicketFormat(ticket) || typeof apiToken !== "string" || !apiToken) {
        res.status(400).json({ error: "invalid_body" });
        return;
      }

      // Repetição da mesma chamada: devolver o resultado original, byte a byte.
      // Só vale se o recibo já estiver PREENCHIDO — um recibo sem `redirectUrl` é
      // apenas a reserva de uma chamada em curso, e cai no `claim` mais abaixo.
      const replayed = await store.getConsumedTicket(ticket);
      if (replayed?.redirectUrl) {
        res.status(200).json({ redirect_url: replayed.redirectUrl });
        return;
      }

      if (!replayed) {
        const pending = await provider.pendings.lookupRaw(ticket);
        if (!pending) {
          // Desconhecido, expirado, ou consumido por um `deny` (que não deixa recibo).
          res.status(400).json({ error: "invalid_ticket" });
          return;
        }
      }

      // Defesa em profundidade: validar o APIToken recebido antes de emitir o code —
      // protege contra bug de binding no Django, e deixa o token "quente".
      let user: Awaited<ReturnType<typeof defaultValidateApiToken>>;
      try {
        user = await validateApiToken(config.operozBaseUrl, apiToken);
      } catch {
        res.status(502).json({ error: "operoz_unreachable" });
        return;
      }
      if (!user) {
        res.status(400).json({ error: "invalid_api_token" });
        return;
      }

      // Consumo do pendente + reserva do recibo numa ÚNICA mutação do store: não
      // existe instante em que o pendente já sumiu e o recibo ainda não existe.
      const claim = await store.claimPendingForCallback(ticket, CONSUMED_RECEIPT_TTL_MS);

      if (claim.status === "already") {
        if (claim.receipt.redirectUrl) {
          res.status(200).json({ redirect_url: claim.receipt.redirectUrl });
          return;
        }
        // Reservado por uma chamada concorrente que ainda não emitiu o code.
        // `409` é ambíguo/retentável de propósito — nunca `400`, que faria o Django
        // apagar um `APIToken` prestes a ficar em uso.
        res.status(409).json({ error: "ticket_consumed" });
        return;
      }

      if (claim.status === "missing") {
        res.status(409).json({ error: "ticket_consumed" });
        return;
      }

      const claimed = claim.pending;

      const subject: SubjectRef = {
        apiToken,
        apiTokenId: typeof payload.api_token_id === "string" ? payload.api_token_id : undefined,
        userId: typeof payload.user_id === "string" ? payload.user_id : user.id,
        userEmail: typeof payload.user_email === "string" ? payload.user_email : user.email,
      };

      // Descarta a autorização anterior do mesmo par cliente/utilizador (e o APIToken dela).
      await provider.replacePreviousAuthorization(claimed.clientId, subject);

      const code = await provider.issueAuthorizationCode(claimed, subject);
      const redirectUrl = provider.buildRedirectUrl(claimed, code);

      // Preenche a reserva com o resultado, ANTES de responder: se a resposta se
      // perder, o retry do Django encontra este registo e recebe a mesma resposta.
      await store.putConsumedTicket(ticket, {
        clientId: claimed.clientId,
        redirectUrl,
        consumedAt: now(),
        expiresAt: now() + CONSUMED_RECEIPT_TTL_MS,
      });

      res.status(200).json({ redirect_url: redirectUrl });
    }
  );

  return router;
}
