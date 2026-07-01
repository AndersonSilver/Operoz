import type { Dispatch, ReactElement, SetStateAction } from "react";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { usePlatformOS } from "@operoz/hooks";
import { cn } from "@operoz/utils";
import { SIDEBAR_HOVER_STRIP_WIDTH, SIDEBAR_PEEK_CLOSE_DURATION } from "@/constants/collapsible-sidebar";
import { clearSidebarPeekTimer, scheduleSidebarPeekClose } from "@/lib/sidebar-peek-timer";

interface ResizableSidebarProps {
  showPeek?: boolean;
  togglePeek: (value?: boolean) => void;
  isCollapsed?: boolean;
  width: number;
  setWidth: Dispatch<SetStateAction<number>>;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  defaultCollapsed?: boolean;
  peekDuration?: number;
  toggleCollapsed: (value?: boolean) => void;
  onWidthChange?: (width: number) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
  children?: ReactElement;
  extendedSidebar?: ReactElement;
  isAnyExtendedSidebarExpanded?: boolean;
  isAnySidebarDropdownOpen?: boolean;
}

export function ResizableSidebar({
  showPeek = false,
  togglePeek,
  peekDuration = SIDEBAR_PEEK_CLOSE_DURATION,
  isCollapsed = false,
  toggleCollapsed: toggleCollapsedProp,
  onCollapsedChange,
  width,
  setWidth,
  onWidthChange,
  minWidth = 236,
  maxWidth = 350,
  className = "",
  children,
  extendedSidebar,
  isAnyExtendedSidebarExpanded = false,
  isAnySidebarDropdownOpen = false,
}: ResizableSidebarProps) {
  const [isResizing, setIsResizing] = useState(false);
  const initialWidthRef = useRef<number>(0);
  const initialMouseXRef = useRef<number>(0);
  const { isMobile } = usePlatformOS();

  const isPinned = !isCollapsed;
  const isPeeking = isCollapsed && showPeek;
  const isOpen = isPinned || isPeeking;

  const setShowPeek = useCallback(
    (value: boolean) => {
      togglePeek(value);
    },
    [togglePeek]
  );

  const openPeek = useCallback(() => {
    if (!isCollapsed || isAnyExtendedSidebarExpanded || isAnySidebarDropdownOpen) return;
    clearSidebarPeekTimer();
    setShowPeek(true);
  }, [isAnyExtendedSidebarExpanded, isAnySidebarDropdownOpen, isCollapsed, setShowPeek]);

  const scheduleClosePeek = useCallback(() => {
    if (!isCollapsed || isAnyExtendedSidebarExpanded || isAnySidebarDropdownOpen) return;
    scheduleSidebarPeekClose(() => setShowPeek(false), peekDuration);
  }, [isAnyExtendedSidebarExpanded, isAnySidebarDropdownOpen, isCollapsed, peekDuration, setShowPeek]);

  const handleResize = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const deltaX = e.clientX - initialMouseXRef.current;
      const newWidth = Math.min(Math.max(initialWidthRef.current + deltaX, minWidth), maxWidth);
      setWidth(newWidth);
    },
    [isResizing, minWidth, maxWidth, setWidth]
  );

  const startResizing = useCallback(
    (e: React.MouseEvent) => {
      setIsResizing(true);
      initialWidthRef.current = width;
      initialMouseXRef.current = e.clientX;
    },
    [width]
  );

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const toggleCollapsed = useCallback(() => {
    toggleCollapsedProp();
    setShowPeek(false);
    clearSidebarPeekTimer();
  }, [toggleCollapsedProp, setShowPeek]);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", stopResizing);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", stopResizing);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleResize, stopResizing]);

  useEffect(() => {
    if (!isCollapsed) {
      setShowPeek(false);
      clearSidebarPeekTimer();
    }
  }, [isCollapsed, setShowPeek]);

  useEffect(() => {
    if (isAnySidebarDropdownOpen || isAnyExtendedSidebarExpanded) {
      scheduleClosePeek();
    }
  }, [isAnyExtendedSidebarExpanded, isAnySidebarDropdownOpen, scheduleClosePeek]);

  useEffect(() => {
    onWidthChange?.(width);
  }, [width, onWidthChange]);

  useEffect(() => {
    onCollapsedChange?.(isCollapsed);
  }, [isCollapsed, onCollapsedChange]);

  return (
    <>
      <div
        id="main-sidebar"
        className={cn(
          "relative z-20 h-full shrink-0 bg-canvas",
          !isResizing && "transition-[width] duration-300 ease-in-out",
          isOpen ? "overflow-hidden border-r border-subtle" : "overflow-visible",
          isMobile && isOpen && "absolute",
          className
        )}
        style={{
          width: isOpen ? width : 0,
          minWidth: isOpen ? width : 0,
          maxWidth: isOpen ? width : 0,
        }}
        onMouseEnter={isCollapsed ? openPeek : undefined}
        onMouseLeave={isPeeking ? scheduleClosePeek : undefined}
        role="complementary"
        aria-label="Main sidebar"
        data-prevent-outside-click={isMobile}
      >
        {!isOpen && !isMobile && (
          <div
            className="absolute inset-y-0 left-0 z-10"
            style={{ width: SIDEBAR_HOVER_STRIP_WIDTH }}
            aria-hidden
            onMouseEnter={openPeek}
          />
        )}

        {isOpen && (
          <aside
            className={cn(
              "group/sidebar relative flex h-full w-full flex-col overflow-hidden bg-canvas",
              isAnyExtendedSidebarExpanded && "rounded-none"
            )}
          >
            {children}

            <div
              className={cn(
                "absolute top-0 right-0 z-[20] h-full w-1 cursor-ew-resize transition-all duration-200",
                !isResizing && "hover:bg-surface-2",
                isResizing && "w-1.5 bg-layer-1"
              )}
              onDoubleClick={() => toggleCollapsed()}
              onMouseDown={(e) => startResizing(e)}
              role="separator"
              aria-label="Resize sidebar"
            />
          </aside>
        )}
      </div>

      {extendedSidebar && extendedSidebar}
    </>
  );
}
