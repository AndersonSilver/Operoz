import { createContext, useContext } from "react";
import type { TTimelineType } from "@operoz/types";

export const TimeLineTypeContext = createContext<TTimelineType | undefined>(undefined);

export const useTimeLineType = () => {
  const timelineType = useContext(TimeLineTypeContext);
  return timelineType;
};

export { GanttSidebarWidthProvider, useGanttSidebarWidth } from "./gantt-sidebar-width";
export { GanttDependencyContext, useGanttDependency } from "./gantt-dependency";
export type { OnCreateDependencyFn, OnDeleteDependencyFn } from "./gantt-dependency";
