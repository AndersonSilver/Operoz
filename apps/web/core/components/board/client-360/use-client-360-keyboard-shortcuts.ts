import { useEffect } from "react";
import type { Client360ViewMode } from "@/components/board/client-360/client-360-view-toggle";

export function isClient360KeyboardTargetEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

export type Client360KeyboardShortcutActions = {
  focusSearch: () => void;
  setView: (view: Client360ViewMode) => void;
  exportVisible: () => void;
  enabled?: boolean;
};

export function useClient360KeyboardShortcuts(actions: Client360KeyboardShortcutActions) {
  const { focusSearch, setView, exportVisible, enabled = true } = actions;

  useEffect(() => {
    if (!enabled) return;

    const handler = (event: KeyboardEvent) => {
      if (isClient360KeyboardTargetEditable(event.target)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      switch (event.key) {
        case "/":
          event.preventDefault();
          focusSearch();
          break;
        case "g":
          event.preventDefault();
          setView("grid");
          break;
        case "l":
          event.preventDefault();
          setView("list");
          break;
        case "t":
          event.preventDefault();
          setView("table");
          break;
        case "e":
          event.preventDefault();
          exportVisible();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, exportVisible, focusSearch, setView]);
}
