export enum EGanttBlockType {
  EPIC = "epic",
  PROJECT = "project",
  ISSUE = "issue",
}
export interface IGanttBlock {
  data: any;
  id: string;
  name: string;
  position?: {
    marginLeft: number;
    width: number;
  };
  sort_order: number | undefined;
  start_date: string | undefined;
  target_date: string | undefined;
  meta?: Record<string, any>;
  /** IDs of blocks that this block is blocking (this block is the predecessor) */
  blocking_ids?: string[];
  /** IDs of blocks that are blocking this block (predecessors of this block) */
  blocked_by_ids?: string[];
}

/**
 * Transient state of an in-progress dependency drag.
 * null when no drag is occurring.
 */
export type TDependencyDragState = {
  sourceBlockId: string;
  /** "right" = this block must finish before target starts (Finish-to-Start) */
  sourceSide: "left" | "right";
  /** cursor position relative to the gantt items container */
  currentX: number;
  currentY: number;
  /** block id under the cursor (if any valid drop target) */
  targetBlockId: string | null;
} | null;

export interface IBlockUpdateData {
  sort_order?: {
    destinationIndex: number;
    newSortOrder: number;
    sourceIndex: number;
  };
  start_date?: string;
  target_date?: string;
  meta?: Record<string, any>;
}

export interface IBlockUpdateDependencyData {
  id: string;
  start_date?: string;
  target_date?: string;
  meta?: Record<string, any>;
}

export type TGanttViews = "week" | "month" | "quarter";

// chart render types
export interface WeekMonthDataType {
  key: number;
  shortTitle: string;
  title: string;
  abbreviation: string;
}

export interface ChartDataType {
  key: string;
  i18n_title: string;
  data: ChartDataTypeData;
}

export interface ChartDataTypeData {
  startDate: Date;
  currentDate: Date;
  endDate: Date;
  approxFilterRange: number;
  dayWidth: number;
}
