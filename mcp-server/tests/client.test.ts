import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OperozApiError, OperozClient } from "../src/client.js";

function jsonResponse(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
}

describe("OperozClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exige OPEROZ_API_KEY para a surface v1", async () => {
    const client = new OperozClient({ baseUrl: "http://localhost:8000" });
    await expect(client.request({ surface: "v1", method: "GET", path: "/users/me/" })).rejects.toThrow(
      /OPEROZ_API_KEY/
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("exige auth (API key ou sessão) para a surface app", async () => {
    const client = new OperozClient({ baseUrl: "http://localhost:8000" });
    await expect(client.request({ surface: "app", method: "GET", path: "/workspaces/" })).rejects.toThrow(
      /Auth necessária/
    );
  });

  it("envia X-Api-Key na surface v1", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ id: 1 }));
    const client = new OperozClient({ baseUrl: "http://localhost:8000", apiKey: "secret-token" });

    await client.request({ surface: "v1", method: "GET", path: "/users/me/" });

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = init!.headers as Headers;
    expect(headers.get("X-Api-Key")).toBe("secret-token");
  });

  it("envia Cookie de sessão na surface app", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([]));
    const client = new OperozClient({ baseUrl: "http://localhost:8000", sessionCookie: "sessionid=abc" });

    await client.request({ surface: "app", method: "GET", path: "/workspaces/" });

    const [, init] = vi.mocked(fetch).mock.calls[0];
    const headers = init!.headers as Headers;
    expect(headers.get("Cookie")).toBe("sessionid=abc");
  });

  it("lança OperozApiError com status e body em resposta de erro", async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ detail: "not found" }, { status: 404 }));
    const client = new OperozClient({ baseUrl: "http://localhost:8000", apiKey: "token" });

    const error = await client
      .request({ surface: "v1", method: "GET", path: "/workspaces/x/" })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(OperozApiError);
    expect((error as OperozApiError).status).toBe(404);
    expect((error as OperozApiError).body).toEqual({ detail: "not found" });
  });

  it("calcula retryAfterMs a partir do header Retry-After (segundos) em 429", async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ detail: "rate limited" }, { status: 429, headers: { "Retry-After": "2" } })
    );
    const client = new OperozClient({ baseUrl: "http://localhost:8000", apiKey: "token" });

    const error = (await client
      .request({ surface: "v1", method: "GET", path: "/workspaces/x/" })
      .catch((e: unknown) => e)) as OperozApiError;

    expect(error.retryAfterMs).toBe(2000);
  });

  it("devolve undefined em respostas 204", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    const client = new OperozClient({ baseUrl: "http://localhost:8000", apiKey: "token" });

    const result = await client.request({ surface: "v1", method: "DELETE", path: "/workspaces/x/" });

    expect(result).toBeUndefined();
  });

  it("signIn faz o handshake de CSRF antes do POST e captura o sessionid", async () => {
    const csrfHeaders = new Headers();
    csrfHeaders.append("Set-Cookie", "csrftoken=abc; Path=/");
    const signInHeaders = new Headers();
    signInHeaders.append("Set-Cookie", "sessionid=xyz; Path=/; HttpOnly");
    signInHeaders.append("Set-Cookie", "csrftoken=abc; Path=/");

    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ csrf_token: "tok-csrf" }), { status: 200, headers: csrfHeaders })
      )
      .mockResolvedValueOnce(new Response("", { status: 200, headers: signInHeaders }));

    const client = new OperozClient({ baseUrl: "http://localhost:8000" });
    const result = await client.signIn("user@example.com", "senha123");

    expect(vi.mocked(fetch).mock.calls[0][0]).toBe("http://localhost:8000/auth/get-csrf-token/");
    expect(vi.mocked(fetch).mock.calls[1][0]).toBe("http://localhost:8000/auth/sign-in/");
    const body = new URLSearchParams(vi.mocked(fetch).mock.calls[1][1]!.body as string);
    expect(body.get("csrfmiddlewaretoken")).toBe("tok-csrf");

    expect(result.sessionCookie).toContain("sessionid=xyz");
    expect(client.getSessionCookie()).toBe(result.sessionCookie);
  });

  it("signIn lança erro se nenhum cookie de sessão vier na resposta", async () => {
    const csrfHeaders = new Headers();
    csrfHeaders.append("Set-Cookie", "csrftoken=abc; Path=/");
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ csrf_token: "tok-csrf" }), { status: 200, headers: csrfHeaders })
      )
      .mockResolvedValueOnce(new Response("", { status: 200 }));

    const client = new OperozClient({ baseUrl: "http://localhost:8000" });

    await expect(client.signIn("user@example.com", "senha")).rejects.toThrow(/sessão/i);
  });
});
