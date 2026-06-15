import type { Client360SortColumn } from "@/components/board/client-360/client-360-client-sort";

const STORAGE_KEY_PREFIX = "client360_table_columns";

export type Client360TableColumnId =
  | "board"
  | "health"
  | "report"
  | "overdue"
  | "support"
  | "intake"
  | "blockers"
  | "throughput"
  | "utilization"
  | "margin"
  | "stakeholder"
  | "responsible";

export type Client360TableColumnConfig = {
  id: Client360TableColumnId;
  visible: boolean;
};

export type Client360TableColumnMeta = {
  id: Client360TableColumnId;
  labelKey: string;
  sortColumn?: Client360SortColumn;
  align?: "left" | "center";
  headerClassName?: string;
  cellClassName?: string;
  minWidthPx: number;
};

export const CLIENT_360_TABLE_COLUMN_META: Record<Client360TableColumnId, Client360TableColumnMeta> = {
  board: {
    id: "board",
    labelKey: "boards.client_360.col_board",
    headerClassName: "hidden px-3 py-2.5 md:table-cell",
    cellClassName: "hidden truncate px-3 py-2.5 text-12 text-secondary md:table-cell",
    minWidthPx: 120,
  },
  health: {
    id: "health",
    labelKey: "boards.client_360.col_health",
    sortColumn: "health",
    headerClassName: "px-3 py-2.5",
    cellClassName: "px-3 py-2.5",
    minWidthPx: 200,
  },
  report: {
    id: "report",
    labelKey: "boards.client_360.col_report",
    sortColumn: "report",
    headerClassName: "px-3 py-2.5",
    cellClassName: "px-3 py-2.5",
    minWidthPx: 140,
  },
  overdue: {
    id: "overdue",
    labelKey: "boards.client_360.col_overdue",
    sortColumn: "overdue",
    align: "center",
    headerClassName: "px-3 py-2.5",
    cellClassName: "px-3 py-2.5 text-center tabular-nums",
    minWidthPx: 96,
  },
  support: {
    id: "support",
    labelKey: "boards.client_360.col_support",
    sortColumn: "support",
    align: "center",
    headerClassName: "px-3 py-2.5",
    cellClassName: "px-3 py-2.5 text-center tabular-nums",
    minWidthPx: 96,
  },
  intake: {
    id: "intake",
    labelKey: "boards.client_360.col_intake",
    sortColumn: "intake",
    align: "center",
    headerClassName: "px-3 py-2.5",
    cellClassName: "px-3 py-2.5 text-center tabular-nums",
    minWidthPx: 88,
  },
  blockers: {
    id: "blockers",
    labelKey: "boards.client_360.col_blockers",
    sortColumn: "blockers",
    align: "center",
    headerClassName: "px-3 py-2.5",
    cellClassName: "px-3 py-2.5 text-center tabular-nums",
    minWidthPx: 96,
  },
  throughput: {
    id: "throughput",
    labelKey: "boards.client_360.col_throughput",
    sortColumn: "throughput",
    align: "center",
    headerClassName: "px-3 py-2.5",
    cellClassName: "px-3 py-2.5 text-center tabular-nums",
    minWidthPx: 104,
  },
  utilization: {
    id: "utilization",
    labelKey: "boards.client_360.col_utilization",
    sortColumn: "utilization",
    align: "center",
    headerClassName: "hidden px-3 py-2.5 lg:table-cell",
    cellClassName: "hidden px-3 py-2.5 text-center tabular-nums lg:table-cell",
    minWidthPx: 96,
  },
  margin: {
    id: "margin",
    labelKey: "boards.client_360.col_margin",
    sortColumn: "margin",
    align: "center",
    headerClassName: "hidden px-3 py-2.5 lg:table-cell",
    cellClassName: "hidden px-3 py-2.5 text-center tabular-nums lg:table-cell",
    minWidthPx: 96,
  },
  stakeholder: {
    id: "stakeholder",
    labelKey: "boards.client_360.col_stakeholder",
    sortColumn: "stakeholder",
    headerClassName: "hidden px-3 py-2.5 lg:table-cell",
    cellClassName: "hidden truncate px-3 py-2.5 text-12 text-secondary lg:table-cell",
    minWidthPx: 130,
  },
  responsible: {
    id: "responsible",
    labelKey: "boards.client_360.col_responsible",
    sortColumn: "responsible",
    headerClassName: "hidden px-3 py-2.5 lg:table-cell",
    cellClassName: "hidden truncate px-3 py-2.5 text-12 text-secondary lg:table-cell",
    minWidthPx: 130,
  },
};

