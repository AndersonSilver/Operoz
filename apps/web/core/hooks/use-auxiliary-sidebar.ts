import { useEffect } from "react";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useCollapsibleSidebarPeek } from "@/hooks/use-collapsible-sidebar-peek";

export function useAuxiliarySidebar(storageKey: string | null) {
  const { auxiliarySidebarPinned, auxiliarySidebarPeek, bindAuxiliarySidebar, setAuxiliarySidebarPeek } = useAppTheme();

  useEffect(() => {
    if (storageKey) bindAuxiliarySidebar(storageKey);
  }, [bindAuxiliarySidebar, storageKey]);

  useEffect(
    () => () => {
      setAuxiliarySidebarPeek(false);
    },
    [setAuxiliarySidebarPeek]
  );

  const isPinned = Boolean(auxiliarySidebarPinned);
  const isPeeking = Boolean(auxiliarySidebarPeek) && !isPinned;
  const isOpen = isPinned || isPeeking;

  const { openPeek, scheduleClosePeek } = useCollapsibleSidebarPeek({
    isPinned,
    setPeekOpen: setAuxiliarySidebarPeek,
    canPeek: Boolean(storageKey),
  });

  return { isPinned, isPeeking, isOpen, openPeek, scheduleClosePeek };
}
