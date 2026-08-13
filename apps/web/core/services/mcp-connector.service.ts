// plane imports
import { API_BASE_URL, MCP_BASE_URL } from "@operoz/constants";
// services
import { APIService } from "@/services/api.service";
import { AuthService } from "@/services/auth.service";

const authService = new AuthService();

/** Metadados do consentimento pendente. O `mcp-server` nunca devolve `redirect_uri` nem `state`. */
export type TMcpPendingAuthorization = {
  /** Nome AUTO-DECLARADO pela aplicação cliente — renderizar como texto puro. */
  client_name: string;
  client_uri?: string;
  scopes: string[];
  expires_in: number;
};

export class McpConnectorError extends Error {
  constructor(
    message: string,
    /** `invalid_ticket` = ticket desconhecido/expirado/já usado; `unavailable` = MCP fora do ar. */
    public readonly reason: "invalid_ticket" | "unavailable" | "not_configured"
  ) {
    super(message);
    this.name = "McpConnectorError";
  }
}

/**
 * Lookup e `deny` falam **direto** com o `mcp-server` (`fetch` sem credenciais —
 * o CSP do nginx permite `connect-src https:`, mas bloquearia um `<form>` cross-origin).
 * O `authorize` passa pelo Django, que é quem tem a sessão e o segredo do handoff.
 */
export class McpConnectorService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  private get mcpBaseUrl(): string {
    return MCP_BASE_URL.replace(/\/$/, "");
  }

  /** Idempotente: dá para dar refresh na tela de consentimento sem perder o ticket. */
  async lookupPending(ticket: string): Promise<TMcpPendingAuthorization> {
    if (!this.mcpBaseUrl) {
      throw new McpConnectorError("VITE_MCP_BASE_URL não configurado neste build.", "not_configured");
    }

    let response: Response;
    try {
      response = await fetch(`${this.mcpBaseUrl}/oauth/pending/${encodeURIComponent(ticket)}`, {
        method: "GET",
        // Sem credenciais de propósito: este endpoint não é autenticado.
        credentials: "omit",
        headers: { Accept: "application/json" },
      });
    } catch {
      throw new McpConnectorError("Não foi possível falar com o servidor MCP.", "unavailable");
    }

    if (response.status === 404) {
      throw new McpConnectorError("Pedido de autorização inválido ou expirado.", "invalid_ticket");
    }
    if (!response.ok) {
      throw new McpConnectorError("Servidor MCP indisponível.", "unavailable");
    }

    return (await response.json()) as TMcpPendingAuthorization;
  }

  /** «Cancelar» — devolve o redirect com `error=access_denied` (RFC 6749 §4.1.2.1). */
  async deny(ticket: string): Promise<string> {
    if (!this.mcpBaseUrl) {
      throw new McpConnectorError("VITE_MCP_BASE_URL não configurado neste build.", "not_configured");
    }

    let response: Response;
    try {
      response = await fetch(`${this.mcpBaseUrl}/oauth/pending/${encodeURIComponent(ticket)}/deny`, {
        method: "POST",
        credentials: "omit",
        headers: { Accept: "application/json" },
      });
    } catch {
      throw new McpConnectorError("Não foi possível falar com o servidor MCP.", "unavailable");
    }

    if (response.status === 404) {
      throw new McpConnectorError("Pedido de autorização inválido ou expirado.", "invalid_ticket");
    }
    if (!response.ok) {
      throw new McpConnectorError("Servidor MCP indisponível.", "unavailable");
    }

    const body = (await response.json()) as { redirect_url?: string };
    if (!body.redirect_url) {
      throw new McpConnectorError("Servidor MCP não devolveu o endereço de retorno.", "unavailable");
    }
    return body.redirect_url;
  }

  /**
   * O endpoint Django exige CSRF de verdade (ao contrário do resto da app), porque
   * o prémio de um CSRF ali é um `APIToken` de conta inteira. Como
   * `CSRF_COOKIE_HTTPONLY=True`, o JS **não consegue ler** o cookie `csrftoken` —
   * o valor tem de vir de `GET /auth/get-csrf-token/`, o mesmo caminho já usado
   * pelos formulários de login.
   */
  private async csrfHeaders(): Promise<Record<string, string>> {
    const data = await authService.requestCSRFToken();
    const token = data?.csrf_token;
    if (!token) {
      throw new McpConnectorError("Não foi possível obter o token CSRF.", "unavailable");
    }
    return { "X-CSRFToken": token };
  }

  /**
   * «Aceitar» — o Django minta o `APIToken` e entrega-o ao `mcp-server` num POST
   * assinado. Vai com `withCredentials` (cookie de sessão) pelo `APIService`.
   */
  async authorize(ticket: string): Promise<string> {
    const headers = await this.csrfHeaders();
    return this.post("/api/users/mcp-connectors/authorize/", { ticket }, { headers })
      .then((response) => {
        const redirectUrl = response?.data?.redirect_url;
        if (!redirectUrl) {
          throw new McpConnectorError("Resposta sem endereço de retorno.", "unavailable");
        }
        return redirectUrl as string;
      })
      .catch((error) => {
        throw toConnectorError(error, "Não foi possível concluir a autorização.");
      });
  }

  /**
   * Fallback do «Cancelar» pelo Django, para quando o browser não consegue falar
   * direto com o `mcp-server` (rede corporativa, CORS bloqueado). Mesmo endpoint
   * com CSRF do `authorize`.
   */
  async denyViaApi(ticket: string): Promise<string> {
    const headers = await this.csrfHeaders();
    return this.post("/api/users/mcp-connectors/deny/", { ticket }, { headers })
      .then((response) => {
        const redirectUrl = response?.data?.redirect_url;
        if (!redirectUrl) {
          throw new McpConnectorError("Resposta sem endereço de retorno.", "unavailable");
        }
        return redirectUrl as string;
      })
      .catch((error) => {
        throw toConnectorError(error, "Não foi possível cancelar a autorização.");
      });
  }
}

function toConnectorError(error: unknown, fallbackMessage: string): McpConnectorError {
  if (error instanceof McpConnectorError) return error;
  const status = (error as { response?: { status?: number } })?.response?.status;
  if (status === 400) {
    return new McpConnectorError("Pedido de autorização inválido ou expirado.", "invalid_ticket");
  }
  if (status === 503) {
    return new McpConnectorError("Conectores MCP não estão configurados nesta instância.", "not_configured");
  }
  return new McpConnectorError(fallbackMessage, "unavailable");
}
