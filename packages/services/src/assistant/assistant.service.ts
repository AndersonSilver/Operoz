import { API_BASE_URL } from "@operoz/constants";
import { APIService } from "../api.service";

export type TAssistantSessionContext = {
  board_slug?: string;
  project_id?: string;
};

export type TAssistantSession = {
  id: string;
  title: string;
  context: TAssistantSessionContext;
  created_at: string;
  updated_at: string;
};

export type TAssistantCitation = {
  type: string;
  id: string;
  label: string;
  work_item?: string;
  project_id?: string;
  board_slug?: string;
  run_id?: string;
  state?: string;
  priority?: string;
  assignee?: string;
  excerpt?: string;
  source?: string;
  chunk_index?: number;
};

export type TAssistantMessage = {
  id: string;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  tool_calls?: unknown[];
  tool_call_id?: string;
  citations?: TAssistantCitation[];
  metadata?: Record<string, unknown>;
  created_at: string;
};

export type TAssistantChatResponse = {
  message: TAssistantMessage;
  session: TAssistantSession;
};

export class AssistantService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
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

  async deleteSession(workspaceSlug: string, sessionId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/assistant/sessions/${sessionId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response;
      });
  }
}
