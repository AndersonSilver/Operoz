import { action, makeObservable, observable, runInAction } from "mobx";
import type { TAssistantMessage, TAssistantSession, TAssistantSessionContext } from "@/services/assistant.service";
import { ASSISTANT_SESSIONS_CACHE_TTL_MS } from "@/lib/assistant-tool-label";
import {
  ASSISTANT_BOARDS_ENABLED,
  isAssistantSessionContextReady,
  writePersistedAssistantContext,
} from "@/lib/assistant-context-scope";
import { AssistantService } from "@/services/assistant.service";

export interface IAssistantStore {
  isOpen: boolean;
  isSending: boolean;
  isInitializing: boolean;
  isStreaming: boolean;
  streamingContent: string;
  activeStreamTool: string | null;
  error: string | null;
  errorCode: string | null;
  retryAfterSeconds: number | null;
  queuePosition: number | null;
  estimatedWaitSeconds: number | null;
  degradedMode: boolean;
  workspaceSlug: string | null;
  sessionContext: TAssistantSessionContext;
  sessions: TAssistantSession[];
  activeSessionId: string | null;
  messages: TAssistantMessage[];
  messagesRevision: number;
  lastUserMessage: string | null;
  streamStartedAt: number | null;
  showSessionList: boolean;
  requestInputFocus: boolean;
  toggleOpen: () => void;
  open: () => void;
  openWithFocus: () => void;
  close: () => void;
  clearInputFocusRequest: () => void;
  toggleSessionList: () => void;
  clearError: () => void;
  decrementRetryAfter: () => void;
  initializeForWorkspace: (workspaceSlug: string, context?: TAssistantSessionContext) => Promise<void>;
  selectSession: (sessionId: string) => Promise<void>;
  createNewSession: (context?: TAssistantSessionContext) => Promise<void>;
  renameActiveSession: (title: string) => Promise<void>;
  deleteActiveSession: () => Promise<void>;
  updateSessionContext: (context: TAssistantSessionContext) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  retryLastMessage: () => Promise<void>;
  submitMessageFeedback: (messageId: string, rating: "up" | "down" | "clear") => Promise<void>;
}

export class AssistantStore implements IAssistantStore {
  isOpen = false;
  isSending = false;
  isInitializing = false;
  isStreaming = false;
  streamingContent = "";
  activeStreamTool: string | null = null;
  error: string | null = null;
  errorCode: string | null = null;
  retryAfterSeconds: number | null = null;
  queuePosition: number | null = null;
  estimatedWaitSeconds: number | null = null;
  degradedMode = false;
  workspaceSlug: string | null = null;
  sessionContext: TAssistantSessionContext = {};
  sessions: TAssistantSession[] = [];
  activeSessionId: string | null = null;
  messages: TAssistantMessage[] = [];
  messagesRevision = 0;
  lastUserMessage: string | null = null;
  streamStartedAt: number | null = null;
  showSessionList = false;
  requestInputFocus = false;

  private assistantService: AssistantService;
  private initializedWorkspaceSlug: string | null = null;
  private sessionsFetchedAt: number | null = null;
  private streamAbortController: AbortController | null = null;

  constructor() {
    makeObservable(this, {
      isOpen: observable,
      isSending: observable,
      isInitializing: observable,
      isStreaming: observable,
      streamingContent: observable,
      activeStreamTool: observable,
      error: observable,
      errorCode: observable,
      retryAfterSeconds: observable,
      queuePosition: observable,
      estimatedWaitSeconds: observable,
      degradedMode: observable,
      workspaceSlug: observable,
      sessionContext: observable,
      sessions: observable,
      activeSessionId: observable,
      messages: observable,
      messagesRevision: observable,
      lastUserMessage: observable,
      streamStartedAt: observable,
      showSessionList: observable,
      requestInputFocus: observable,
      toggleOpen: action,
      open: action,
      openWithFocus: action,
      close: action,
      clearInputFocusRequest: action,
      toggleSessionList: action,
      clearError: action,
      decrementRetryAfter: action,
      initializeForWorkspace: action,
      selectSession: action,
      createNewSession: action,
      renameActiveSession: action,
      deleteActiveSession: action,
      updateSessionContext: action,
      sendMessage: action,
      retryLastMessage: action,
      submitMessageFeedback: action,
    });
    this.assistantService = new AssistantService();
  }

  toggleOpen = () => {
    this.isOpen = !this.isOpen;
  };

  open = () => {
    this.isOpen = true;
  };

