import type { ReactNode } from "react";
import { cn } from "@operoz/utils";
import { SIDEBAR_HOVER_STRIP_WIDTH } from "@/constants/collapsible-sidebar";

type Props = {
  width: number;
  isOpen: boolean;
  isPinned: boolean;
  isPeeking: boolean;
  onOpenPeek: () => void;
  onScheduleClosePeek: () => void;
  className?: string;
  children: ReactNode;
};

export function CollapsibleSidebarShell(props: Props) {
  const { width, isOpen, isPinned, isPeeking, onOpenPeek, onScheduleClosePeek, className, children } = props;

  return (
    <div
      className={cn(
        "relative h-full shrink-0 transition-[width] duration-300 ease-in-out",
        isOpen ? "overflow-hidden border-r border-subtle" : "overflow-visible",
        className
      )}
      style={{ width: isOpen ? width : 0 }}
      onMouseEnter={!isPinned ? onOpenPeek : undefined}
      onMouseLeave={isPeeking ? onScheduleClosePeek : undefined}
    >
      {!isOpen && (
        <div
          className="absolute inset-y-0 left-0 z-10"
          style={{ width: SIDEBAR_HOVER_STRIP_WIDTH }}
          aria-hidden
          onMouseEnter={onOpenPeek}
        />
      )}

      {isOpen && children}
    </div>
  );
}
