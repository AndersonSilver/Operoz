import { API_BASE_URL } from "@operoz/constants";
import type {
  TAssistantChatResponse,
  TAssistantCitation,
  TAssistantMessage,
  TAssistantSession,
  TAssistantSessionContext,
} from "@operoz/services";
import { APIService } from "@/services/api.service";
import { AuthService } from "@/services/auth.service";

export type {
  TAssistantChatResponse,
  TAssistantCitation,
  TAssistantMessage,
  TAssistantSession,
  TAssistantSessionContext,
};

export type TAssistantStreamEvent =
  | { type: "token"; content: string }
  | { type: "tool_start"; tool: string }
  | { type: "tool_end"; tool: string; ok: boolean }
  | { type: "queued"; job_id: string; status: string; queue_position?: number; estimated_wait_seconds?: number }
  | { type: "queue_update"; queue_position: number; estimated_wait_seconds: number }
  | { type: "degraded_mode"; active: boolean; model?: string }
  | { type: "started"; job_id: string; status: string }
  | { type: "done"; message: TAssistantMessage; session: TAssistantSession }
  | { type: "error"; error: string; message?: string; retry_after?: number };

export type TAssistantPageIndexStatus = {
  status: "disabled" | "empty" | "not_indexed" | "pending" | "processing" | "indexed" | "failed" | "stale";
  chunk_count: number;
  updated_at: string | null;
  error: string | null;
  message_key: string;
  estimated_seconds_remaining: number | null;
  eta_at: string | null;
  last_index_duration_seconds: number | null;
};

export class AssistantService extends APIService {
  private authService = new AuthService();

  constructor() {
    super(API_BASE_URL);
  }

