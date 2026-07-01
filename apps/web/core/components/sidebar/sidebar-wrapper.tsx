import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useOutsideClickDetector } from "@operoz/hooks";
import { PreferencesIcon } from "@operoz/propel/icons";
import { ScrollArea } from "@operoz/propel/scrollarea";
import { cn } from "@operoz/utils";
import { CustomizeNavigationDialog } from "@/components/navigation/customize-navigation-dialog";
import { WorkspaceMenuRoot } from "@/components/workspace/sidebar/workspace-menu-root";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import useSize from "@/hooks/use-window-size";
import { IconButton } from "@operoz/propel/icon-button";

type TSidebarWrapperProps = {
  title: string;
  children: React.ReactNode;
  quickActions?: React.ReactNode;
  showCustomizeNav?: boolean;
};

export const SidebarWrapper = observer(function SidebarWrapper(props: TSidebarWrapperProps) {
  const { title, children, quickActions, showCustomizeNav = true } = props;
  const [isCustomizeNavDialogOpen, setIsCustomizeNavDialogOpen] = useState(false);
  const { toggleSidebar, sidebarCollapsed } = useAppTheme();
  const windowSize = useSize();
  const ref = useRef<HTMLDivElement>(null);

  useOutsideClickDetector(ref, () => {
    if (sidebarCollapsed === false && window.innerWidth < 768) {
      toggleSidebar();
    }
  });

  useEffect(() => {
    if (windowSize[0] < 768 && !sidebarCollapsed) toggleSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowSize]);

  return (
    <>
      <CustomizeNavigationDialog isOpen={isCustomizeNavDialogOpen} onClose={() => setIsCustomizeNavDialogOpen(false)} />
      <div ref={ref} className="flex h-full w-full animate-fade-in flex-col bg-canvas">
        <div className="flex flex-col gap-2.5 px-2.5 pt-2 pb-2">
          <WorkspaceMenuRoot variant="sidebar" />
          <div className="flex items-center justify-between gap-2 border-b border-subtle/70 px-0.5 pb-2.5">
            <div className="min-w-0">
              <p className="text-11 font-medium tracking-wide text-tertiary uppercase">Operoz</p>
              <p className="truncate text-14 font-semibold text-primary">{title}</p>
            </div>
            {showCustomizeNav && (
              <IconButton
                size="sm"
                variant="ghost"
                icon={PreferencesIcon}
                className="shrink-0 text-tertiary hover:text-secondary"
                onClick={() => setIsCustomizeNavDialogOpen(true)}
                aria-label="Personalizar navegação"
              />
            )}
          </div>
          {quickActions}
        </div>

        <ScrollArea
          orientation="vertical"
          scrollType="hover"
          size="sm"
          rootClassName="size-full overflow-x-hidden overflow-y-auto"
          viewportClassName={cn("flex h-full w-full flex-col gap-2 overflow-x-hidden overflow-y-auto px-2 pb-3")}
        >
          {children}
        </ScrollArea>
      </div>
    </>
  );
});
