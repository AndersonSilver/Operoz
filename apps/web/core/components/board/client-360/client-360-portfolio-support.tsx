"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Headphones,
  LifeBuoy,
  ShieldAlert,
  Users,
} from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { TClient360Client, TClient360Summary, TClient360SupportAnalytics } from "@operoz/types";
import { cn } from "@operoz/utils";
import {
  Client360BentoGrid,
  Client360BentoMetric,
  Client360BentoTile,
} from "@/components/board/client-360/client-360-bento";
import type { Client360FilterKey } from "@/components/board/client-360/client-360-client-filters";
import { CLIENT_360_FILTER_OPTIONS } from "@/components/board/client-360/client-360-client-filters";
import {
  buildSupportAnalyticsRows,
  computeSupportPortfolioStats,
  formatSupportMetricDuration,
  hasSupportAnalyticsData,
} from "@/components/board/client-360/client-360-portfolio-support.utils";
import { Client360StackedDistribution } from "@/components/board/client-360/client-360-ui";
import { CLIENT_360_TONE } from "@/components/board/client-360/client-360-tokens";
import { BoardHubNavLink } from "@/components/board/board-hub-nav-link";
import { BoardService } from "@/services/board/board.service";
import { WorkspaceService } from "@/services/workspace.service";

const boardService = new BoardService();
const workspaceService = new WorkspaceService();

type ExportScope =
  | { kind: "board"; workspaceSlug: string; boardSlug: string }
  | { kind: "workspace"; workspaceSlug: string };

type Props = {
  workspaceSlug: string;
  summary: TClient360Summary;
  clients: TClient360Client[];
  supportAnalytics?: TClient360SupportAnalytics | null;
  periodStart?: string;
  periodEnd?: string;
  exportScope?: ExportScope;
  onFilterChange?: (filter: Client360FilterKey) => void;
  showBoard?: boolean;
};

function SupportQuickFilters({
  stats,
  onFilterChange,
}: {
  stats: ReturnType<typeof computeSupportPortfolioStats>;
  onFilterChange: (filter: Client360FilterKey) => void;
}) {
  const { t } = useTranslation();
  const keys: Client360FilterKey[] = [];
  if (stats.clientsWithOpen > 0) keys.push("support_open");
  if (stats.clientsWithSlaBreach > 0) keys.push("sla_breach");

  if (keys.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      {keys.map((filterKey) => {
        const option = CLIENT_360_FILTER_OPTIONS.find((o) => o.key === filterKey);
        if (!option) return null;
        return (
          <button
            key={filterKey}
            type="button"
            onClick={() => onFilterChange(filterKey)}
            className="rounded-md border border-subtle bg-layer-2 px-2 py-1 text-11 font-medium text-secondary transition-colors hover:border-strong hover:text-primary"
          >
            {t(option.labelKey)}
          </button>
        );
      })}
    </div>
  );
}

