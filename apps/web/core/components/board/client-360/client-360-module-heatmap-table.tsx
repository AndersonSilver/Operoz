"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, LayoutList } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@operoz/i18n";
import type { TClient360DetailResponse } from "@operoz/types";
import { cn } from "@operoz/utils";
import { Client360BentoTile } from "@/components/board/client-360/client-360-bento";
import { Client360StatusLozenge } from "@/components/board/client-360/client-360-ui";
import {
  CLIENT_360_MODULE_HEATMAP_PAGE_SIZE,
  CLIENT_360_MODULE_HEATMAP_PAGINATE_FROM,
} from "@/components/board/client-360/client-360-utils";

type HeatmapRow = NonNullable<TClient360DetailResponse["operational"]>["module_heatmap"][number];

type Props = {
  heatmap: HeatmapRow[];
  modules: TClient360DetailResponse["modules"];
  statusReportHref: string;
  /** Renders inside another panel — no outer BentoTile. */
  embedded?: boolean;
  /** Shows intake column (Entrega tab). */
  showIntake?: boolean;
};

export function Client360ModuleHeatmapTable({
  heatmap,
  modules,
  statusReportHref,
  embedded = false,
  showIntake = false,
}: Props) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const usePagination = heatmap.length >= CLIENT_360_MODULE_HEATMAP_PAGINATE_FROM;
  const pageSize = CLIENT_360_MODULE_HEATMAP_PAGE_SIZE;
  const totalPages = usePagination ? Math.max(1, Math.ceil(heatmap.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [heatmap.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visibleRows = useMemo(
    () => (usePagination ? heatmap.slice((safePage - 1) * pageSize, safePage * pageSize) : heatmap),
    [heatmap, pageSize, safePage, usePagination]
  );

  const canPrev = safePage > 1;
  const canNext = safePage < totalPages;

  const table = (
    <>
      <div className={embedded ? "overflow-x-auto" : undefined}>
        <table className={cn("w-full text-left text-12", embedded ? "min-w-0" : "min-w-[480px]")}>
          <thead>
            <tr className="tracking-wider border-b border-subtle bg-layer-2/80 text-10 font-semibold text-tertiary uppercase">
              <th className={embedded ? "px-3 py-2" : "px-4 py-2.5"}>{t("boards.client_360.module_column")}</th>
              <th className={embedded ? "px-3 py-2" : "px-4 py-2.5"}>{t("boards.client_360.report_column")}</th>
              <th className={embedded ? "px-3 py-2" : "px-4 py-2.5"}>{t("boards.client_360.col_overdue")}</th>
              {showIntake ? (
                <th className={embedded ? "px-3 py-2" : "px-4 py-2.5"}>{t("boards.client_360.intake_short")}</th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {visibleRows.map((row) => {
              const status =
                row.cells.report === "complete" ? "published" : row.cells.report === "partial" ? "draft" : "missing";
              const label =
                status === "published"
                  ? t("boards.status_report.published")
                  : status === "draft"
                    ? t("boards.status_report.draft")
                    : t("boards.client_360.report_missing");
              const moduleRow = modules.find((m) => m.module_id === row.module_id);

              return (
                <tr key={row.module_id ?? "project"} className="transition-colors hover:bg-layer-transparent-hover">
                  <td
                    className={cn(
                      "font-medium text-primary",
                      embedded ? "max-w-[10rem] truncate px-3 py-2" : "px-4 py-2.5"
                    )}
                    title={row.module_name ?? undefined}
                  >
                    {row.module_name ?? "—"}
                  </td>
                  <td className={embedded ? "px-3 py-2" : "px-4 py-2.5"}>
                    {moduleRow?.report_id ? (
                      <Link
                        href={`${statusReportHref}/${moduleRow.report_id}`}
                        className="inline-flex items-center gap-1.5 hover:underline"
                      >
                        <Client360StatusLozenge status={status} />
                        <span className="text-secondary">{label}</span>
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-secondary">
                        <Client360StatusLozenge status={status} />
                        {label}
                      </span>
                    )}
                  </td>
                  <td className={cn("text-secondary tabular-nums", embedded ? "px-3 py-2" : "px-4 py-2.5")}>
                    {row.cells.overdue}
                  </td>
                  {showIntake ? (
                    <td className={cn("text-secondary tabular-nums", embedded ? "px-3 py-2" : "px-4 py-2.5")}>
                      {row.cells.intake}
                    </td>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {usePagination ? (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 border-t border-subtle bg-layer-2/30",
            embedded ? "px-3 py-2" : "px-4 py-2.5"
          )}
        >
          <p className="text-12 text-tertiary">
            {t("boards.client_360.modules_pagination", {
              from: (safePage - 1) * pageSize + 1,
              to: Math.min(safePage * pageSize, heatmap.length),
              total: heatmap.length,
            })}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex size-8 items-center justify-center rounded-sm border border-subtle text-tertiary enabled:hover:bg-layer-2 disabled:opacity-40"
              aria-label={t("boards.client_360.matrix_page_prev")}
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-16 text-center text-12 text-secondary tabular-nums">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="inline-flex size-8 items-center justify-center rounded-sm border border-subtle text-tertiary enabled:hover:bg-layer-2 disabled:opacity-40"
              aria-label={t("boards.client_360.matrix_page_next")}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );

  if (embedded) return table;

  return (
    <Client360BentoTile
      title={t("boards.client_360.modules_title")}
      icon={LayoutList}
      iconTone="neutral"
      badge={heatmap.length}
      noPadding
      bodyClassName="overflow-x-auto"
    >
      {table}
    </Client360BentoTile>
  );
}
