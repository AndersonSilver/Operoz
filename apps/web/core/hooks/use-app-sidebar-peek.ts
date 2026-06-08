import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useCollapsibleSidebarPeek } from "@/hooks/use-collapsible-sidebar-peek";

export function useAppSidebarPeek() {
  const { sidebarCollapsed, setSidebarPeek } = useAppTheme();
  const isPinned = !(sidebarCollapsed ?? false);

  return useCollapsibleSidebarPeek({
    isPinned,
    setPeekOpen: setSidebarPeek,
  });
}