function SupportClientRow({
  client,
  workspaceSlug,
  showBoard,
  meta,
  tone = "neutral",
}: {
  client: TClient360Client;
  workspaceSlug: string;
  showBoard?: boolean;
  meta: string;
  tone?: "neutral" | "danger" | "warning" | "info";
}) {
  const toneStyle = CLIENT_360_TONE[tone];

  return (
    <BoardHubNavLink
      to={`/${workspaceSlug}/projects/${client.project_id}/sustentacao/`}
      className="group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-layer-2"
    >
      <span className={cn("size-2 shrink-0 rounded-full", toneStyle.dot)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-13 font-medium text-primary">{client.name}</p>
        <p className="mt-0.5 truncate text-12 text-tertiary">
          {showBoard && client.board?.name ? `${client.board.name} · ` : null}
          {meta}
        </p>
      </div>
      <ChevronRight
        className="size-3.5 shrink-0 text-tertiary opacity-60 transition-opacity group-hover:opacity-100"
        strokeWidth={1.75}
      />
    </BoardHubNavLink>
  );
}

export function Client360PortfolioSupport({
  workspaceSlug,
  clients,
  supportAnalytics,
  periodStart,
  periodEnd,
  exportScope,
  onFilterChange,
  showBoard,
}: Props) {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  const stats = useMemo(() => computeSupportPortfolioStats(clients), [clients]);
  const analyticsRows = useMemo(
    () => buildSupportAnalyticsRows(supportAnalytics ?? undefined, clients),
    [clients, supportAnalytics]
  );
  const showAnalytics = hasSupportAnalyticsData(supportAnalytics);

  const handleExportCsv = useCallback(async () => {
    if (!exportScope || !periodStart || !periodEnd) return;
    setExporting(true);
    try {
      const query = {
        period_start: periodStart,
        period_end: periodEnd,
        export: "support_csv" as const,
        delimiter: "semicolon" as const,
      };
      const result =
        exportScope.kind === "board"
          ? await boardService.downloadSupportAnalyticsCsv(exportScope.workspaceSlug, exportScope.boardSlug, query)
          : await workspaceService.downloadSupportAnalyticsCsv(exportScope.workspaceSlug, query);

      const disposition = result.headers["content-disposition"];
      const fallback = `sustentacao-analytics-${periodEnd}.csv`;
      const filename = disposition?.match(/filename="?([^";]+)"?/)?.[1] ?? fallback;
      const url = URL.createObjectURL(result.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.client_360.support_analytics_export_success_title"),
        message: t("boards.client_360.support_analytics_export_success_message"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("boards.client_360.support_analytics_export_error_title"),
        message: t("boards.client_360.support_analytics_export_error_message"),
      });
    } finally {
      setExporting(false);
    }
  }, [exportScope, periodEnd, periodStart, t]);

  const topOpen = useMemo(
    () =>
      [...clients]
        .filter((c) => c.support.open_count > 0)
        .sort(
          (a, b) => b.support.open_count - a.support.open_count || b.support.overdue_count - a.support.overdue_count
        )
        .slice(0, 8),
    [clients]
  );

  const slaClients = useMemo(
    () =>
      [...clients]
        .filter((c) => c.support_sla?.breached)
        .sort((a, b) => (b.support_sla?.breach_count ?? 0) - (a.support_sla?.breach_count ?? 0))
        .slice(0, 8),
    [clients]
  );

  const ranking = useMemo(
    () =>
      [...clients]
        .filter((c) => c.support.open_count > 0 || c.support_sla?.breached)
        .sort(
          (a, b) =>
            (b.support_sla?.breached ? 1 : 0) - (a.support_sla?.breached ? 1 : 0) ||
            b.support.open_count - a.support.open_count ||
            b.support.overdue_count - a.support.overdue_count
        ),
    [clients]
  );

  const total = clients.length;
  const allClear = stats.totalOpen === 0 && stats.clientsWithSlaBreach === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-13 font-semibold text-primary">{t("boards.client_360.support_dashboard_title")}</p>
          <p className="mt-0.5 text-12 text-tertiary">{t("boards.client_360.support_dashboard_subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {exportScope && periodStart && periodEnd && showAnalytics ? (
            <Button variant="secondary" size="sm" loading={exporting} onClick={() => void handleExportCsv()}>
              <Download className="size-3.5" />
              {t("boards.client_360.support_analytics_export")}
            </Button>
          ) : null}
          {onFilterChange ? <SupportQuickFilters stats={stats} onFilterChange={onFilterChange} /> : null}
        </div>
      </div>

      <div
        className={cn(
          "shadow-xs overflow-hidden rounded-xl border border-subtle bg-layer-1",
          "grid grid-cols-2 divide-x divide-y divide-subtle sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4"
        )}
      >
        <Client360BentoMetric
          align="center"
          label={t("boards.client_360.support_metric_open")}
          value={stats.totalOpen}
          tone={stats.totalOpen > 0 ? "info" : "success"}
          emphasizeValue={stats.totalOpen > 0}
          icon={Headphones}
          onClick={onFilterChange && stats.totalOpen > 0 ? () => onFilterChange("support_open") : undefined}
        />
        <Client360BentoMetric
          align="center"
          label={t("boards.client_360.support_metric_sla_breach")}
          value={stats.totalSlaBreaches}
          tone={stats.totalSlaBreaches > 0 ? "danger" : "neutral"}
          emphasizeValue={stats.totalSlaBreaches > 0}
          icon={ShieldAlert}
          onClick={onFilterChange && stats.clientsWithSlaBreach > 0 ? () => onFilterChange("sla_breach") : undefined}
        />
        <Client360BentoMetric
          align="center"
          label={t("boards.client_360.support_metric_overdue")}
          value={stats.totalOverdue}
          tone={stats.totalOverdue > 0 ? "warning" : "neutral"}
          emphasizeValue={stats.totalOverdue > 0}
          icon={Clock}
        />
        <Client360BentoMetric
          align="center"
          label={t("boards.client_360.support_metric_clients_affected")}
          value={stats.clientsWithOpen}
          tone={stats.clientsWithOpen > 0 ? "info" : "neutral"}
          icon={Users}
        />
      </div>

      {allClear ? (
        <div className="flex items-center gap-3 rounded-xl border border-subtle bg-layer-1 px-4 py-5">
          <CheckCircle2 className="size-5 shrink-0 text-success-primary" strokeWidth={1.75} />
          <div>
            <p className="text-13 font-semibold text-primary">{t("boards.client_360.support_all_clear_title")}</p>
            <p className="mt-0.5 text-12 text-tertiary">{t("boards.client_360.support_all_clear_body")}</p>
          </div>
        </div>
      ) : (
        <Client360BentoGrid>
          <Client360BentoTile
            className="md:col-span-12 lg:col-span-4"
            title={t("boards.client_360.support_chart_distribution_title")}
            icon={LifeBuoy}
            iconTone="neutral"
          >
            <Client360StackedDistribution
              total={total}
              segments={[
                {
                  key: "clean",
                  label: t("boards.client_360.support_distribution_clean"),
                  value: stats.distribution.clean,
                  tone: "success",
                },
                {
                  key: "open",
                  label: t("boards.client_360.support_distribution_open"),
                  value: stats.distribution.open,
                  tone: "info",
                },
                {
                  key: "breach",
                  label: t("boards.client_360.support_distribution_breach"),
                  value: stats.distribution.breach,
                  tone: "danger",
                },
              ]}
            />
          </Client360BentoTile>

          <Client360BentoTile
            className="md:col-span-12 lg:col-span-4"
            title={t("boards.client_360.support_chart_top_clients_title")}
            icon={Headphones}
            iconTone="info"
            badge={topOpen.length || undefined}
          >
            {topOpen.length > 0 ? (
              <ul className="divide-y divide-subtle rounded-lg border border-subtle/80">
                {topOpen.map((client) => (
                  <li key={client.project_id}>
                    <SupportClientRow
                      client={client}
                      workspaceSlug={workspaceSlug}
                      showBoard={showBoard}
                      tone={client.support_sla?.breached ? "danger" : "info"}
                      meta={t("boards.client_360.support_row_open", {
                        open: client.support.open_count,
                        overdue: client.support.overdue_count,
                      })}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-12 text-tertiary">{t("boards.client_360.support_chart_top_clients_empty")}</p>
            )}
          </Client360BentoTile>

          <Client360BentoTile
            className="md:col-span-12 lg:col-span-4"
            title={t("boards.client_360.support_chart_sla_title")}
            icon={AlertTriangle}
            iconTone="danger"
            badge={slaClients.length || undefined}
            highlight={slaClients.length > 0}
          >
            {slaClients.length > 0 ? (
              <ul className="divide-y divide-subtle rounded-lg border border-subtle/80">
                {slaClients.map((client) => (
                  <li key={client.project_id}>
                    <SupportClientRow
                      client={client}
                      workspaceSlug={workspaceSlug}
                      showBoard={showBoard}
                      tone="danger"
                      meta={t("boards.client_360.support_row_sla", {
                        count: client.support_sla?.breach_count ?? 0,
                      })}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-2 text-12 text-tertiary">
                <CheckCircle2 className="size-3.5 shrink-0 text-success-primary" strokeWidth={1.75} />
                {t("boards.client_360.support_chart_sla_empty")}
              </p>
            )}
          </Client360BentoTile>

          <Client360BentoTile
            className="md:col-span-12"
            title={t("boards.client_360.support_ranking_title")}
            icon={LifeBuoy}
            iconTone="neutral"
            badge={ranking.length || undefined}
            bodyClassName="p-0"
          >
            {ranking.length > 0 ? (
              <ul className="divide-y divide-subtle">
                {ranking.map((client) => (
                  <li key={client.project_id}>
                    <SupportClientRow
                      client={client}
                      workspaceSlug={workspaceSlug}
                      showBoard={showBoard}
                      tone={
                        client.support_sla?.breached ? "danger" : client.support.overdue_count > 0 ? "warning" : "info"
                      }
                      meta={t("boards.client_360.support_row_detail", {
                        open: client.support.open_count,
                        overdue: client.support.overdue_count,
                        sla: client.support_sla?.breach_count ?? 0,
                      })}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-4 text-12 text-tertiary">{t("boards.client_360.support_ranking_empty")}</p>
            )}
          </Client360BentoTile>
        </Client360BentoGrid>
      )}

      <Client360BentoTile
        className="w-full"
        title={t("boards.client_360.support_analytics_title")}
        icon={Clock}
        iconTone="neutral"
        badge={analyticsRows.length || undefined}
      >
        {showAnalytics ? (
          <div className="overflow-x-auto rounded-lg border border-subtle/80">
            <table className="min-w-full text-left text-12">
              <thead className="border-b border-subtle bg-layer-2/60 text-11 tracking-wide text-tertiary uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">{t("boards.client_360.support_analytics_col_client")}</th>
                  <th className="px-3 py-2 font-medium">{t("boards.client_360.support_analytics_col_criticality")}</th>
                  <th className="px-3 py-2 font-medium">{t("boards.client_360.support_analytics_col_count")}</th>
                  <th className="px-3 py-2 font-medium">{t("boards.client_360.support_analytics_col_tta")}</th>
                  <th className="px-3 py-2 font-medium">{t("boards.client_360.support_analytics_col_ttr")}</th>
                  <th className="px-3 py-2 font-medium">{t("boards.client_360.support_analytics_col_in_progress")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle/70">
                {analyticsRows.map((row) => (
                  <tr key={row.key} className="text-secondary">
                    <td className="px-3 py-2 font-medium text-primary">
                      {row.isPortfolio ? t("boards.client_360.support_analytics_portfolio") : row.clientLabel}
                    </td>
                    <td className="px-3 py-2">
                      {row.criticality === "unknown"
                        ? t("boards.client_360.support_analytics_unknown_criticality")
                        : t(`intake_public_form.criticality_${row.criticality}`)}
                    </td>
                    <td className="px-3 py-2">{row.bucket.count}</td>
                    <td className="px-3 py-2">{formatSupportMetricDuration(row.bucket.median_tta_seconds)}</td>
                    <td className="px-3 py-2">{formatSupportMetricDuration(row.bucket.median_ttr_seconds)}</td>
                    <td className="px-3 py-2">{formatSupportMetricDuration(row.bucket.median_in_progress_seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-12 text-tertiary">{t("boards.client_360.support_analytics_empty")}</p>
        )}
      </Client360BentoTile>
    </div>
  );
}