  async getPageIndexStatus(
    workspaceSlug: string,
    projectId: string,
    pageId: string
  ): Promise<TAssistantPageIndexStatus> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/assistant-index-status/`)
      .then((res) => res?.data as TAssistantPageIndexStatus)
      .catch((error) => {
        throw error?.response;
      });
  }

  async listSessions(workspaceSlug: string): Promise<TAssistantSession[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/assistant/sessions/`)
      .then((res) => res?.data as TAssistantSession[])
      .catch((error) => {
        throw error?.response;
      });
  }

  async createSession(
    workspaceSlug: string,
    data: { title?: string; context?: TAssistantSessionContext } = {}
  ): Promise<TAssistantSession> {
    return this.post(`/api/workspaces/${workspaceSlug}/assistant/sessions/`, data)
      .then((res) => res?.data as TAssistantSession)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateSession(
    workspaceSlug: string,
    sessionId: string,
    data: { title?: string; context?: TAssistantSessionContext }
  ): Promise<TAssistantSession> {
    return this.patch(`/api/workspaces/${workspaceSlug}/assistant/sessions/${sessionId}/`, data)
      .then((res) => res?.data as TAssistantSession)
      .catch((error) => {
        throw error?.response;
      });
  }

  async listMessages(workspaceSlug: string, sessionId: string): Promise<TAssistantMessage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/assistant/sessions/${sessionId}/messages/`)
      .then((res) => res?.data as TAssistantMessage[])
      .catch((error) => {
        throw error?.response;
      });
  }

  async sendMessage(workspaceSlug: string, sessionId: string, message: string): Promise<TAssistantChatResponse> {
    return this.post(`/api/workspaces/${workspaceSlug}/assistant/sessions/${sessionId}/chat/`, { message })
      .then((res) => res?.data as TAssistantChatResponse)
      .catch((error) => {
        throw error?.response;
      });
  }

  async confirmAction(
    workspaceSlug: string,
    sessionId: string,
    proposal: import("@operoz/types").TAssistantActionProposal
  ): Promise<{ ok: boolean; result: Record<string, unknown> }> {
    return this.post(`/api/workspaces/${workspaceSlug}/assistant/sessions/${sessionId}/confirm-action/`, {
      proposal,
    })
      .then((res) => res?.data as { ok: boolean; result: Record<string, unknown> })
      .catch((error) => {
        throw error?.response;
      });
  }

  async submitMessageFeedback(
    workspaceSlug: string,
    sessionId: string,
    messageId: string,
    rating: "up" | "down" | "clear"
  ): Promise<TAssistantMessage> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/assistant/sessions/${sessionId}/messages/${messageId}/feedback/`,
      { rating }
    )
      .then((res) => res?.data as TAssistantMessage)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getQualityDashboard(
    workspaceSlug: string,
    days = 7
  ): Promise<{
    assistant: {
      tool_usage: { rate: number | null; meets_target: boolean | null };
      satisfaction: { rate: number | null; meets_target: boolean | null };
      latency: { p95_first_token_ms: number | null; meets_target: boolean | null };
      hallucination_reviews: { rate: number | null; meets_target: boolean | null };
    };
    automation: { p95_duration_ms: number | null; meets_target: boolean | null };
  }> {
    return this.get(`/api/workspaces/${workspaceSlug}/assistant/quality/?days=${days}`)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteSession(workspaceSlug: string, sessionId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/assistant/sessions/${sessionId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response;
      });
  }

  async sendMessageStream(
    workspaceSlug: string,
    sessionId: string,
    message: string,
    onEvent: (event: TAssistantStreamEvent) => void,
    options: { signal?: AbortSignal; clientMessageId?: string; asyncMode?: boolean } = {}
  ): Promise<void> {
    const csrfToken = await this.authService.requestCSRFToken().then((data) => data?.csrf_token);
    const chatApiBase = (import.meta.env.VITE_ASSISTANT_CHAT_API_URL as string | undefined)?.trim() || API_BASE_URL;
    const apiBase = API_BASE_URL || chatApiBase;
    const useAsync = options.asyncMode ?? (import.meta.env.VITE_ASSISTANT_ASYNC_CHAT as string | undefined) === "1";

    const authHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRFTOKEN": csrfToken } : {}),
    };

    if (useAsync) {
      const enqueueResponse = await fetch(
        `${apiBase}/api/workspaces/${workspaceSlug}/assistant/sessions/${sessionId}/chat/`,
        {
          method: "POST",
          credentials: "include",
          signal: options.signal,
          headers: {
            ...authHeaders,
            Accept: "application/json",
          },
          body: JSON.stringify({
            message,
            stream: true,
            async_mode: true,
            client_message_id: options.clientMessageId,
          }),
        }
      );

      if (!enqueueResponse.ok) {
        await this.handleChatErrorResponse(enqueueResponse, onEvent);
        return;
      }

      const jobPayload = (await enqueueResponse.json()) as { job_id?: string; id?: string };
      const jobId = jobPayload.job_id ?? jobPayload.id;
      if (!jobId) {
        const err = { error: "job_missing", message: "Resposta async sem job_id" };
        onEvent({ type: "error", ...err });
        throw err;
      }

      const streamResponse = await fetch(
        `${chatApiBase}/api/workspaces/${workspaceSlug}/assistant/chat/jobs/${jobId}/stream/`,
        {
          method: "GET",
          credentials: "include",
          signal: options.signal,
          headers: {
            Accept: "text/event-stream",
            ...(csrfToken ? { "X-CSRFTOKEN": csrfToken } : {}),
          },
        }
      );

      if (!streamResponse.ok) {
        await this.handleChatErrorResponse(streamResponse, onEvent);
        return;
      }

      await this.consumeSseResponse(streamResponse, onEvent);
      return;
    }

    const response = await fetch(
      `${chatApiBase}/api/workspaces/${workspaceSlug}/assistant/sessions/${sessionId}/chat/`,
      {
        method: "POST",
        credentials: "include",
        signal: options.signal,
        headers: {
          ...authHeaders,
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ message, stream: true }),
      }
    );

    if (!response.ok) {
      await this.handleChatErrorResponse(response, onEvent);
      return;
    }

    await this.consumeSseResponse(response, onEvent);
  }

  private async handleChatErrorResponse(
    response: Response,
    onEvent: (event: TAssistantStreamEvent) => void
  ): Promise<void> {
    let payload: { error?: string; message?: string; retry_after?: number } = {};
    try {
      payload = await response.json();
    } catch {
      payload = { error: "request_failed", message: response.statusText };
    }
    const headerRetry = response.headers.get("Retry-After");
    const retryAfter = payload.retry_after ?? (headerRetry ? Number.parseInt(headerRetry, 10) : undefined);
    const normalizedRetry =
      typeof retryAfter === "number" && !Number.isNaN(retryAfter) && retryAfter > 0 ? retryAfter : undefined;
    onEvent({
      type: "error",
      error: payload.error ?? "request_failed",
      message: payload.message,
      retry_after: normalizedRetry,
    });
    throw { ...payload, retry_after: normalizedRetry, headers: response.headers };
  }

  private async consumeSseResponse(response: Response, onEvent: (event: TAssistantStreamEvent) => void): Promise<void> {
    if (!response.body) {
      const err = { error: "stream_unsupported", message: "Stream não suportado" };
      onEvent({ type: "error", ...err });
      throw err;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const parseSseEvent = (part: string): TAssistantStreamEvent | null => {
      if (!part.trim()) return null;
      const line = part.split("\n").find((l) => l.startsWith("data: "));
      if (!line) return null;
      try {
        return JSON.parse(line.slice(6)) as TAssistantStreamEvent;
      } catch {
        return null;
      }
    };

    const drainSseBuffer = (input: string, finalize = false): string => {
      let rest = input;
      while (true) {
        const sep = rest.indexOf("\n\n");
        if (sep === -1) break;
        const event = parseSseEvent(rest.slice(0, sep));
        if (event) onEvent(event);
        rest = rest.slice(sep + 2);
      }
      if (finalize && rest.trim()) {
        const event = parseSseEvent(rest);
        if (event) onEvent(event);
        return "";
      }
      return rest;
    };

    while (true) {
      const { done, value } = await reader.read();
      if (value) {
        buffer += decoder.decode(value, { stream: !done });
        buffer = drainSseBuffer(buffer);
      }
      if (done) {
        buffer += decoder.decode();
        drainSseBuffer(buffer, true);
        break;
      }
    }
  }
}
