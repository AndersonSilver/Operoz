/**
 * Acesso às credenciais Operoz a partir do `mcp-server`.
 *
 * Regra dura deste módulo: **nunca** logar `password`, `token` ou `sessionCookie`,
 * nem incluí-los em mensagens de erro. Erros só carregam status HTTP.
 *
 * No caminho OAuth só `validateApiToken` e `deleteApiToken` são usados — quem minta
 * o `APIToken` é o Django (`POST /api/users/mcp-connectors/authorize/`).
 * `fetchCsrf`/`signIn` existem para o `OperozClient.signIn()` (tool `operoz_sign_in`),
 * que hoje falha por não fazer o handshake de CSRF.
 */

export type OperozUser = {
  id: string;
  email?: string;
  display_name?: string;
};

export class OperozCredentialError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "OperozCredentialError";
  }
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

/**
 * Valida um `APIToken` Operoz contra `GET /api/v1/users/me/`.
 * Devolve o utilizador em caso de sucesso, `undefined` se o token for inválido/revogado.
 * Lança `OperozCredentialError` se a API estiver inalcançável (≠ token inválido).
 */
export async function validateApiToken(baseUrl: string, apiToken: string): Promise<OperozUser | undefined> {
  let response: Response;
  try {
    response = await fetch(`${normalizeBaseUrl(baseUrl)}/api/v1/users/me/`, {
      method: "GET",
      headers: { Accept: "application/json", "X-Api-Key": apiToken },
      redirect: "manual",
    });
  } catch {
    throw new OperozCredentialError("Operoz inalcançável ao validar o token.");
  }

  if (response.status === 401 || response.status === 403) return undefined;
  if (!response.ok) {
    throw new OperozCredentialError(`Operoz respondeu ${response.status} ao validar o token.`, response.status);
  }

  const body = (await response.json().catch(() => undefined)) as OperozUser | undefined;
  if (!body?.id) {
    throw new OperozCredentialError("Resposta inesperada de /api/v1/users/me/.");
  }
  return body;
}

/**
 * Auto-revogação: `DELETE /api/users/api-tokens/<id>/` autenticado com o próprio token.
 * Funciona porque o filtro do Django é por `user=request.user`.
 * Best-effort — devolve `false` em vez de lançar.
 */
export async function deleteApiToken(baseUrl: string, apiToken: string, apiTokenId: string): Promise<boolean> {
  try {
    const response = await fetch(`${normalizeBaseUrl(baseUrl)}/api/users/api-tokens/${apiTokenId}/`, {
      method: "DELETE",
      headers: { Accept: "application/json", "X-Api-Key": apiToken },
      redirect: "manual",
    });
    return response.status === 204 || response.ok;
  } catch {
    return false;
  }
}

export type CsrfHandshake = {
  /** Valor a enviar em `csrfmiddlewaretoken` no corpo do form. */
  token: string;
  /** Cookie a reenviar (`csrftoken=…`). */
  cookie: string;
};

function extractCookies(response: Response, names: string[]): string[] {
  const setCookie = response.headers.getSetCookie?.() ?? [];
  const legacy = response.headers.get("set-cookie");
  const parts = [...setCookie, ...(legacy ? [legacy] : [])];
  return parts
    .flatMap((cookie) => cookie.split(","))
    .map((cookie) => cookie.split(";")[0].trim())
    .filter((cookie) => names.some((name) => cookie.startsWith(`${name}=`)));
}

/**
 * `GET /auth/get-csrf-token/`.
 *
 * `CSRF_COOKIE_HTTPONLY=True` no Django, por isso o valor útil vem no JSON
 * (`csrf_token`) e o cookie vem no `Set-Cookie` — precisamos dos dois.
 */
export async function fetchCsrf(baseUrl: string): Promise<CsrfHandshake> {
  let response: Response;
  try {
    response = await fetch(`${normalizeBaseUrl(baseUrl)}/auth/get-csrf-token/`, {
      method: "GET",
      headers: { Accept: "application/json" },
      redirect: "manual",
    });
  } catch {
    throw new OperozCredentialError("Operoz inalcançável ao obter o token CSRF.");
  }

  if (!response.ok) {
    throw new OperozCredentialError(`Operoz respondeu ${response.status} em /auth/get-csrf-token/.`, response.status);
  }

  const body = (await response.json().catch(() => undefined)) as { csrf_token?: string } | undefined;
  const cookies = extractCookies(response, ["csrftoken"]);
  const cookieValue = cookies[0];
  const token = body?.csrf_token ?? cookieValue?.split("=")[1];

  if (!token || !cookieValue) {
    throw new OperozCredentialError("Operoz não devolveu token CSRF utilizável.");
  }

  return { token, cookie: cookieValue };
}

export type SignInResult = {
  /** Cookies de sessão prontos para o header `Cookie` (`sessionid=…; csrftoken=…`). */
  sessionCookie: string;
};

/**
 * `POST /auth/sign-in/` com o handshake de CSRF completo:
 * cookie `csrftoken`, campo `csrfmiddlewaretoken` no corpo e header `Origin`
 * (o Django exige `Origin`/`Referer` da mesma origem em pedidos "seguros").
 */
export async function signIn(baseUrl: string, email: string, password: string): Promise<SignInResult> {
  const base = normalizeBaseUrl(baseUrl);
  const csrf = await fetchCsrf(base);

  const form = new URLSearchParams({ email, password, csrfmiddlewaretoken: csrf.token });

  let response: Response;
  try {
    response = await fetch(`${base}/auth/sign-in/`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: csrf.cookie,
        Origin: new URL(base).origin,
        Referer: `${base}/`,
      },
      body: form.toString(),
      redirect: "manual",
    });
  } catch {
    throw new OperozCredentialError("Operoz inalcançável no sign-in.");
  }

  const cookies = extractCookies(response, ["sessionid", "csrftoken"]);
  const sessionCookie = cookies.join("; ");

  if (!cookies.some((cookie) => cookie.startsWith("sessionid="))) {
    throw new OperozCredentialError(`Login não devolveu cookie de sessão (HTTP ${response.status}).`, response.status);
  }

  return { sessionCookie };
}
