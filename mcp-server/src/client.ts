import type { OperozConfig } from "./config.js";

export type ApiSurface = "v1" | "app" | "public" | "instances" | "auth";

export type RequestOptions = {
  surface: ApiSurface;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  /** form POST for /auth/sign-in */
  form?: Record<string, string>;
};

export class OperozApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
    /** Tempo sugerido para retry (Retry-After ou estimativa). */
    public retryAfterMs?: number
  ) {
    super(message);
    this.name = "OperozApiError";
  }
}

function parseRetryAfterMs(response: Response): number | undefined {
  const header = response.headers.get("retry-after");
  if (!header) return undefined;

  const asSeconds = Number(header);
  if (!Number.isNaN(asSeconds) && asSeconds >= 0) {
    return asSeconds * 1000;
  }

  const asDate = Date.parse(header);
  if (!Number.isNaN(asDate)) {
    return Math.max(0, asDate - Date.now());
  }

  return undefined;
}

export class OperozClient {
  private sessionCookie?: string;

  constructor(private config: OperozConfig) {
    this.sessionCookie = config.sessionCookie;
  }

  setSessionCookie(cookie: string) {
    this.sessionCookie = cookie;
  }

  getSessionCookie(): string | undefined {
    return this.sessionCookie;
  }

  private prefixFor(surface: ApiSurface): string {
    switch (surface) {
      case "v1":
        return "/api/v1";
      case "app":
        return "/api";
      case "public":
        return "/api/public";
      case "instances":
        return "/api/instances";
      case "auth":
        return "/auth";
    }
  }

  private buildUrl(surface: ApiSurface, path: string, query?: RequestOptions["query"]): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${this.config.baseUrl}${this.prefixFor(surface)}${normalizedPath}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private headers(surface: ApiSurface, form?: boolean): Headers {
    const headers = new Headers({ Accept: "application/json" });
    if (form) {
      headers.set("Content-Type", "application/x-www-form-urlencoded");
    } else if (surface !== "auth" || !form) {
      headers.set("Content-Type", "application/json");
    }

    if (["v1", "app"].includes(surface) && this.config.apiKey) {
      headers.set("X-Api-Key", this.config.apiKey);
    }
    if (["app", "auth", "instances"].includes(surface) && this.sessionCookie) {
      headers.set("Cookie", this.sessionCookie);
    }
    return headers;
  }

  async request<T = unknown>(options: RequestOptions): Promise<T> {
    const { surface, method, path, query, body, form } = options;

    if (surface === "v1" && !this.config.apiKey) {
      throw new Error(
        "OPEROZ_API_KEY é obrigatório para a API v1. Crie um token em Definições → API tokens (ou God mode)."
      );
    }
    if (surface === "app" && !this.config.apiKey && !this.sessionCookie) {
      throw new Error(
        "Auth necessária para /api/* (boards, etc.). Defina OPEROZ_API_KEY (recomendado) ou use operoz_sign_in / OPEROZ_SESSION_COOKIE."
      );
    }

    const url = this.buildUrl(surface, path, query);
    const init: RequestInit = {
      method,
      headers: this.headers(surface, Boolean(form)),
      redirect: "manual",
    };

    if (form) {
      init.body = new URLSearchParams(form).toString();
    } else if (body !== undefined && method !== "GET" && method !== "DELETE") {
      init.body = JSON.stringify(body);
    }

    const initialResponse = await fetch(url, init);

    // Capture session from sign-in
    if (surface === "auth" && method === "POST") {
      const setCookie = initialResponse.headers.getSetCookie?.() ?? [];
      const legacy = initialResponse.headers.get("set-cookie");
      const parts = [...setCookie, ...(legacy ? [legacy] : [])];
      const sessionParts = parts
        .flatMap((c) => c.split(","))
        .map((c) => c.split(";")[0].trim())
        .filter((c) => c.startsWith("sessionid=") || c.startsWith("csrftoken="));
      if (sessionParts.length) {
        this.sessionCookie = sessionParts.join("; ");
      }
    }

    // Endpoints de asset (download de arquivo/HTML embutido) respondem com 302 para uma
    // URL presigned (S3/MinIO). Como usamos redirect:"manual", seguimos manualmente aqui
    // para poder ler o conteúdo real em vez de tratar o redirect como erro/corpo vazio.
    const response =
      surface !== "auth" && initialResponse.status >= 300 && initialResponse.status < 400
        ? await this.followRedirect(initialResponse)
        : initialResponse;

    const contentType = response.headers.get("content-type") ?? "";
    const isBinary =
      contentType !== "" &&
      !/^(text\/|application\/json|application\/xml|application\/javascript|image\/svg)/i.test(contentType);

    if (isBinary) {
      if (response.status >= 400) {
        throw new OperozApiError(`Operoz API ${method} ${path} → ${response.status}`, response.status, undefined);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      const MAX_INLINE_BYTES = 2 * 1024 * 1024;
      if (buffer.length > MAX_INLINE_BYTES) {
        return {
          binary: true,
          contentType,
          sizeBytes: buffer.length,
          downloadUrl: response.url,
          note: `Arquivo binário de ${buffer.length} bytes excede o limite de ${MAX_INLINE_BYTES} bytes para retorno inline via MCP. Use downloadUrl para baixar diretamente (URL assinada, válida por tempo limitado).`,
        } as T;
      }
      return { binary: true, contentType, base64: buffer.toString("base64") } as T;
    }

    const text = await response.text();
    let parsed: unknown = text;
    if (text) {
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        parsed = text;
      }
    }

    if (response.status >= 400) {
      const retryAfterMs = response.status === 429 ? parseRetryAfterMs(response) : undefined;
      throw new OperozApiError(
        `Operoz API ${method} ${path} → ${response.status}`,
        response.status,
        parsed,
        retryAfterMs
      );
    }

    if (response.status === 204 || text === "") {
      return undefined as T;
    }

    return parsed as T;
  }

  private async followRedirect(response: Response): Promise<Response> {
    const location = response.headers.get("location");
    if (!location) return response;
    // URL presigned já contém sua própria autenticação (assinatura); não reenviamos
    // Cookie/X-Api-Key, que seriam irrelevantes (e potencialmente indesejados) no storage.
    return fetch(location, { method: "GET" });
  }

  async signIn(email: string, password: string): Promise<{ sessionCookie: string }> {
    await this.request({
      surface: "auth",
      method: "POST",
      path: "/sign-in/",
      form: { email, password },
    });
    if (!this.sessionCookie) {
      throw new Error("Login não devolveu cookie de sessão. Verifique credenciais e God mode.");
    }
    return { sessionCookie: this.sessionCookie };
  }
}