  openWithFocus = () => {
    this.isOpen = true;
    this.requestInputFocus = true;
  };

  clearInputFocusRequest = () => {
    this.requestInputFocus = false;
  };

  close = () => {
    this.abortActiveStream();
    this.isOpen = false;
  };

  toggleSessionList = () => {
    this.showSessionList = !this.showSessionList;
  };

  clearError = () => {
    this.error = null;
    this.errorCode = null;
    this.retryAfterSeconds = null;
  };

  decrementRetryAfter = () => {
    if (this.retryAfterSeconds == null || this.retryAfterSeconds <= 0) return;
    this.retryAfterSeconds -= 1;
    if (this.retryAfterSeconds <= 0) {
      this.retryAfterSeconds = null;
    }
  };

  private invalidateSessionsCache = () => {
    this.sessionsFetchedAt = null;
  };

  private parseRetryAfter = (err: unknown): number => {
    const response = (err as { headers?: { get?: (name: string) => string | null } })?.headers;
    const headerValue = response?.get?.("Retry-After");
    if (headerValue) {
      const parsed = Number.parseInt(headerValue, 10);
      if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    }
    const data =
      (err as { data?: { retry_after?: number }; retry_after?: number })?.data ?? (err as { retry_after?: number });
    const fromBody = data?.retry_after;
    if (typeof fromBody === "number" && fromBody > 0) return fromBody;
    return 0;
  };

  private setErrorFromResponse = (err: unknown) => {
    const data =
      (
        err as {
          data?: { error?: string; message?: string; retry_after?: number };
          error?: string;
          message?: string;
          retry_after?: number;
        }
      )?.data ?? (err as { error?: string; message?: string; retry_after?: number });
    const retryAfter = this.parseRetryAfter(err) || data?.retry_after || 0;
    runInAction(() => {
      this.errorCode = data?.error ?? "unknown_error";
      this.error = data?.message ?? "Não foi possível concluir a solicitação.";
      this.retryAfterSeconds = retryAfter > 0 ? retryAfter : null;
    });
  };

  private filterVisibleMessages(messages: TAssistantMessage[]) {
    return messages.filter((m) => {
      if (m.role === "user") return true;
      if (m.role !== "assistant") return false;
      const content = (m.content || "").trim();
      // Intermediate LLM rounds with tool calls are persisted without visible text.
      if (!content) return false;
      return true;
    });
  }

  private normalizeMessage(message: TAssistantMessage): TAssistantMessage {
    return {
      ...message,
      id: String(message.id),
    };
  }

  private setMessages(messages: TAssistantMessage[]) {
    this.messages = messages;
    this.messagesRevision += 1;
  }

  private async loadMessagesForSession(workspaceSlug: string, sessionId: string, options: { force?: boolean } = {}) {
    const messages = await this.assistantService.listMessages(workspaceSlug, sessionId);
    runInAction(() => {
      if (!options.force && (this.isSending || this.isStreaming)) return;
      if (this.activeSessionId !== sessionId) return;
      this.setMessages(this.filterVisibleMessages(messages).map((message) => this.normalizeMessage(message)));
    });
  }

  private async refreshSessions(workspaceSlug: string, options: { force?: boolean } = {}) {
    const now = Date.now();
    if (
      !options.force &&
      this.sessionsFetchedAt != null &&
      now - this.sessionsFetchedAt < ASSISTANT_SESSIONS_CACHE_TTL_MS &&
      this.sessions.length > 0
    ) {
      return this.sessions;
    }

    const sessions = await this.assistantService.listSessions(workspaceSlug);
    runInAction(() => {
      this.sessions = sessions;
      this.sessionsFetchedAt = now;
    });
    return sessions;
  }

