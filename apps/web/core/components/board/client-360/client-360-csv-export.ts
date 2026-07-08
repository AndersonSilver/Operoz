import type { useTranslation } from "@operoz/i18n";
import type { TClient360Client, TClient360Health } from "@operoz/types";
import {
  CLIENT_360_TABLE_COLUMN_META,
  defaultClient360TableColumns,
  visibleClient360TableColumns,
  type Client360TableColumnConfig,
  type Client360TableColumnId,
} from "@/components/board/client-360/client-360-table-columns";
import { reportCoverageLabelKey } from "@/components/board/client-360/client-360-utils";

export const CLIENT_360_CSV_EXPORT_MAX_ROWS = 5000;

export type Client360CsvExportMode = "visible" | "all";

type TFn = ReturnType<typeof useTranslation>["t"];

type BaseExportColumnId = "name" | "identifier";
type ExportColumnId = BaseExportColumnId | Client360TableColumnId;

const BASE_EXPORT_COLUMNS: BaseExportColumnId[] = ["name", "identifier"];

export type Client360CsvExportInput = {
  workspaceSlug: string;
  periodStart: string;
  periodEnd: string;
  clients: TClient360Client[];
  tableColumns: Client360TableColumnConfig[];
  includeBoard: boolean;
  mode: Client360CsvExportMode;
  t: TFn;
  showPeriodCompare?: boolean;
};

const DELTA_COLUMNS = ["delta_overdue", "delta_health_score", "delta_report_coverage", "delta_support_open"] as const;

export type Client360CsvExportResult = {
  truncated: boolean;
  exportedCount: number;
  totalCount: number;
};

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatCsvRow(cells: string[]): string {
  return cells.map(escapeCsvCell).join(",");
}

function healthLabel(health: TClient360Health, t: TFn): string {
  switch (health) {
    case "critical":
      return t("boards.client_360.health_critical");
    case "warning":
      return t("boards.client_360.health_warning");
    default:
      return t("boards.client_360.health_ok");
  }
}

function resolveExportColumns(
  tableColumns: Client360TableColumnConfig[],
  includeBoard: boolean,
  mode: Client360CsvExportMode
): Client360TableColumnId[] {
  const source =
    mode === "all" ? defaultClient360TableColumns(includeBoard) : visibleClient360TableColumns(tableColumns);

  return source.map((column) => column.id);
}

function exportColumnHeader(columnId: ExportColumnId, t: TFn): string {
  if (columnId === "name") return t("boards.client_360.col_client");
  if (columnId === "identifier") return t("boards.client_360.export_col_identifier");
  return t(CLIENT_360_TABLE_COLUMN_META[columnId].labelKey);
}

function exportColumnValue(columnId: ExportColumnId, client: TClient360Client, t: TFn): string {
  switch (columnId) {
    case "name":
      return client.name;
    case "identifier":
      return client.identifier;
    case "board":
      return client.board?.name ?? "";
    case "health":
      return healthLabel(client.health, t);
    case "report": {
      const label = t(reportCoverageLabelKey(client.status_report.coverage));
      const { modules_total, modules_published } = client.status_report;
      if (modules_total > 0) return `${label} (${modules_published}/${modules_total})`;
      return label;
    }
    case "overdue":
      return client.issues.overdue > 0 ? String(client.issues.overdue) : "";
    case "support":
      return client.support.open_count > 0 ? String(client.support.open_count) : "";
    case "intake":
      return (client.intake?.pending ?? 0) > 0 ? String(client.intake?.pending) : "";
    case "blockers":
      return (client.blockers?.count ?? 0) > 0 ? String(client.blockers?.count) : "";
    case "throughput":
      return (client.delivery?.throughput ?? 0) > 0 ? String(client.delivery?.throughput) : "";
    case "stakeholder":
      return client.responsible_stakeholder;
    case "responsible":
      return client.project_lead?.display_name ?? "";
    default:
      return "";
  }
}

function exportDeltaValue(client: TClient360Client, columnId: (typeof DELTA_COLUMNS)[number]): string {
  const compare = client.period_compare;
  if (!compare?.available) return "";
  switch (columnId) {
    case "delta_overdue":
      return compare.overdue_delta != null ? String(compare.overdue_delta) : "";
    case "delta_health_score":
      return compare.health_score_delta != null ? String(compare.health_score_delta) : "";
    case "delta_report_coverage":
      return compare.report_coverage_delta != null ? String(compare.report_coverage_delta) : "";
    case "delta_support_open":
      return compare.support_open_delta != null ? String(compare.support_open_delta) : "";
    default:
      return "";
  }
}

function exportDeltaHeader(columnId: (typeof DELTA_COLUMNS)[number], t: TFn): string {
  switch (columnId) {
    case "delta_overdue":
      return t("boards.client_360.export_delta_overdue");
    case "delta_health_score":
      return t("boards.client_360.export_delta_health_score");
    case "delta_report_coverage":
      return t("boards.client_360.export_delta_report_coverage");
    case "delta_support_open":
      return t("boards.client_360.export_delta_support");
  }
}

export function buildClient360CsvContent(input: Client360CsvExportInput): {
  content: string;
  result: Client360CsvExportResult;
} {
  const { workspaceSlug, periodStart, periodEnd, clients, tableColumns, includeBoard, mode, t, showPeriodCompare } =
    input;
  const totalCount = clients.length;
  const exportClients = clients.slice(0, CLIENT_360_CSV_EXPORT_MAX_ROWS);
  const truncated = totalCount > CLIENT_360_CSV_EXPORT_MAX_ROWS;
  const dynamicColumns = resolveExportColumns(tableColumns, includeBoard, mode);
  const columns: ExportColumnId[] = [...BASE_EXPORT_COLUMNS, ...dynamicColumns];
  const deltaColumns = showPeriodCompare ? [...DELTA_COLUMNS] : [];

  const lines: string[] = [
    `# Operoz Visão 360`,
    `# workspace: ${workspaceSlug}`,
    `# period_start: ${periodStart}`,
    `# period_end: ${periodEnd}`,
    `# exported_at: ${new Date().toISOString()}`,
    `# rows: ${exportClients.length}${truncated ? ` (truncated from ${totalCount})` : ""}`,
  ];

  if (truncated) {
    lines.push(
      `# warning: ${t("boards.client_360.export_csv_truncated_comment", { max: CLIENT_360_CSV_EXPORT_MAX_ROWS, total: totalCount })}`
    );
  }

  lines.push(
    formatCsvRow([
      ...columns.map((columnId) => exportColumnHeader(columnId, t)),
      ...deltaColumns.map((columnId) => exportDeltaHeader(columnId, t)),
    ])
  );

  for (const client of exportClients) {
    lines.push(
      formatCsvRow([
        ...columns.map((columnId) => exportColumnValue(columnId, client, t)),
        ...deltaColumns.map((columnId) => exportDeltaValue(client, columnId)),
      ])
    );
  }

  return {
    content: lines.join("\n"),
    result: {
      truncated,
      exportedCount: exportClients.length,
      totalCount,
    },
  };
}

export function client360CsvFilename(workspaceSlug: string, exportedAt = new Date()): string {
  const date = exportedAt.toISOString().slice(0, 10);
  const safeSlug = workspaceSlug.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "workspace";
  return `${safeSlug}-visao-360-${date}`;
}

export function downloadClient360Csv(input: Client360CsvExportInput): Client360CsvExportResult {
  const { content, result } = buildClient360CsvContent(input);
  const filename = client360CsvFilename(input.workspaceSlug);
  const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return result;
}
