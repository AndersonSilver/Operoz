import { describe, expect, it } from "vitest";

import { computeCallbackSignature, verifyCallbackSignature } from "../src/auth/callback-signature.js";

const SECRET = "segredo-de-teste";
const OTHER_SECRET = "segredo-novo-da-rotacao";
const TIMESTAMP = "1765000000";
const BODY = '{"ticket":"abc","api_token":"operoz_api_x"}';
const NOW = Number(TIMESTAMP);

describe("computeCallbackSignature", () => {
  it("produz um vetor fixo estável (HMAC-SHA256 de `<ts>.<corpo cru>`)", () => {
    const signature = computeCallbackSignature(SECRET, TIMESTAMP, BODY);
    expect(signature).toMatch(/^sha256=[0-9a-f]{64}$/);
    // Vetor fixo cruzado com o lado Python (`apps/api`): qualquer divergência entre
    // `callback-signature.ts` e `sign_callback_body()` quebra este teste.
    // python -c "import hmac,hashlib;print(hmac.new(b'segredo-de-teste', b'1765000000.{\"ticket\":\"abc\",\"api_token\":\"operoz_api_x\"}', hashlib.sha256).hexdigest())"
    expect(signature).toBe("sha256=e1fac003d4e01354282d24f2e51d47ef20241afb3857a789195742c1960f163e");
  });

  it("muda quando o corpo muda", () => {
    expect(computeCallbackSignature(SECRET, TIMESTAMP, BODY)).not.toBe(
      computeCallbackSignature(SECRET, TIMESTAMP, `${BODY} `)
    );
  });

  it("muda quando o timestamp muda", () => {
    expect(computeCallbackSignature(SECRET, TIMESTAMP, BODY)).not.toBe(
      computeCallbackSignature(SECRET, "1765000001", BODY)
    );
  });
});

describe("verifyCallbackSignature", () => {
  it("aceita assinatura válida dentro da janela", () => {
    const signature = computeCallbackSignature(SECRET, TIMESTAMP, BODY);
    expect(
      verifyCallbackSignature({ secrets: [SECRET], timestamp: TIMESTAMP, signature, rawBody: BODY, nowSeconds: NOW })
    ).toEqual({ ok: true });
  });

  it("aceita assinatura de QUALQUER segredo da lista (rotação sem downtime)", () => {
    const signature = computeCallbackSignature(OTHER_SECRET, TIMESTAMP, BODY);
    expect(
      verifyCallbackSignature({
        secrets: [SECRET, OTHER_SECRET],
        timestamp: TIMESTAMP,
        signature,
        rawBody: BODY,
        nowSeconds: NOW,
      })
    ).toEqual({ ok: true });
  });

  it("recusa corpo adulterado", () => {
    const signature = computeCallbackSignature(SECRET, TIMESTAMP, BODY);
    expect(
      verifyCallbackSignature({
        secrets: [SECRET],
        timestamp: TIMESTAMP,
        signature,
        rawBody: '{"ticket":"abc","api_token":"operoz_api_ATACANTE"}',
        nowSeconds: NOW,
      })
    ).toEqual({ ok: false, reason: "invalid_signature" });
  });

  it("recusa timestamp fora da janela de 300 s (replay)", () => {
    const signature = computeCallbackSignature(SECRET, TIMESTAMP, BODY);
    expect(
      verifyCallbackSignature({
        secrets: [SECRET],
        timestamp: TIMESTAMP,
        signature,
        rawBody: BODY,
        nowSeconds: NOW + 301,
      })
    ).toEqual({ ok: false, reason: "stale_timestamp" });

    expect(
      verifyCallbackSignature({
        secrets: [SECRET],
        timestamp: TIMESTAMP,
        signature,
        rawBody: BODY,
        nowSeconds: NOW - 301,
      })
    ).toEqual({ ok: false, reason: "stale_timestamp" });
  });

  it("aceita timestamp exatamente no limite da janela", () => {
    const signature = computeCallbackSignature(SECRET, TIMESTAMP, BODY);
    expect(
      verifyCallbackSignature({
        secrets: [SECRET],
        timestamp: TIMESTAMP,
        signature,
        rawBody: BODY,
        nowSeconds: NOW + 300,
      })
    ).toEqual({ ok: true });
  });

  it("recusa assinatura de tamanho diferente sem lançar", () => {
    expect(
      verifyCallbackSignature({
        secrets: [SECRET],
        timestamp: TIMESTAMP,
        signature: "sha256=curta",
        rawBody: BODY,
        nowSeconds: NOW,
      })
    ).toEqual({ ok: false, reason: "invalid_signature" });
  });

  it("recusa headers em falta", () => {
    expect(verifyCallbackSignature({ secrets: [SECRET], timestamp: undefined, signature: "x", rawBody: BODY })).toEqual(
      { ok: false, reason: "missing_headers" }
    );
    expect(
      verifyCallbackSignature({ secrets: [SECRET], timestamp: TIMESTAMP, signature: undefined, rawBody: BODY })
    ).toEqual({ ok: false, reason: "missing_headers" });
    expect(
      verifyCallbackSignature({ secrets: [SECRET], timestamp: "nao-numero", signature: "x", rawBody: BODY })
    ).toEqual({ ok: false, reason: "missing_headers" });
  });

  it("recusa quando não há nenhum segredo configurado", () => {
    expect(verifyCallbackSignature({ secrets: [], timestamp: TIMESTAMP, signature: "x", rawBody: BODY })).toEqual({
      ok: false,
      reason: "no_secrets",
    });
  });
});
