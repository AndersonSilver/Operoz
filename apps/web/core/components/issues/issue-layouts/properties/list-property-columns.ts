import { SPREADSHEET_PROPERTY_DETAILS } from "@operoz/constants";
import type { IIssueDisplayProperties } from "@operoz/types";

export type TListPropertyColumn =
  | "state"
  | "priority"
  | "dates"
  | "assignee"
  | "modules"
  | "cycle"
  | "estimate"
  | "sub_issue_count"
  | "attachment_count"
  | "link"
  | "labels";

export type TListPropertyColumnAlign = "start" | "center" | "end";

export type TListGridTitleColumn = "title";

export type TListGridResizableColumn = TListPropertyColumn | TListGridTitleColumn;

type TListPropertyColumnMeta = {
  width: string;
  defaultWidthPx: number;
  minWidthPx: number;
  maxWidthPx: number;
  align: TListPropertyColumnAlign;
  titleKey: string;
};

const LIST_PROPERTY_COLUMN_META: Record<TListPropertyColumn, TListPropertyColumnMeta> = {
  state: {
    width: "9rem",
    defaultWidthPx: 144,
    minWidthPx: 88,
    maxWidthPx: 280,
    align: "start",
    titleKey: SPREADSHEET_PROPERTY_DETAILS.state!.i18n_title,
  },
  priority: {
    width: "2.75rem",
    defaultWidthPx: 44,
    minWidthPx: 40,
    maxWidthPx: 80,
    align: "center",
    titleKey: SPREADSHEET_PROPERTY_DETAILS.priority!.i18n_title,
  },
  dates: {
    width: "12rem",
    defaultWidthPx: 192,
    minWidthPx: 120,
    maxWidthPx: 320,
    align: "start",
    titleKey: SPREADSHEET_PROPERTY_DETAILS.start_date!.i18n_title,
  },
  assignee: {
    width: "5rem",
    defaultWidthPx: 80,
    minWidthPx: 64,
    maxWidthPx: 160,
    align: "center",
    titleKey: SPREADSHEET_PROPERTY_DETAILS.assignee!.i18n_title,
  },
  modules: {
    width: "9.5rem",
    defaultWidthPx: 152,
    minWidthPx: 96,
    maxWidthPx: 320,
    align: "start",
    titleKey: SPREADSHEET_PROPERTY_DETAILS.modules!.i18n_title,
  },
  cycle: {
    width: "9.5rem",
    defaultWidthPx: 152,
    minWidthPx: 96,
    maxWidthPx: 320,
    align: "start",
    titleKey: SPREADSHEET_PROPERTY_DETAILS.cycle!.i18n_title,
  },
  estimate: {
    width: "4.75rem",
    defaultWidthPx: 76,
    minWidthPx: 56,
    maxWidthPx: 120,
    align: "center",
    titleKey: SPREADSHEET_PROPERTY_DETAILS.estimate!.i18n_title,
  },
  sub_issue_count: {
    width: "3.25rem",
    defaultWidthPx: 52,
    minWidthPx: 48,
    maxWidthPx: 96,
    align: "center",
    titleKey: SPREADSHEET_PROPERTY_DETAILS.sub_issue_count!.i18n_title,
  },
  attachment_count: {
    width: "3.25rem",
    defaultWidthPx: 52,
    minWidthPx: 48,
    maxWidthPx: 96,
    align: "center",
    titleKey: SPREADSHEET_PROPERTY_DETAILS.attachment_count!.i18n_title,
  },
  link: {
    width: "3.25rem",
    defaultWidthPx: 52,
    minWidthPx: 48,
    maxWidthPx: 96,
    align: "center",
    titleKey: SPREADSHEET_PROPERTY_DETAILS.link!.i18n_title,
  },
  labels: {
    width: "minmax(8rem, 11.5rem)",
    defaultWidthPx: 184,
    minWidthPx: 128,
    maxWidthPx: 360,
    align: "start",
    titleKey: SPREADSHEET_PROPERTY_DETAILS.labels!.i18n_title,
  },
};

export const LIST_GRID_TITLE_COLUMN_META = {
  defaultWidthPx: 320,
  minWidthPx: 200,
  maxWidthPx: 640,
} as const;

export const LIST_GRID_ACTIONS_COLUMN_WIDTH_PX = 32;

export type TListPropertyColumnsContext = {
  displayProperties: IIssueDisplayProperties;
  isEpic: boolean;
  showModules: boolean;
  showCycles: boolean;
  showEstimate: boolean;
  /** Lista agregada do board: colunas fixas por displayProperties (sem variar por projeto). */
  crossProject?: boolean;
};

