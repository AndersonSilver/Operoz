/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { GANTT_SIDEBAR_MAX_WIDTH, GANTT_SIDEBAR_MIN_WIDTH, SIDEBAR_WIDTH } from "../constants";
import {
  getSavedGanttSidebarWidth,
  saveGanttSidebarWidth,
} from "../helpers/gantt-sidebar-width-preference";

type TGanttSidebarWidthContext = {
  sidebarWidth: number;
  isResizing: boolean;
  isSidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;
  startResizing: (e: React.MouseEvent) => void;
};

const GanttSidebarWidthContext = createContext<TGanttSidebarWidthContext | null>(null);

type ProviderProps = {
  workspaceSlug: string | undefined;
  scope: string;
  children: ReactNode;
};

export function GanttSidebarWidthProvider(props: ProviderProps) {
  const { workspaceSlug, scope, children } = props;

  const [sidebarWidth, setSidebarWidth] = useState(() =>
    workspaceSlug ? getSavedGanttSidebarWidth(workspaceSlug, scope) : SIDEBAR_WIDTH
  );
  const [isResizing, setIsResizing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const savedWidthRef = useRef(sidebarWidth);
  const initialWidthRef = useRef(sidebarWidth);
  const initialMouseXRef = useRef(0);
  const sidebarWidthRef = useRef(sidebarWidth);
  sidebarWidthRef.current = sidebarWidth;

  useEffect(() => {
    if (!workspaceSlug) return;
    setSidebarWidth(getSavedGanttSidebarWidth(workspaceSlug, scope));
  }, [workspaceSlug, scope]);

  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      if (prev) {
        // Restore saved width
        setSidebarWidth(savedWidthRef.current);
      } else {
        // Save current width before collapsing
        savedWidthRef.current = sidebarWidth;
        setSidebarWidth(0);
      }
      return !prev;
    });
  }, [sidebarWidth]);

  const startResizing = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      initialWidthRef.current = sidebarWidth;
      initialMouseXRef.current = e.clientX;
    },
    [sidebarWidth]
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - initialMouseXRef.current;
      const nextWidth = Math.min(
        Math.max(initialWidthRef.current + deltaX, GANTT_SIDEBAR_MIN_WIDTH),
        GANTT_SIDEBAR_MAX_WIDTH
      );
      setSidebarWidth(nextWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (workspaceSlug) saveGanttSidebarWidth(workspaceSlug, scope, sidebarWidthRef.current);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, scope, workspaceSlug]);

  return (
    <GanttSidebarWidthContext.Provider value={{ sidebarWidth, isResizing, isSidebarCollapsed, toggleSidebarCollapse, startResizing }}>
      {children}
    </GanttSidebarWidthContext.Provider>
  );
}

export const useGanttSidebarWidth = (): TGanttSidebarWidthContext => {
  const context = useContext(GanttSidebarWidthContext);
  if (!context) {
    throw new Error("useGanttSidebarWidth must be used within GanttSidebarWidthProvider");
  }
  return context;
};
