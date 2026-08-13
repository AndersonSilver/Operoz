import { createHmac, timingSafeEqual } from "node:crypto";

/** Janela anti-replay do `X-Operoz-Timestamp`, em segundos. */
export const DEFAULT_TIMESTAMP_TOLERANCE_SECONDS = 300;

const SIGNATURE_PREFIX = "sha256=";

/**
 * Assinatura do `POST /oauth/web-callback`.
 *
 * A mensagem é `"<timestamp>.<corpo cru>"` — o corpo **exatamente como veio no fio**.
 * Reserializar o JSON quebraria a comparação (ordem de chaves, espaçamento).
 */
export function computeCallbackSignature(secret: string, timestamp: string, rawBody: string): string {
  const mac = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest("hex");
  return `${SIGNATURE_PREFIX}${mac}`;
}

/** Comparação de tempo constante, tolerante a tamanhos diferentes. */
function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export type SignatureFailureReason = "missing_headers" | "stale_timestamp" | "invalid_signature" | "no_secrets";

export type SignatureVerification = { ok: true } | { ok: false; reason: SignatureFailureReason };

export type VerifyCallbackSignatureInput = {
  /** Todos os segredos aceites. Rotação = adicionar o novo, depois remover o antigo. */
  secrets: string[];
  timestamp: string | undefined;
  signature: string | undefined;
  rawBody: string;
  /** epoch em segundos. */
  nowSeconds?: number;
  toleranceSeconds?: number;
};

/**
 * Verifica a assinatura contra **qualquer** segredo da lista (rotação sem downtime),
 * depois de validar a janela de timestamp.
 */
export function verifyCallbackSignature(input: VerifyCallbackSignatureInput): SignatureVerification {
  const { secrets, timestamp, signature, rawBody } = input;

  if (secrets.length === 0) return { ok: false, reason: "no_secrets" };
  if (!timestamp || !signature) return { ok: false, reason: "missing_headers" };

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return { ok: false, reason: "missing_headers" };

  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const tolerance = input.toleranceSeconds ?? DEFAULT_TIMESTAMP_TOLERANCE_SECONDS;
  if (Math.abs(now - timestampSeconds) > tolerance) return { ok: false, reason: "stale_timestamp" };

  for (const secret of secrets) {
    if (safeEqual(computeCallbackSignature(secret, timestamp, rawBody), signature)) {
      return { ok: true };
    }
  }

  return { ok: false, reason: "invalid_signature" };
}