const ALL_COLUMN_IDS: Client360TableColumnId[] = [
  "board",
  "health",
  "report",
  "overdue",
  "support",
  "intake",
  "blockers",
  "throughput",
  "utilization",
  "margin",
  "stakeholder",
  "responsible",
];

export function defaultClient360TableColumns(includeBoard: boolean): Client360TableColumnConfig[] {
  return ALL_COLUMN_IDS.filter((id) => includeBoard || id !== "board").map((id) => ({
    id,
    visible: true,
  }));
}

export function normalizeClient360TableColumns(
  columns: Client360TableColumnConfig[],
  includeBoard: boolean
): Client360TableColumnConfig[] {
  const allowed = new Set(ALL_COLUMN_IDS.filter((id) => includeBoard || id !== "board"));
  const seen = new Set<Client360TableColumnId>();
  const normalized: Client360TableColumnConfig[] = [];

  for (const column of columns) {
    if (!allowed.has(column.id) || seen.has(column.id)) continue;
    normalized.push({ id: column.id, visible: column.visible });
    seen.add(column.id);
  }

  for (const id of ALL_COLUMN_IDS) {
    if (!allowed.has(id) || seen.has(id)) continue;
    normalized.push({ id, visible: true });
  }

  const visibleCount = normalized.filter((column) => column.visible).length;
  if (visibleCount === 0 && normalized.length > 0) {
    normalized[0] = { ...normalized[0], visible: true };
  }

  return normalized;
}

export function loadClient360TableColumns(scope: string, includeBoard: boolean): Client360TableColumnConfig[] {
  if (typeof window === "undefined") {
    return defaultClient360TableColumns(includeBoard);
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}_${scope}`);
    if (!raw) return defaultClient360TableColumns(includeBoard);
    const parsed = JSON.parse(raw) as Client360TableColumnConfig[];
    if (!Array.isArray(parsed)) return defaultClient360TableColumns(includeBoard);
    return normalizeClient360TableColumns(parsed, includeBoard);
  } catch {
    return defaultClient360TableColumns(includeBoard);
  }
}

export function saveClient360TableColumns(scope: string, columns: Client360TableColumnConfig[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}_${scope}`, JSON.stringify(columns));
  } catch {
    /* ignore */
  }
}

export function client360TableColumnsEqual(a: Client360TableColumnConfig[], b: Client360TableColumnConfig[]): boolean {
  return (
    a.length === b.length &&
    a.every((column, index) => column.id === b[index]?.id && column.visible === b[index]?.visible)
  );
}

export function isDefaultClient360TableColumns(columns: Client360TableColumnConfig[], includeBoard: boolean): boolean {
  return client360TableColumnsEqual(columns, defaultClient360TableColumns(includeBoard));
}

export function toggleClient360TableColumn(
  columns: Client360TableColumnConfig[],
  columnId: Client360TableColumnId
): Client360TableColumnConfig[] {
  const visibleCount = columns.filter((column) => column.visible).length;
  return columns.map((column) => {
    if (column.id !== columnId) return column;
    if (column.visible && visibleCount <= 1) return column;
    return { ...column, visible: !column.visible };
  });
}

export function moveClient360TableColumn(
  columns: Client360TableColumnConfig[],
  columnId: Client360TableColumnId,
  direction: "up" | "down"
): Client360TableColumnConfig[] {
  const index = columns.findIndex((column) => column.id === columnId);
  if (index < 0) return columns;
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= columns.length) return columns;

  const next = [...columns];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next;
}

export function visibleClient360TableColumns(columns: Client360TableColumnConfig[]) {
  return columns.filter((column) => column.visible);
}

export function client360TableMinWidth(columns: Client360TableColumnConfig[]): number {
  const visible = visibleClient360TableColumns(columns);
  const dataWidth = visible.reduce((sum, column) => sum + CLIENT_360_TABLE_COLUMN_META[column.id].minWidthPx, 0);
  return Math.max(640, 280 + dataWidth);
}

export function client360TableColumnLabelKey(columnId: Client360TableColumnId): string {
  return CLIENT_360_TABLE_COLUMN_META[columnId].labelKey;
}