  initializeForWorkspace = async (workspaceSlug: string, context: TAssistantSessionContext = {}) => {
    if (this.isSending) return;

    const alreadyInitialized =
      this.initializedWorkspaceSlug === workspaceSlug && Boolean(this.activeSessionId) && !this.isInitializing;

    if (alreadyInitialized) {
      runInAction(() => {
        this.workspaceSlug = workspaceSlug;
        if (Object.keys(context).length > 0) {
          this.sessionContext = { ...this.sessionContext, ...context };
        }
      });
      return;
    }

    if (this.isInitializing) return;

    runInAction(() => {
      this.isInitializing = true;
      this.workspaceSlug = workspaceSlug;
      this.sessionContext = context;
      this.error = null;
      this.errorCode = null;
    });

    try {
      const sessions = await this.refreshSessions(workspaceSlug);
      let activeSession = sessions.find((s) => s.id === this.activeSessionId) ?? sessions[0];

      if (!activeSession) {
        activeSession = await this.assistantService.createSession(workspaceSlug, {
          title: "",
          context,
        });
        this.invalidateSessionsCache();
        await this.refreshSessions(workspaceSlug, { force: true });
      } else if (
        Object.keys(context).length > 0 &&
        !activeSession.context?.board_slug &&
        !activeSession.context?.project_id
      ) {
        activeSession = await this.assistantService.updateSession(workspaceSlug, activeSession.id, { context });
      }

      runInAction(() => {
        this.activeSessionId = activeSession.id;
        this.sessionContext = activeSession.context ?? context;
      });

      await this.loadMessagesForSession(workspaceSlug, activeSession.id);
    } catch (err) {
      this.setErrorFromResponse(err);
    } finally {
      runInAction(() => {
        this.isInitializing = false;
        this.initializedWorkspaceSlug = workspaceSlug;
      });
    }
  };

  selectSession = async (sessionId: string) => {
    if (!this.workspaceSlug || sessionId === this.activeSessionId) return;
    const session = this.sessions.find((s) => s.id === sessionId);
    if (!session) return;

    runInAction(() => {
      this.activeSessionId = sessionId;
      this.sessionContext = session.context ?? {};
      this.setMessages([]);
      this.error = null;
      this.errorCode = null;
    });

    try {
      await this.loadMessagesForSession(this.workspaceSlug, sessionId);
    } catch (err) {
      this.setErrorFromResponse(err);
    }
  };

  createNewSession = async (context: TAssistantSessionContext = {}) => {
    if (!this.workspaceSlug) return;
    const mergedContext = { ...this.sessionContext, ...context };

    try {
      const session = await this.assistantService.createSession(this.workspaceSlug, {
        title: "",
        context: mergedContext,
      });
      this.invalidateSessionsCache();
      await this.refreshSessions(this.workspaceSlug, { force: true });
      runInAction(() => {
        this.activeSessionId = session.id;
        this.sessionContext = session.context ?? mergedContext;
        this.setMessages([]);
        this.error = null;
        this.errorCode = null;
      });
    } catch (err) {
      this.setErrorFromResponse(err);
    }
  };

  renameActiveSession = async (title: string) => {
    if (!this.workspaceSlug || !this.activeSessionId) return;
    try {
      const session = await this.assistantService.updateSession(this.workspaceSlug, this.activeSessionId, { title });
      runInAction(() => {
        this.sessions = this.sessions.map((s) => (s.id === session.id ? session : s));
        this.sessionsFetchedAt = Date.now();
      });
    } catch (err) {
      this.setErrorFromResponse(err);
    }
  };

  deleteActiveSession = async () => {
    if (!this.workspaceSlug || !this.activeSessionId) return;
    const deletedId = this.activeSessionId;

    try {
      await this.assistantService.deleteSession(this.workspaceSlug, deletedId);
      this.invalidateSessionsCache();
      const sessions = await this.refreshSessions(this.workspaceSlug, { force: true });
      const next = sessions[0];
      if (next) {
        await this.selectSession(next.id);
      } else {
        await this.createNewSession(this.sessionContext);
      }
    } catch (err) {
      this.setErrorFromResponse(err);
    }
  };

  updateSessionContext = async (context: TAssistantSessionContext) => {
    if (!this.workspaceSlug || !this.activeSessionId) return;
    try {
      const session = await this.assistantService.updateSession(this.workspaceSlug, this.activeSessionId, {
        context,
      });
      runInAction(() => {
        this.sessionContext = session.context ?? context;
        this.sessions = this.sessions.map((s) => (s.id === session.id ? session : s));
        this.persistSessionContext();
      });
    } catch (err) {
      this.setErrorFromResponse(err);
    }
  };

  private abortActiveStream = () => {
    this.streamAbortController?.abort();
    this.streamAbortController = null;
  };

  private isAbortError = (err: unknown) => err instanceof DOMException && err.name === "AbortError";

  hasRequiredSessionContext = () =>
    isAssistantSessionContextReady(this.sessionContext, {
      boardsEnabled: ASSISTANT_BOARDS_ENABLED,
      hasBoards: ASSISTANT_BOARDS_ENABLED,
    });

  private persistSessionContext = () => {
    if (!this.workspaceSlug) return;
    writePersistedAssistantContext(this.workspaceSlug, this.sessionContext);
  };

  sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !this.workspaceSlug || !this.activeSessionId) return;
    if (!this.hasRequiredSessionContext()) {
      runInAction(() => {
        this.errorCode = "context_required";
        this.error = "Selecione board e projeto antes de enviar.";
      });
      return;
    }
    if (this.isSending) {
      this.abortActiveStream();
    }

    const workspaceSlug = this.workspaceSlug;
    const sessionId = this.activeSessionId;
    const optimisticUserMessage: TAssistantMessage = {
      id: `temp-user-${Date.now()}`,
      role: "user",
      content: trimmed,
      created_at: new Date().toISOString(),
    };

    this.abortActiveStream();
    const abortController = new AbortController();
    this.streamAbortController = abortController;
    const clientMessageId =
      typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `msg-${Date.now()}`;

    runInAction(() => {
      this.isSending = true;
      this.isStreaming = false;
      this.streamingContent = "";
      this.activeStreamTool = null;
      this.error = null;
      this.errorCode = null;
      this.retryAfterSeconds = null;
      this.queuePosition = null;
      this.estimatedWaitSeconds = null;
      this.degradedMode = false;
      this.streamStartedAt = Date.now();
      this.lastUserMessage = trimmed;
      this.setMessages([...this.messages, optimisticUserMessage]);
    });

    let streamFailed = false;

    try {
      await this.assistantService.sendMessageStream(
        workspaceSlug,
        sessionId,
        trimmed,
        (event) => {
          runInAction(() => {
            if (this.activeSessionId !== sessionId) return;

            if (event.type === "token") {
              this.isStreaming = true;
              this.activeStreamTool = null;
              this.queuePosition = null;
              this.streamStartedAt = null;
              this.streamingContent += event.content;
            } else if (event.type === "queued" || event.type === "queue_update") {
              this.queuePosition = event.queue_position ?? this.queuePosition;
              this.estimatedWaitSeconds = event.estimated_wait_seconds ?? this.estimatedWaitSeconds;
            } else if (event.type === "degraded_mode") {
              this.degradedMode = Boolean(event.active);
            } else if (event.type === "tool_start") {
              this.activeStreamTool = event.tool;
              this.streamingContent = "";
              this.isStreaming = false;
            } else if (event.type === "tool_end") {
              if (this.activeStreamTool === event.tool) {
                this.activeStreamTool = null;
              }
            } else if (event.type === "done") {
              const assistantMessage = this.normalizeMessage(event.message);
              const visible = this.filterVisibleMessages([assistantMessage]);
              const withoutTempAssistant = this.messages.filter((m) => !m.id.startsWith("temp-assistant-"));
              this.setMessages([...withoutTempAssistant, ...visible]);
              this.sessions = [event.session, ...this.sessions.filter((s) => s.id !== event.session.id)];
              this.streamingContent = "";
              this.isStreaming = false;
              this.activeStreamTool = null;
              this.queuePosition = null;
              this.estimatedWaitSeconds = null;
              this.streamStartedAt = null;
            } else if (event.type === "error") {
              streamFailed = true;
              this.errorCode = event.error;
              this.error = event.message ?? "Não foi possível concluir a solicitação.";
              if (event.retry_after && event.retry_after > 0) {
                this.retryAfterSeconds = event.retry_after;
              }
              this.streamStartedAt = null;
            }
          });
        },
        { signal: abortController.signal, clientMessageId }
      );
    } catch (err) {
      if (this.isAbortError(err)) {
        return;
      }
      if (!streamFailed) {
        this.setErrorFromResponse(err);
      }
      runInAction(() => {
        this.setMessages(this.messages.filter((m) => m.id !== optimisticUserMessage.id));
      });
    } finally {
      if (this.streamAbortController === abortController) {
        this.streamAbortController = null;
      }
      runInAction(() => {
        this.isSending = false;
        this.isStreaming = false;
        this.streamingContent = "";
        this.activeStreamTool = null;
        this.streamStartedAt = null;
      });
    }
  };

  retryLastMessage = async () => {
    if (!this.lastUserMessage) return;
    await this.sendMessage(this.lastUserMessage);
  };

  submitMessageFeedback = async (messageId: string, rating: "up" | "down" | "clear") => {
    if (!this.workspaceSlug || !this.activeSessionId) return;
    try {
      const updated = await this.assistantService.submitMessageFeedback(
        this.workspaceSlug,
        this.activeSessionId,
        messageId,
        rating
      );
      runInAction(() => {
        this.setMessages(this.messages.map((m) => (m.id === messageId ? updated : m)));
      });
    } catch (err) {
      this.setErrorFromResponse(err);
    }
  };
}
