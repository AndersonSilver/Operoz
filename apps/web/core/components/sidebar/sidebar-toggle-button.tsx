import { useEffect } from "react";
import { observer } from "mobx-react";
import { PanelLeft } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@operis/utils";
import { getAuxiliarySidebarStorageKey } from "@/components/settings/helper";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useAppSidebarPeek } from "@/hooks/use-app-sidebar-peek";
import { useCollapsibleSidebarPeek } from "@/hooks/use-collapsible-sidebar-peek";
import { isSidebarToggleVisible } from "@/plane-web/components/desktop";
import { IconButton } from "@operis/propel/icon-button";

export const AppSidebarToggleButton = observer(function AppSidebarToggleButton() {
  const pathname = usePathname();
  const { workspaceSlug } = useParams();
  const auxiliaryStorageKey = pathname
    ? getAuxiliarySidebarStorageKey(pathname, workspaceSlug?.toString())
    : null;

  const {
    toggleSidebar,
    sidebarCollapsed,
    sidebarPeek,
    setSidebarPeek,
    auxiliarySidebarPinned,
    auxiliarySidebarPeek,
    bindAuxiliarySidebar,
    toggleAuxiliarySidebarPinned,
    setAuxiliarySidebarPeek,
  } = useAppTheme();

  useEffect(() => {
    if (auxiliaryStorageKey) bindAuxiliarySidebar(auxiliaryStorageKey);
  }, [auxiliaryStorageKey, bindAuxiliarySidebar]);

  const { openPeek: openAppPeek, scheduleClosePeek: scheduleCloseAppPeek } = useAppSidebarPeek();
  const { openPeek: openAuxiliaryPeek, scheduleClosePeek: scheduleCloseAuxiliaryPeek } = useCollapsibleSidebarPeek({
    isPinned: Boolean(auxiliarySidebarPinned),
    setPeekOpen: setAuxiliarySidebarPeek,
    canPeek: Boolean(auxiliaryStorageKey),
  });

  if (!isSidebarToggleVisible()) return null;

  if (auxiliaryStorageKey) {
    const isActive = Boolean(auxiliarySidebarPinned || auxiliarySidebarPeek);
    return (
      <IconButton
        size="base"
        variant="ghost"
        icon={PanelLeft}
        className={cn(isActive && "bg-layer-1 text-primary")}
        onClick={() => {
          if (auxiliarySidebarPeek) setAuxiliarySidebarPeek(false);
          toggleAuxiliarySidebarPinned();
        }}
        onMouseEnter={openAuxiliaryPeek}
        onMouseLeave={scheduleCloseAuxiliaryPeek}
        aria-label={auxiliarySidebarPinned ? "Recolher menu lateral" : "Fixar menu lateral"}
        aria-pressed={auxiliarySidebarPinned}
      />
    );
  }

  const isPinned = !(sidebarCollapsed ?? false);
  const isActive = isPinned || Boolean(sidebarPeek);

  return (
    <IconButton
      size="base"
      variant="ghost"
      icon={PanelLeft}
      className={cn(isActive && "bg-layer-1 text-primary")}
      onClick={() => {
        if (sidebarPeek) setSidebarPeek(false);
        toggleSidebar();
      }}
      onMouseEnter={isPinned ? undefined : openAppPeek}
      onMouseLeave={isPinned ? undefined : scheduleCloseAppPeek}
      aria-label={isPinned ? "Recolher menu principal" : "Fixar menu principal"}
      aria-pressed={isPinned}
    />
  );
});
