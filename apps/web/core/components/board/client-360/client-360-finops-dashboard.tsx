import useSWR from "swr";
import Link from "next/link";
import { AlertTriangle, Building2, ChevronRight, Banknote, Download, Percent, TrendingDown, Users } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import type { TClient360FinopsSummary } from "@operoz/types";
import { cn } from "@operoz/utils";
import { Button } from "@operoz/propel/button";
import {
  Client360BentoGrid,
  Client360BentoMetric,
  Client360BentoTile,
} from "@/components/board/client-360/client-360-bento";
import { Client360ConsultantHeatmap } from "@/components/board/client-360/client-360-consultant-heatmap";
import { CLIENT_360_TONE } from "@/components/board/client-360/client-360-tokens";
import { CLIENT_360_SWR_CONFIG, formatClient360Currency } from "@/components/board/client-360/client-360-utils";
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();

type Props = {
  workspaceSlug: string;
  finopsSummary: TClient360FinopsSummary;
  basePath: string;
  boardIdsKey?: string;
};

function formatVariancePct(value: number): string {
  return `${value > 0 ? "+" : ""}${value}%`;
}

export function Client360FinopsDashboard({ workspaceSlug, finopsSummary, basePath, boardIdsKey }: Props) {
  const { t } = useTranslation();
  const { settings } = finopsSummary;

  const { data: heatmap } = useSWR(
    workspaceSlug ? `CLIENT360_FINOPS_HEATMAP_${workspaceSlug}_${boardIdsKey ?? "all"}` : null,
    () =>
      workspaceService.getClient360FinopsHeatmap(workspaceSlug, {
        board_ids: boardIdsKey || undefined,
      }),
    CLIENT_360_SWR_CONFIG
  );

  const handleExport = async () => {
    await workspaceService.downloadClient360FinopsCsv(workspaceSlug);
  };

  const marginTone =
    finopsSummary.avg_margin_pct != null && finopsSummary.avg_margin_pct < settings.margin_alert_pct
      ? "danger"
      : finopsSummary.avg_margin_pct != null
        ? "success"
        : "neutral";

  const hasVariance = finopsSummary.top_variance.length > 0;
  const hasHeatmap = Boolean(heatmap?.consultants.length && heatmap?.projects.length);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-13 font-semibold text-primary">{t("boards.client_360.finops_dashboard_title")}</p>
          <p className="mt-0.5 text-12 text-tertiary">{t("boards.client_360.finops_dashboard_subtitle")}</p>
        </div>
        <Button variant="secondary" size="sm" className="shrink-0" onClick={() => void handleExport()}>
          <Download className="size-3.5" strokeWidth={1.75} />
          {t("boards.client_360.finops_export_csv")}
        </Button>
      </div>

      <div
        className={cn(
          "shadow-xs overflow-hidden rounded-xl border border-subtle bg-layer-1",
          "grid grid-cols-2 divide-x divide-y divide-subtle sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4"
        )}
      >
        <Client360BentoMetric
          align="center"
          label={t("boards.client_360.finops_total_cost")}
          value={finopsSummary.total_cost_mtd != null ? formatClient360Currency(finopsSummary.total_cost_mtd) : "—"}
          tone="neutral"
          icon={Banknote}
        />
        <Client360BentoMetric
          align="center"
          label={t("boards.client_360.finops_avg_margin")}
          value={finopsSummary.avg_margin_pct != null ? `${finopsSummary.avg_margin_pct}%` : "—"}
          tone={marginTone}
          emphasizeValue={marginTone === "danger"}
          icon={Percent}
        />
        <Client360BentoMetric
          align="center"
          label={t("boards.client_360.finops_alerts")}
          value={finopsSummary.finops_alerts}
          tone={finopsSummary.finops_alerts > 0 ? "danger" : "neutral"}
          emphasizeValue={finopsSummary.finops_alerts > 0}
          icon={AlertTriangle}
        />
        <Client360BentoMetric
          align="center"
          label={t("boards.client_360.finops_clients_with_cost")}
          value={finopsSummary.clients_with_cost}
          tone="neutral"
          icon={Building2}
        />
      </div>

      <Client360BentoGrid>
        {hasVariance ? (
          <Client360BentoTile
            className="md:col-span-12 lg:col-span-5"
            title={t("boards.client_360.finops_top_variance")}
            icon={TrendingDown}
            iconTone="neutral"
            badge={finopsSummary.top_variance.length}
          >
            <ul className="divide-y divide-subtle rounded-lg border border-subtle/80">
              {finopsSummary.top_variance.map((row) => {
                const over = row.variance_pct > 0;
                const tone = over ? CLIENT_360_TONE.danger : CLIENT_360_TONE.success;
                return (
                  <li key={row.project_id}>
                    <Link
                      href={`${basePath}/${row.project_id}`}
                      className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-layer-2/60"
                    >
                      <span className={cn("size-2 shrink-0 rounded-full", tone.dot)} aria-hidden />
                      <span className="min-w-0 flex-1 truncate text-13 font-medium text-primary">{row.name}</span>
                      <span className="shrink-0 text-12 font-semibold text-secondary tabular-nums">
                        {formatVariancePct(row.variance_pct)}
                      </span>
                      <ChevronRight
                        className="size-3.5 shrink-0 text-tertiary opacity-0 transition-opacity group-hover:opacity-100"
                        strokeWidth={1.75}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-11 leading-relaxed text-tertiary">
              {t("boards.client_360.finops_variance_hint", { threshold: settings.variance_alert_pct })}
            </p>
          </Client360BentoTile>
        ) : null}

        <Client360BentoTile
          className={hasVariance ? "md:col-span-12 lg:col-span-7" : "md:col-span-12"}
          title={t("boards.client_360.finops_heatmap_title")}
          icon={Users}
          iconTone="neutral"
        >
          {hasHeatmap && heatmap ? (
            <Client360ConsultantHeatmap data={heatmap} embedded />
          ) : (
            <p className="rounded-lg border border-dashed border-subtle/80 bg-layer-2/20 px-3 py-4 text-12 leading-relaxed text-tertiary">
              {t("boards.client_360.finops_heatmap_empty")}
            </p>
          )}
        </Client360BentoTile>
      </Client360BentoGrid>
    </div>
  );
}
