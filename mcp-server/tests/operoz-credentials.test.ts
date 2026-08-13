import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  deleteApiToken,
  fetchCsrf,
  OperozCredentialError,
  signIn,
  validateApiToken,
} from "../src/auth/operoz-credentials.js";

const BASE = "http://localhost:8000";

function jsonResponse(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("validateApiToken", () => {
  it("devolve o utilizador quando o token é válido", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ id: "u1", email: "a@b.c" }));

    const user = await validateApiToken(BASE, "operoz_api_abc");

    expect(user?.id).toBe("u1");
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("http://localhost:8000/api/v1/users/me/");
    expect((init!.headers as Record<string, string>)["X-Api-Key"]).toBe("operoz_api_abc");
  });

  it("normaliza barra final no baseUrl", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ id: "u1" }));
    await validateApiToken("http://localhost:8000/", "t");
    expect(vi.mocked(fetch).mock.calls[0][0]).toBe("http://localhost:8000/api/v1/users/me/");
  });

  it("devolve undefined em 401 e em 403 (token revogado)", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ detail: "no" }, { status: 401 }));
    expect(await validateApiToken(BASE, "t")).toBeUndefined();

    vi.mocked(fetch).mockResolvedValue(jsonResponse({ detail: "no" }, { status: 403 }));
    expect(await validateApiToken(BASE, "t")).toBeUndefined();
  });

  it("lança quando a API está inalcançável (≠ token inválido)", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("ECONNREFUSED"));
    await expect(validateApiToken(BASE, "t")).rejects.toBeInstanceOf(OperozCredentialError);
  });

  it("lança em 500 da API", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}, { status: 500 }));
    await expect(validateApiToken(BASE, "t")).rejects.toThrow(/500/);
  });

  it("nunca inclui o token na mensagem de erro", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("boom"));
    const error = await validateApiToken(BASE, "operoz_api_supersegredo").catch((e: Error) => e);
    expect((error as Error).message).not.toContain("supersegredo");
  });
});

describe("deleteApiToken", () => {
  it("faz DELETE autenticado com o próprio token", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));

    expect(await deleteApiToken(BASE, "operoz_api_abc", "tok-1")).toBe(true);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("http://localhost:8000/api/users/api-tokens/tok-1/");
    expect(init!.method).toBe("DELETE");
  });

  it("devolve false em erro de rede (best-effort)", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("down"));
    expect(await deleteApiToken(BASE, "t", "tok-1")).toBe(false);
  });

  it("devolve false quando a API recusa", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({}, { status: 404 }));
    expect(await deleteApiToken(BASE, "t", "tok-1")).toBe(false);
  });
});

describe("fetchCsrf", () => {
  it("lê o token do JSON e o cookie do Set-Cookie", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ csrf_token: "tok-csrf" }, { headers: { "Set-Cookie": "csrftoken=cookie-csrf; Path=/; HttpOnly" } })
    );

    const csrf = await fetchCsrf(BASE);
    expect(csrf.token).toBe("tok-csrf");
    expect(csrf.cookie).toBe("csrftoken=cookie-csrf");
  });

  it("lança quando não há cookie CSRF", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ csrf_token: "tok" }));
    await expect(fetchCsrf(BASE)).rejects.toThrow(/CSRF/);
  });
});

describe("signIn", () => {
  it("faz o handshake CSRF antes do POST e envia csrfmiddlewaretoken + Origin", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({ csrf_token: "tok-csrf" }, { headers: { "Set-Cookie": "csrftoken=cookie-csrf; Path=/" } })
      )
      .mockResolvedValueOnce(
        jsonResponse({ ok: true }, { headers: { "Set-Cookie": "sessionid=sess-1; Path=/; HttpOnly" } })
      );

    const result = await signIn(BASE, "a@b.c", "hunter2");

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
    const [csrfUrl] = vi.mocked(fetch).mock.calls[0];
    expect(csrfUrl).toBe("http://localhost:8000/auth/get-csrf-token/");

    const [signInUrl, init] = vi.mocked(fetch).mock.calls[1];
    expect(signInUrl).toBe("http://localhost:8000/auth/sign-in/");
    const headers = init!.headers as Record<string, string>;
    expect(headers.Cookie).toBe("csrftoken=cookie-csrf");
    expect(headers.Origin).toBe("http://localhost:8000");
    const body = new URLSearchParams(init!.body as string);
    expect(body.get("csrfmiddlewaretoken")).toBe("tok-csrf");
    expect(body.get("email")).toBe("a@b.c");

    expect(result.sessionCookie).toContain("sessionid=sess-1");
  });

  it("lança sem expor a password quando o login falha", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({ csrf_token: "tok-csrf" }, { headers: { "Set-Cookie": "csrftoken=cookie-csrf" } })
      )
      .mockResolvedValueOnce(jsonResponse({ error: "bad" }, { status: 401 }));

    const error = await signIn(BASE, "a@b.c", "hunter2").catch((e: Error) => e);
    expect((error as Error).message).not.toContain("hunter2");
    expect((error as Error).message).toMatch(/sessão/);
  });
});
