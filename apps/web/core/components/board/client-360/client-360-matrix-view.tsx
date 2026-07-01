import { useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import type { TClient360MatrixCell, TClient360MatrixClient, TClient360ReportCoverage } from "@operoz/types";
import { Tooltip } from "@operoz/propel/tooltip";
import { cn } from "@operoz/utils";
import { reportCoverageHeatmapClass, reportCoverageLabelKey } from "@/components/board/client-360/client-360-utils";

const MATRIX_WEEKS = 8;

type Props = {
  clients: TClient360MatrixClient[];
  weeks: Array<{ period_start: string; period_end: string }>;
  basePath: string;
  showBoardColumn?: boolean;
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  onExportCsv?: () => void;
  exportingCsv?: boolean;
};

function formatWeekLabel(periodStart: string): string {
  const date = new Date(`${periodStart}T12:00:00`);
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

function MatrixCellTooltip({
  cell,
  clientName,
  t,
}: {
  cell: TClient360MatrixCell;
  clientName: string;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const coverageLabel = t(reportCoverageLabelKey(cell.coverage));

  return (
    <div className="max-w-xs space-y-1.5 text-left">
      <p className="text-12 font-medium text-primary">{clientName}</p>
      <p className="text-11 text-secondary">{coverageLabel}</p>
      {cell.modules_total > 0 ? (
        <p className="font-mono text-11 text-tertiary">
          {cell.modules_published}/{cell.modules_total} {t("boards.client_360.matrix_modules_published")}
        </p>
      ) : null}
      {cell.coverage === "partial" && cell.module_breakdown?.length ? (
        <ul className="mt-1 space-y-0.5 border-t border-subtle pt-1.5">
          {cell.module_breakdown.map((module) => (
            <li key={module.module_id} className="flex items-center justify-between gap-2 text-11">
              <span className="truncate text-secondary">{module.module_name}</span>
              <span className="shrink-0 text-tertiary">{t(`boards.client_360.matrix_module_${module.status}`)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function MatrixLegendItem({ coverage, label }: { coverage: TClient360ReportCoverage; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-11 text-secondary">
      <span className={cn("size-3 rounded-xs border", reportCoverageHeatmapClass(coverage))} aria-hidden />
      {label}
    </span>
  );
}

export function Client360MatrixView({
  clients,
  weeks,
  basePath,
  showBoardColumn = false,
  pagination,
  onPageChange,
  isLoading = false,
  onExportCsv,
  exportingCsv = false,
}: Props) {
  const { t } = useTranslation();

  const legendItems = useMemo(
    () =>
      (
        [
          ["complete", "boards.client_360.report_complete"],
          ["partial", "boards.client_360.report_partial"],
          ["missing", "boards.client_360.report_missing"],
          ["n_a", "boards.client_360.report_na"],
        ] as const
      ).map(([coverage, key]) => ({ coverage, label: t(key) })),
    [t]
  );

  const canPrev = pagination.page > 1;
  const canNext = pagination.page < pagination.total_pages;

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-subtle px-4 py-2">
        <span className="text-11 font-medium tracking-wide text-tertiary uppercase">
          {t("boards.client_360.matrix_legend")}
        </span>
        {legendItems.map((item) => (
          <MatrixLegendItem key={item.coverage} coverage={item.coverage} label={item.label} />
        ))}
        <span className="ml-auto text-11 text-tertiary">
          {t("boards.client_360.matrix_weeks_count", { count: weeks.length || MATRIX_WEEKS })}
        </span>
        {onExportCsv ? (
          <Button variant="secondary" size="sm" loading={exportingCsv} onClick={onExportCsv}>
            <Download className="size-3.5" />
            {t("boards.client_360.matrix_export_csv")}
          </Button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-13">
          <thead>
            <tr className="border-b border-subtle bg-layer-2">
              <th className="sticky left-0 z-20 min-w-[180px] bg-layer-2 px-3 py-2 text-left text-11 font-medium tracking-wide text-tertiary uppercase">
                {t("boards.client_360.col_client")}
              </th>
              {showBoardColumn ? (
                <th className="sticky left-[180px] z-20 min-w-[120px] bg-layer-2 px-3 py-2 text-left text-11 font-medium tracking-wide text-tertiary uppercase">
                  {t("boards.client_360.col_board")}
                </th>
              ) : null}
              {weeks.map((week) => (
                <th
                  key={week.period_start}
                  className="min-w-[52px] px-1 py-2 text-center text-11 font-medium text-tertiary"
                  title={`${week.period_start} — ${week.period_end}`}
                >
                  {formatWeekLabel(week.period_start)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && clients.length === 0 ? (
              <tr>
                <td
                  colSpan={weeks.length + 1 + (showBoardColumn ? 1 : 0)}
                  className="px-4 py-8 text-center text-13 text-tertiary"
                >
                  {t("boards.client_360.loading")}
                </td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td
                  colSpan={weeks.length + 1 + (showBoardColumn ? 1 : 0)}
                  className="px-4 py-8 text-center text-13 text-tertiary"
                >
                  {t("boards.client_360.empty")}
                </td>
              </tr>
            ) : (
              clients.map((client) => (
                <tr key={client.project_id} className="border-b border-subtle/80 hover:bg-layer-2/50">
                  <td className="sticky left-0 z-10 bg-layer-1 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-primary">{client.name}</p>
                      <p className="font-mono truncate text-11 text-tertiary">{client.identifier}</p>
                    </div>
                  </td>
                  {showBoardColumn ? (
                    <td className="sticky left-[180px] z-10 bg-layer-1 px-3 py-2 text-12 text-secondary">
                      {client.board?.name ?? "—"}
                    </td>
                  ) : null}
                  {client.cells.map((cell) => (
                    <td key={cell.period_start} className="px-1 py-2 text-center">
                      <Tooltip tooltipContent={<MatrixCellTooltip cell={cell} clientName={client.name} t={t} />}>
                        <Link
                          href={`${basePath}/${client.project_id}?period_start=${cell.period_start}&period_end=${cell.period_end}`}
                          className={cn(
                            "focus-visible:ring-accent-primary mx-auto block size-8 rounded-sm border transition-colors focus-visible:ring-2 focus-visible:outline-none",
                            reportCoverageHeatmapClass(cell.coverage)
                          )}
                          aria-label={`${client.name} — ${t(reportCoverageLabelKey(cell.coverage))}`}
                        />
                      </Tooltip>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination.total > pagination.page_size ? (
        <div className="flex items-center justify-between gap-3 border-t border-subtle px-4 py-2">
          <p className="text-12 text-tertiary">
            {t("boards.client_360.matrix_pagination", {
              from: (pagination.page - 1) * pagination.page_size + 1,
              to: Math.min(pagination.page * pagination.page_size, pagination.total),
              total: pagination.total,
            })}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => onPageChange(pagination.page - 1)}
              className="inline-flex size-8 items-center justify-center rounded-sm border border-subtle text-tertiary enabled:hover:bg-layer-2 disabled:opacity-40"
              aria-label={t("boards.client_360.matrix_page_prev")}
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-[4rem] text-center text-12 text-secondary">
              {pagination.page} / {pagination.total_pages}
            </span>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => onPageChange(pagination.page + 1)}
              className="inline-flex size-8 items-center justify-center rounded-sm border border-subtle text-tertiary enabled:hover:bg-layer-2 disabled:opacity-40"
              aria-label={t("boards.client_360.matrix_page_next")}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
