import { useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import type { TClient360Client, TClient360Summary, TClient360SummaryDelta } from "@operis/types";
import type { Client360FilterKey } from "@/components/board/client-360/client-360-client-filters";
import {
  Client360OverviewBlock,
  Client360StackedDistribution,
  Client360StatGrid,
  Client360StatTile,
} from "@/components/board/client-360/client-360-ui";

type Props = {
  summary: TClient360Summary;
  clients: TClient360Client[];
  onFilterChange?: (filter: Client360FilterKey) => void;
  summaryDelta?: TClient360SummaryDelta;
  showPeriodCompare?: boolean;
};

export function Client360PortfolioInsights({
  summary,
  clients,
  onFilterChange,
  summaryDelta,
  showPeriodCompare = false,
}: Props) {
  const { t } = useTranslation();

  const healthCounts = useMemo(() => {
    const counts = { ok: 0, warning: 0, critical: 0 };
    for (const c of clients) counts[c.health] += 1;
    return counts;
  }, [clients]);

  const reportCounts = useMemo(() => {
    const counts = { complete: 0, partial: 0, missing: 0, n_a: 0 };
    for (const c of clients) counts[c.status_report.coverage] += 1;
    return counts;
  }, [clients]);

  const overdueTop = useMemo(
    () =>
      [...clients]
        .filter((c) => c.issues.overdue > 0)
        .sort((a, b) => b.issues.overdue - a.issues.overdue)
        .slice(0, 5),
    [clients]
  );

  const total = clients.length;
  const showDistribution = total > 0;

  const showDelta = showPeriodCompare && summaryDelta;

  return (
    <>
      <Client360StatGrid>
        <Client360StatTile
          label={t("boards.client_360.summary_clients")}
          value={summary.total_clients}
          variant="compact"
        />
        <Client360StatTile
          label={t("boards.client_360.summary_critical")}
          value={summary.health_critical}
          variant="compact"
          tone={summary.health_critical > 0 ? "danger" : "neutral"}
          onClick={onFilterChange && summary.health_critical > 0 ? () => onFilterChange("critical") : undefined}
          delta={showDelta ? summaryDelta.health_critical : undefined}
          deltaMode="lower_is_better"
        />
        <Client360StatTile
          label={t("boards.client_360.summary_warning")}
          value={summary.health_warning}
          variant="compact"
          tone={summary.health_warning > 0 ? "warning" : "neutral"}
          onClick={onFilterChange && summary.health_warning > 0 ? () => onFilterChange("warning") : undefined}
          delta={showDelta ? summaryDelta.health_warning : undefined}
          deltaMode="lower_is_better"
        />
        <Client360StatTile
          label={t("boards.client_360.summary_score_alert")}
          value={summary.health_score_alert}
          variant="compact"
          tone={summary.health_score_alert > 0 ? "danger" : "neutral"}
          onClick={onFilterChange && summary.health_score_alert > 0 ? () => onFilterChange("score_alert") : undefined}
          delta={showDelta ? summaryDelta.health_score_alert : undefined}
          deltaMode="lower_is_better"
        />
        <Client360StatTile
          label={t("boards.client_360.summary_report_missing")}
          value={summary.report_missing}
          variant="compact"
          tone={summary.report_missing > 0 ? "warning" : "neutral"}
          onClick={onFilterChange && summary.report_missing > 0 ? () => onFilterChange("report_missing") : undefined}
          delta={showDelta ? summaryDelta.report_missing : undefined}
          deltaMode="lower_is_better"
        />
        <Client360StatTile
          label={t("boards.client_360.summary_overdue")}
          value={summary.total_overdue}
          variant="compact"
          tone={summary.total_overdue > 0 ? "warning" : "neutral"}
          onClick={onFilterChange && summary.total_overdue > 0 ? () => onFilterChange("overdue") : undefined}
          delta={showDelta ? summaryDelta.total_overdue : undefined}
          deltaMode="lower_is_better"
        />
        <Client360StatTile
          label={t("boards.client_360.summary_support")}
          value={summary.total_support_open}
          variant="compact"
          tone={summary.total_support_open > 0 ? "info" : "neutral"}
          onClick={onFilterChange && summary.total_support_open > 0 ? () => onFilterChange("support_open") : undefined}
          delta={showDelta ? summaryDelta.total_support_open : undefined}
          deltaMode="lower_is_better"
        />
      </Client360StatGrid>

      {showDistribution ? (
        <div className="grid gap-6 border-t border-subtle px-4 py-5 lg:grid-cols-3">
          <Client360OverviewBlock title={t("boards.client_360.chart_health_title")}>
            <Client360StackedDistribution
              total={total}
              segments={[
                {
                  key: "critical",
                  label: t("boards.client_360.health_critical"),
                  value: healthCounts.critical,
                  tone: "danger",
                },
                {
                  key: "warning",
                  label: t("boards.client_360.health_warning"),
                  value: healthCounts.warning,
                  tone: "warning",
                },
                {
                  key: "ok",
                  label: t("boards.client_360.health_ok"),
                  value: healthCounts.ok,
                  tone: "success",
                },
              ]}
            />
          </Client360OverviewBlock>

          <Client360OverviewBlock title={t("boards.client_360.chart_report_title")}>
            <Client360StackedDistribution
              total={total}
              segments={[
                {
                  key: "missing",
                  label: t("boards.client_360.report_missing"),
                  value: reportCounts.missing,
                  tone: "danger",
                },
                {
                  key: "partial",
                  label: t("boards.client_360.report_partial"),
                  value: reportCounts.partial,
                  tone: "warning",
                },
                {
                  key: "complete",
                  label: t("boards.client_360.report_complete"),
                  value: reportCounts.complete,
                  tone: "success",
                },
                {
                  key: "n_a",
                  label: t("boards.client_360.report_na"),
                  value: reportCounts.n_a,
                  tone: "neutral",
                },
              ]}
            />
          </Client360OverviewBlock>

          <Client360OverviewBlock title={t("boards.client_360.chart_overdue_title")}>
            {overdueTop.length > 0 ? (
              <ul className="divide-y divide-subtle rounded-sm border border-subtle">
                {overdueTop.map((c) => (
                  <li key={c.project_id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <span className="min-w-0 truncate text-12 text-secondary">{c.name}</span>
                    <span className="shrink-0 text-12 font-medium text-primary tabular-nums">{c.issues.overdue}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="flex items-center gap-2 rounded-sm border border-subtle bg-layer-2 px-3 py-2.5 text-12 text-tertiary">
                <CheckCircle2 className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />
                {t("boards.client_360.chart_overdue_empty")}
              </p>
            )}
          </Client360OverviewBlock>
        </div>
      ) : null}
    </>
  );
}
