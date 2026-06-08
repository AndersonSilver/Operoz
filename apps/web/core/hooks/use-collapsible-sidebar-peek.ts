import { useCallback } from "react";
import { SIDEBAR_PEEK_CLOSE_DURATION } from "@/constants/collapsible-sidebar";
import { clearSidebarPeekTimer, scheduleSidebarPeekClose } from "@/lib/sidebar-peek-timer";

type Options = {
  isPinned: boolean;
  setPeekOpen: (open: boolean) => void;
  peekDuration?: number;
  canPeek?: boolean;
};

/** Hover peek + fechamento atrasado (compartilhado entre botão e faixa lateral). */
export function useCollapsibleSidebarPeek(options: Options) {
  const { isPinned, setPeekOpen, peekDuration = SIDEBAR_PEEK_CLOSE_DURATION, canPeek = true } = options;

  const openPeek = useCallback(() => {
    if (!canPeek || isPinned) return;
    clearSidebarPeekTimer();
    setPeekOpen(true);
  }, [canPeek, isPinned, setPeekOpen]);

  const scheduleClosePeek = useCallback(() => {
    if (isPinned) return;
    scheduleSidebarPeekClose(() => setPeekOpen(false), peekDuration);
  }, [isPinned, peekDuration, setPeekOpen]);

  return { openPeek, scheduleClosePeek, isPinned };
}
