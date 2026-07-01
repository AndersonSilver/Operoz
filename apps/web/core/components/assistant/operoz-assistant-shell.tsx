import { useEffect, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useLocation } from "react-router";
import { Bot } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Tooltip } from "@operoz/propel/tooltip";
import { cn } from "@operoz/utils";
import type { TAssistantSessionContext } from "@/services/assistant.service";
import { isOperozAssistantEnabled } from "@/constants/enable-assistant";
import { mergeAssistantRouteContext, readPersistedAssistantContext } from "@/lib/assistant-context-scope";
import { useAssistant } from "@/hooks/use-assistant";
import { useInstance } from "@/hooks/store/use-instance";
import useLocalStorage from "@/hooks/use-local-storage";
import { OperozAssistantPanel } from "./operoz-assistant-panel";

function parseRouteContext(pathname: string): TAssistantSessionContext {
  const segments = pathname.split("/").filter(Boolean);
  const boardsIdx = segments.indexOf("boards");
  if (boardsIdx >= 0 && segments[boardsIdx + 1]) {
    return { board_slug: segments[boardsIdx + 1] };
  }
  const projectsIdx = segments.indexOf("projects");
  if (projectsIdx >= 0 && segments[projectsIdx + 1]) {
    return { project_id: segments[projectsIdx + 1] };
  }
  return {};
}

export const OperozAssistantShell = observer(function OperozAssistantShell() {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const location = useLocation();
  const assistant = useAssistant();
  const { config: instanceConfig } = useInstance();
  const assistantEnabled = isOperozAssistantEnabled(instanceConfig);
  const { storedValue: isExpanded, setValue: setIsExpanded } = useLocalStorage<boolean>(
    "operoz-assistant-panel-expanded",
    false
  );

  const slug = workspaceSlug?.toString();
  const routeContext = useMemo(() => parseRouteContext(location.pathname), [location.pathname]);
  const initialContext = useMemo(() => {
    if (!slug) return routeContext;
    const persisted = readPersistedAssistantContext(slug);
    return mergeAssistantRouteContext(routeContext, persisted);
  }, [slug, routeContext]);
  const expanded = isExpanded ?? false;

  useEffect(() => {
    if (!assistant.isOpen || !slug) return;
    void assistant.initializeForWorkspace(slug, initialContext);
  }, [assistant.isOpen, slug, initialContext.board_slug, initialContext.project_id]);

  useEffect(() => {
    if (!assistant.isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        assistant.close();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [assistant.isOpen, assistant]);

  if (!assistantEnabled || !slug) {
    return null;
  }

  const handleToggle = () => {
    if (!assistant.isOpen) {
      assistant.open();
    } else {
      assistant.close();
    }
  };

  return (
    <>
      {!assistant.isOpen && (
        <Tooltip tooltipContent={t("operoz_assistant.ask_operoz")}>
          <button
            type="button"
            onClick={handleToggle}
            className={cn(
              "fixed right-6 bottom-6 z-[40] flex size-12 items-center justify-center rounded-full",
              "shadow-lg bg-accent-primary text-on-color transition-transform hover:scale-105"
            )}
            aria-label={t("operoz_assistant.ask_operoz")}
          >
            <Bot className="size-5" />
          </button>
        </Tooltip>
      )}

      {assistant.isOpen && (
        <>
          {expanded && (
            <button
              type="button"
              className="fixed inset-0 z-[38] bg-backdrop transition-opacity"
              aria-label={t("operoz_assistant.close")}
              onClick={() => assistant.close()}
            />
          )}

          <div
            className={cn(
              "shadow-2xl fixed z-[40] flex flex-col overflow-hidden rounded-xl border border-subtle bg-surface-1",
              "transition-[width,height,bottom,right] duration-200 ease-out",
              expanded
                ? "inset-3 sm:inset-auto sm:right-4 sm:bottom-4 sm:h-[min(85vh,900px)] sm:w-[min(720px,calc(100vw-2rem))]"
                : "right-6 bottom-6 h-[min(560px,calc(100vh-5rem))] w-[min(420px,calc(100vw-3rem))]"
            )}
            role="dialog"
            aria-modal="true"
            aria-label={t("operoz_assistant.panel_title")}
          >
            <OperozAssistantPanel
              expanded={expanded}
              onToggleExpand={() => setIsExpanded(!expanded)}
              onClose={() => assistant.close()}
            />
          </div>
        </>
      )}
    </>
  );
});
