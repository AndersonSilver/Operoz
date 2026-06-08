import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { CollapsibleSidebarShell } from "@/components/sidebar/collapsible-sidebar-shell";
import { useAuxiliarySidebar } from "@/hooks/use-auxiliary-sidebar";

type Props = {
  storageKey: string;
  width: number;
  className?: string;
  isMobile?: boolean;
  mobileFallback?: ReactNode;
  children: ReactNode;
};

export const AuxiliaryCollapsibleSidebar = observer(function AuxiliaryCollapsibleSidebar(props: Props) {
  const { storageKey, width, className, isMobile, mobileFallback, children } = props;
  const { isPinned, isPeeking, isOpen, openPeek, scheduleClosePeek } = useAuxiliarySidebar(storageKey);

  if (isMobile && mobileFallback) {
    return <>{mobileFallback}</>;
  }

  return (
    <CollapsibleSidebarShell
      width={width}
      isOpen={isOpen}
      isPinned={isPinned}
      isPeeking={isPeeking}
      onOpenPeek={openPeek}
      onScheduleClosePeek={scheduleClosePeek}
      className={className}
    >
      {children}
    </CollapsibleSidebarShell>
  );
});