export function buildListPropertyColumns(ctx: TListPropertyColumnsContext): TListPropertyColumn[] {
  const { displayProperties, isEpic, showModules, showCycles, showEstimate, crossProject } = ctx;
  const columns: TListPropertyColumn[] = [];

  const includeModules = crossProject
    ? Boolean(displayProperties.modules)
    : Boolean(showModules && displayProperties.modules);
  const includeCycles = crossProject
    ? Boolean(displayProperties.cycle)
    : Boolean(showCycles && displayProperties.cycle);
  const includeEstimate = crossProject
    ? Boolean(displayProperties.estimate)
    : Boolean(showEstimate && displayProperties.estimate);

  if (displayProperties.state) columns.push("state");
  if (displayProperties.priority) columns.push("priority");
  if (displayProperties.start_date || displayProperties.due_date) columns.push("dates");
  if (displayProperties.assignee) columns.push("assignee");
  if (!isEpic && includeModules) columns.push("modules");
  if (!isEpic && includeCycles) columns.push("cycle");
  if (includeEstimate) columns.push("estimate");
  if (!isEpic && displayProperties.sub_issue_count) columns.push("sub_issue_count");
  if (displayProperties.attachment_count) columns.push("attachment_count");
  if (displayProperties.link) columns.push("link");
  if (displayProperties.labels) columns.push("labels");

  return columns;
}

export function getDefaultListColumnWidthPx(column: TListPropertyColumn): number {
  return LIST_PROPERTY_COLUMN_META[column].defaultWidthPx;
}

export function clampListColumnWidthPx(column: TListGridResizableColumn, widthPx: number): number {
  if (column === "title") {
    return Math.min(LIST_GRID_TITLE_COLUMN_META.maxWidthPx, Math.max(LIST_GRID_TITLE_COLUMN_META.minWidthPx, widthPx));
  }

  const meta = LIST_PROPERTY_COLUMN_META[column];
  return Math.min(meta.maxWidthPx, Math.max(meta.minWidthPx, widthPx));
}

export function buildListPropertyGridTemplateColumns(
  columns: TListPropertyColumn[],
  columnWidthsPx?: Partial<Record<TListPropertyColumn, number>>,
  options?: { expandToFill?: boolean }
): string {
  return columns
    .map((column) => {
      const width = columnWidthsPx?.[column] ?? getDefaultListColumnWidthPx(column);
      if (!options?.expandToFill) return `${width}px`;
      return `minmax(${width}px, 1fr)`;
    })
    .join(" ");
}

/** Grelha externa: título | painel de propriedades | ações */
export function buildListLayoutGridTemplateColumns(titleWidthPx: number, propertiesPanelWidthPx: number): string {
  const title = `minmax(${titleWidthPx}px, 1fr)`;
  const actions = `${LIST_GRID_ACTIONS_COLUMN_WIDTH_PX}px`;

  if (propertiesPanelWidthPx <= 0) {
    return `${title} ${actions}`;
  }

  return `${title} minmax(${propertiesPanelWidthPx}px, 2fr) ${actions}`;
}

export function computeListPropertiesPanelWidthPx(
  columns: TListPropertyColumn[],
  columnWidthsPx?: Partial<Record<TListPropertyColumn, number>>
): number {
  if (!columns.length) return 0;

  const columnsWidth = columns.reduce(
    (sum, column) => sum + (columnWidthsPx?.[column] ?? getDefaultListColumnWidthPx(column)),
    0
  );

  return columnsWidth + 12 * Math.max(0, columns.length - 1);
}

export function buildListGridTemplateColumns(
  columns: TListPropertyColumn[],
  options?: {
    titleWidthPx?: number;
    columnWidthsPx?: Partial<Record<TListPropertyColumn, number>>;
  }
): string {
  const titleMin = options?.titleWidthPx ?? LIST_GRID_TITLE_COLUMN_META.defaultWidthPx;
  const propertyColumns = buildListPropertyGridTemplateColumns(columns, options?.columnWidthsPx);

  if (!propertyColumns) {
    return `minmax(${titleMin}px, 1fr) ${LIST_GRID_ACTIONS_COLUMN_WIDTH_PX}px`;
  }

  return `minmax(${titleMin}px, 1fr) ${propertyColumns} ${LIST_GRID_ACTIONS_COLUMN_WIDTH_PX}px`;
}

export function getListPropertyColumnMeta(column: TListPropertyColumn): TListPropertyColumnMeta {
  return LIST_PROPERTY_COLUMN_META[column];
}

export function getListPropertyColumnTitleKey(column: TListPropertyColumn): string {
  return LIST_PROPERTY_COLUMN_META[column].titleKey;
}

export function getDefaultListGridColumnWidths(columns: TListPropertyColumn[]): Record<TListPropertyColumn, number> {
  return Object.fromEntries(columns.map((column) => [column, getDefaultListColumnWidthPx(column)])) as Record<
    TListPropertyColumn,
    number
  >;
}
