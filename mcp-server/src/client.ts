import type { OperisConfig } from "./config.js";

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

export class OperisApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message);
    this.name = "OperisApiError";
  }
}

export class OperisClient {
  private sessionCookie?: string;

  constructor(private config: OperisConfig) {
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

    if (surface === "v1" && this.config.apiKey) {
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
        "OPERIS_API_KEY é obrigatório para a API v1. Crie um token em Definições → API tokens (ou God mode).",
      );
    }
    if (surface === "app" && !this.sessionCookie) {
      throw new Error(
        "Sessão necessária para /api/* (boards, etc.). Use operis_sign_in ou defina OPERIS_SESSION_COOKIE.",
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

    const response = await fetch(url, init);

    // Capture session from sign-in
    if (surface === "auth" && method === "POST") {
      const setCookie = response.headers.getSetCookie?.() ?? [];
      const legacy = response.headers.get("set-cookie");
      const parts = [...setCookie, ...(legacy ? [legacy] : [])];
      const sessionParts = parts
        .flatMap((c) => c.split(","))
        .map((c) => c.split(";")[0].trim())
        .filter((c) => c.startsWith("sessionid=") || c.startsWith("csrftoken="));
      if (sessionParts.length) {
        this.sessionCookie = sessionParts.join("; ");
      }
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
      throw new OperisApiError(
        `Operis API ${method} ${path} → ${response.status}`,
        response.status,
        parsed,
      );
    }

    if (response.status === 204 || text === "") {
      return undefined as T;
    }

    return parsed as T;
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
