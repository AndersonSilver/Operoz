import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  Bot,
  History,
  Maximize2,
  Minimize2,
  RefreshCw,
  Send,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { TextArea } from "@operoz/ui";
import { cn } from "@operoz/utils";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { AssistantThinkingIndicator } from "@/components/assistant/assistant-thinking-indicator";
import { AssistantActionProposal } from "@/components/assistant/assistant-action-proposal";
import { AssistantAutomationProposal } from "@/components/assistant/assistant-automation-proposal";
import { AssistantPackInstallProposal } from "@/components/assistant/assistant-pack-install-proposal";
import { AssistantSafeContent } from "@/components/assistant/assistant-safe-content";
import { AssistantContextChip } from "@/components/assistant/assistant-context-chip";
import { AssistantSessionList } from "@/components/assistant/assistant-session-list";
import { useAssistant } from "@/hooks/use-assistant";
import { useAssistantContextScope } from "@/hooks/use-assistant-context-scope";

type Props = {
  onClose: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
};

export const OperozAssistantPanel = observer(function OperozAssistantPanel({
  onClose,
  expanded,
  onToggleExpand,
}: Props) {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const assistant = useAssistant();
  const { isReady: isContextReady } = useAssistantContextScope();
  const slug = workspaceSlug?.toString() ?? assistant.workspaceSlug ?? "";
  const [draft, setDraft] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [assistant.messages.length, assistant.messagesRevision, assistant.isSending, assistant.streamingContent]);

  useEffect(() => {
    if (assistant.retryAfterSeconds == null || assistant.retryAfterSeconds <= 0) return undefined;
    const timer = window.setInterval(() => {
      assistant.decrementRetryAfter();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [assistant, assistant.retryAfterSeconds]);

  useEffect(() => {
    if (!assistant.requestInputFocus) return;
    textareaRef.current?.focus();
    assistant.clearInputFocusRequest();
  }, [assistant.requestInputFocus, assistant]);

  const isLlmUnavailable = assistant.errorCode === "llm_not_configured";

  const handleSend = async () => {
    const text = draft;
    if (!text.trim() || !isContextReady) return;
    setDraft("");
    await assistant.sendMessage(text);
    textareaRef.current?.focus();
  };

  const canSend = Boolean(draft.trim()) && isContextReady && !assistant.isSending && !isLlmUnavailable;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const isRateLimited =
    assistant.errorCode === "user_rate_limit" ||
    assistant.errorCode === "workspace_rate_limit" ||
    assistant.errorCode === "concurrent_rate_limit" ||
    assistant.errorCode === "llm_capacity";
  const errorTitleKey = isLlmUnavailable
    ? "operoz_assistant.error_llm_not_configured"
    : assistant.errorCode === "user_rate_limit"
      ? "operoz_assistant.error_user_rate_limit"
      : assistant.errorCode === "workspace_rate_limit"
        ? "operoz_assistant.error_workspace_rate_limit"
        : assistant.errorCode === "concurrent_rate_limit"
          ? "operoz_assistant.error_concurrent_rate_limit"
          : assistant.errorCode === "llm_capacity"
            ? "operoz_assistant.error_llm_capacity"
            : assistant.errorCode === "context_required"
              ? "operoz_assistant.error_context_required"
              : "operoz_assistant.error_generic";
  const retryBlocked = (assistant.retryAfterSeconds ?? 0) > 0;
  const isEmpty =
    !assistant.isInitializing && assistant.messages.length === 0 && !assistant.error && !assistant.isSending;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 flex-col gap-2.5 border-b border-subtle bg-surface-1/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="shadow-sm inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-primary/15 text-accent-primary">
              <Bot className="size-4" strokeWidth={2} />
            </span>
            <p className="truncate text-14 font-semibold tracking-tight text-primary">
              {t("operoz_assistant.panel_title")}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              className={cn(
                "grid size-7 place-items-center rounded text-secondary hover:bg-layer-1 hover:text-primary",
                assistant.showSessionList && "bg-accent-primary/10 text-accent-primary"
              )}
              onClick={() => assistant.toggleSessionList()}
              aria-label={t("operoz_assistant.toggle_sessions")}
              aria-pressed={assistant.showSessionList}
            >
              <History className="size-4" />
            </button>
            <button
              type="button"
              className="grid size-7 place-items-center rounded text-secondary hover:bg-layer-1 hover:text-primary"
              onClick={onToggleExpand}
              aria-label={expanded ? t("operoz_assistant.collapse") : t("operoz_assistant.expand")}
            >
              {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
            <button
              type="button"
              className="grid size-7 place-items-center rounded text-secondary hover:bg-layer-1 hover:text-primary"
              onClick={onClose}
              aria-label={t("operoz_assistant.close")}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        <AssistantContextChip />
      </header>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {assistant.showSessionList && (
          <>
            <button
              type="button"
              className="absolute inset-0 z-10 bg-backdrop/40"
              aria-label={t("operoz_assistant.close_sessions")}
              onClick={() => assistant.toggleSessionList()}
            />
            <div className="shadow-lg absolute inset-y-0 left-0 z-20 w-52">
              <AssistantSessionList variant="drawer" />
            </div>
          </>
        )}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {assistant.isInitializing ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">
              <LogoSpinner />
              <p className="text-13 text-secondary">{t("operoz_assistant.loading")}</p>
            </div>
          ) : (
            <>
              <div
                key={`${assistant.activeSessionId ?? "none"}-${assistant.messagesRevision}`}
                className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
              >
                {isEmpty && (
                  <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
                    <Bot className="size-8 text-tertiary" />
                    <p className="text-13 font-medium text-primary">{t("operoz_assistant.empty_title")}</p>
                    <p className="text-12 text-tertiary">
                      {isContextReady
                        ? t("operoz_assistant.empty_hint")
                        : t("operoz_assistant.empty_hint_select_context")}
                    </p>
                  </div>
                )}

                {assistant.messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn("flex gap-2", message.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {message.role === "assistant" && (
                      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-primary/15">
                        <Bot className="size-3.5 text-accent-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "shadow-sm max-w-[85%] rounded-xl px-3.5 py-2.5",
                        message.role === "user"
                          ? "bg-accent-primary text-on-color"
                          : "border border-subtle/80 bg-layer-1"
                      )}
                    >
                      <AssistantSafeContent content={message.content} inheritColor={message.role === "user"} />
                      {message.role === "assistant" && slug && message.metadata?.automation_proposal != null && (
                        <AssistantAutomationProposal
                          workspaceSlug={slug}
                          proposal={
                            message.metadata.automation_proposal as import("@operoz/types").TAssistantAutomationProposal
                          }
                        />
                      )}
                      {message.role === "assistant" && slug && message.metadata?.pack_install_proposal != null && (
                        <AssistantPackInstallProposal
                          workspaceSlug={slug}
                          proposal={
                            message.metadata
                              .pack_install_proposal as import("@operoz/types").TAssistantPackInstallProposal
                          }
                        />
                      )}
                      {message.role === "assistant" &&
                        slug &&
                        assistant.activeSessionId &&
                        message.metadata?.action_proposal != null && (
                          <AssistantActionProposal
                            workspaceSlug={slug}
                            sessionId={assistant.activeSessionId}
                            proposal={
                              message.metadata.action_proposal as import("@operoz/types").TAssistantActionProposal
                            }
                          />
                        )}
                      {message.role === "assistant" && !message.id.startsWith("temp-") && (
                        <div className="mt-2 flex gap-1 border-t border-subtle pt-2">
                          <button
                            type="button"
                            className={cn(
                              "rounded p-1 text-tertiary hover:bg-layer-2 hover:text-primary",
                              message.metadata?.feedback_rating === "up" && "bg-accent-primary/10 text-accent-primary"
                            )}
                            aria-label={t("operoz_assistant.feedback_up")}
                            onClick={() =>
                              void assistant.submitMessageFeedback(
                                message.id,
                                message.metadata?.feedback_rating === "up" ? "clear" : "up"
                              )
                            }
                          >
                            <ThumbsUp className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            className={cn(
                              "rounded p-1 text-tertiary hover:bg-layer-2 hover:text-primary",
                              message.metadata?.feedback_rating === "down" && "text-danger bg-danger-subtle"
                            )}
                            aria-label={t("operoz_assistant.feedback_down")}
                            onClick={() =>
                              void assistant.submitMessageFeedback(
                                message.id,
                                message.metadata?.feedback_rating === "down" ? "clear" : "down"
                              )
                            }
                          >
                            <ThumbsDown className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {assistant.degradedMode && (
                  <div className="rounded-lg border border-subtle bg-layer-2 px-3 py-2 text-12 text-secondary">
                    {t("operoz_assistant.degraded_mode_banner")}
                  </div>
                )}

                {assistant.isSending && assistant.queuePosition != null && assistant.queuePosition > 0 && (
                  <div
                    className="rounded-lg border border-subtle bg-layer-2 px-3 py-2 text-12 text-secondary"
                    role="status"
                    aria-live="polite"
                  >
                    {t("operoz_assistant.queue_waiting", {
                      position: assistant.queuePosition,
                      seconds: assistant.estimatedWaitSeconds ?? 15,
                    })}
                  </div>
                )}

                {assistant.isSending && !assistant.streamingContent && (
                  <AssistantThinkingIndicator
                    activeTool={assistant.activeStreamTool}
                    startedAt={assistant.streamStartedAt}
                  />
                )}

                {assistant.isStreaming && assistant.streamingContent && (
                  <div className="flex justify-start gap-2">
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-primary/15">
                      <Bot className="size-3.5 text-accent-primary" />
                    </div>
                    <div className="shadow-sm max-w-[85%] rounded-xl border border-subtle/80 bg-layer-1 px-3.5 py-2.5">
                      <AssistantSafeContent content={assistant.streamingContent} />
                    </div>
                  </div>
                )}

                {assistant.error && (
                  <div className="rounded-lg border border-danger-subtle bg-danger-subtle/30 p-3" role="alert">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="text-danger mt-0.5 size-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-13 font-medium text-primary">{t(errorTitleKey)}</p>
                        <p className="mt-1 text-12 text-secondary">
                          {isRateLimited && retryBlocked
                            ? t("operoz_assistant.error_rate_limit_retry", {
                                seconds: assistant.retryAfterSeconds ?? 0,
                              })
                            : assistant.error}
                        </p>
                        {!isLlmUnavailable && assistant.lastUserMessage && (
                          <Button
                            variant="link"
                            size="sm"
                            className="mt-2 px-0"
                            disabled={retryBlocked}
                            onClick={() => void assistant.retryLastMessage()}
                          >
                            <RefreshCw className="mr-1 size-3" />
                            {retryBlocked
                              ? t("operoz_assistant.retry_in", {
                                  seconds: assistant.retryAfterSeconds ?? 0,
                                })
                              : t("operoz_assistant.retry")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="shrink-0 border-t border-subtle bg-surface-1/95 px-3 pt-2.5 pb-3 backdrop-blur-sm">
                <div
                  className={cn(
                    "shadow-sm relative rounded-xl border border-subtle bg-layer-1 transition-[border-color,box-shadow]",
                    "focus-within:border-accent-primary/35 focus-within:shadow-accent-primary/10 focus-within:shadow-[0_0_0_3px]",
                    (assistant.isSending || isLlmUnavailable || !isContextReady) && "opacity-70"
                  )}
                >
                  <TextArea
                    ref={textareaRef}
                    mode="true-transparent"
                    textAreaSize="sm"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isContextReady
                        ? t("operoz_assistant.input_placeholder")
                        : t("operoz_assistant.input_placeholder_select_context")
                    }
                    disabled={assistant.isSending || isLlmUnavailable || !isContextReady}
                    rows={1}
                    className="max-h-36 min-h-[52px] resize-none px-3.5 py-3 pr-14 text-13 leading-relaxed"
                  />
                  <button
                    type="button"
                    disabled={!canSend}
                    onClick={() => void handleSend()}
                    aria-label={t("operoz_assistant.send")}
                    className={cn(
                      "absolute right-2.5 bottom-2.5 inline-flex size-9 items-center justify-center rounded-lg transition-all",
                      canSend
                        ? "shadow-md bg-accent-primary text-on-color hover:scale-[1.02] hover:bg-accent-primary-hover active:scale-[0.98]"
                        : "cursor-not-allowed bg-layer-2 text-tertiary"
                    )}
                  >
                    <Send className="size-4" strokeWidth={2} />
                  </button>
                </div>
                <p className="mt-2 text-center text-10 text-tertiary">{t("operoz_assistant.input_hint")}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
