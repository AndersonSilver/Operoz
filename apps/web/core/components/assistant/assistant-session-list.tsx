import { useState } from "react";
import { observer } from "mobx-react";
import { MessageSquarePlus, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { cn } from "@operoz/utils";
import { useAssistant } from "@/hooks/use-assistant";

type Props = {
  variant?: "sidebar" | "drawer";
};

export const AssistantSessionList = observer(function AssistantSessionList({ variant = "sidebar" }: Props) {
  const { t } = useTranslation();
  const assistant = useAssistant();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");

  const activeSession = assistant.sessions.find((s) => s.id === assistant.activeSessionId);

  const closeDrawerIfNeeded = () => {
    if (variant === "drawer" && assistant.showSessionList) {
      assistant.toggleSessionList();
    }
  };

  const startRename = () => {
    setTitleDraft(activeSession?.title || "");
    setEditingTitle(true);
  };

  const commitRename = async () => {
    setEditingTitle(false);
    if (titleDraft.trim() && titleDraft !== activeSession?.title) {
      await assistant.renameActiveSession(titleDraft.trim());
    }
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-layer-1",
        variant === "drawer" ? "w-full border-r border-subtle" : "w-44 shrink-0 border-r border-subtle"
      )}
    >
      <div className="flex items-center justify-between border-b border-subtle px-2 py-2">
        <span className="text-11 font-medium text-secondary">{t("operoz_assistant.sessions")}</span>
        <Button
          variant="ghost"
          size="sm"
          className="size-7 p-0"
          onClick={() => {
            void assistant.createNewSession(assistant.sessionContext);
            closeDrawerIfNeeded();
          }}
          aria-label={t("operoz_assistant.new_session")}
        >
          <MessageSquarePlus className="size-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-1">
        {assistant.sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => {
              void assistant.selectSession(session.id);
              closeDrawerIfNeeded();
            }}
            className={cn(
              "mb-0.5 w-full rounded px-2 py-1.5 text-left text-11 transition-colors",
              session.id === assistant.activeSessionId
                ? "bg-accent-primary/10 text-primary"
                : "text-secondary hover:bg-layer-2"
            )}
          >
            <p className="truncate font-medium">{session.title || t("operoz_assistant.untitled_session")}</p>
          </button>
        ))}
      </div>

      {activeSession && (
        <div className="border-t border-subtle p-2">
          {editingTitle ? (
            <input
              className="w-full rounded border border-subtle bg-surface-1 px-2 py-1 text-11"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={() => void commitRename()}
              onKeyDown={(e) => {
                if (e.key === "Enter") void commitRename();
              }}
              autoFocus
            />
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="flex-1 justify-start px-2" onClick={startRename}>
                <Pencil className="mr-1 size-3" />
                {t("operoz_assistant.rename")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-danger px-2"
                onClick={() => void assistant.deleteActiveSession()}
                aria-label={t("operoz_assistant.delete_session")}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
