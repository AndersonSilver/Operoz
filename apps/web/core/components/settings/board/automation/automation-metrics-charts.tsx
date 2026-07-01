import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart3,
  Clock3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { AreaChart } from "@operoz/propel/charts/area-chart";
import { BarChart } from "@operoz/propel/charts/bar-chart";
import { LineChart } from "@operoz/propel/charts/line-chart";
import { PieChart } from "@operoz/propel/charts/pie-chart";
import { EmptyStateCompact } from "@operoz/propel/empty-state";
import type { TAutomationAnalytics } from "@operoz/types";
import { cn } from "@operoz/ui";
import { calculateTimeAgo } from "@operoz/utils";

const STATUS_COLORS: Record<string, string> = {
  success: "var(--bg-success-primary)",
  failed: "var(--bg-danger-primary)",
  skipped: "var(--bg-warning-primary)",
  pending: "var(--bg-accent-primary)",
  running: "var(--extended-color-purple-500, #8b5cf6)",
};

function ChartSection({
  title,
  description,
  icon: Icon,
  iconClassName,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon: LucideIcon;
  iconClassName: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("automation-ops-glow-top overflow-hidden rounded-xl border border-subtle bg-layer-1", className)}
    >
      <header className="flex items-start gap-3 border-b border-subtle px-4 py-3 sm:px-5">
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl border border-subtle bg-layer-2",
            iconClassName
          )}
        >
          <Icon className="size-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <h3 className="text-14 font-semibold text-primary">{title}</h3>
          {description ? <p className="mt-0.5 text-12 text-tertiary">{description}</p> : null}
        </div>
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function KpiTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "success" | "danger" | "accent" | "neutral";
}) {
  const toneClass = {
    success: "text-success-primary",
    danger: "text-danger-primary",
    accent: "text-accent-primary",
    neutral: "text-primary",
  }[tone];

  return (
    <div className="rounded-lg border border-subtle bg-surface-1 px-4 py-3">
      <p className="text-11 text-tertiary">{label}</p>
      <p className={cn("automation-ops-metric-value mt-1", toneClass)}>{value}</p>
      {hint ? <p className="mt-1 text-10 text-placeholder">{hint}</p> : null}
    </div>
  );
}

function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${(ms / 60_000).toFixed(1)} min`;
}

function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}`;
}

type Props = {
  analytics: TAutomationAnalytics | undefined;
};

export function AutomationMetricsCharts(props: Props) {
  const { analytics } = props;
  const { t } = useTranslation();

  const summary = analytics?.summary;
  const hasRuns = (summary?.total_runs ?? 0) > 0;

  const timelineData = useMemo(
    () =>
      (analytics?.timeline ?? []).map((point) => ({
        ...point,
        label: formatShortDate(point.date),
        efficiency: point.total > 0 ? Math.round((point.success / point.total) * 100) : 0,
      })),
    [analytics?.timeline]
  );

  const ruleChartData = useMemo(
    () =>
      (analytics?.by_rule ?? []).slice(0, 8).map((rule) => ({
        key: rule.rule_id,
        name: rule.rule_name || t("boards.settings.automation.ops.metrics.charts.unknown_rule"),
        success: rule.success,
        failed: rule.failed,
        skipped: rule.skipped,
        total: rule.total,
      })),
    [analytics?.by_rule, t]
  );

  const eventTypeChartData = useMemo(
    () =>
      (analytics?.by_event_type ?? []).slice(0, 6).map((item) => ({
        key: item.event_type,
        name: item.event_type,
        count: item.count,
      })),
    [analytics?.by_event_type]
  );

  const statusChartData = useMemo(
    () =>
      (analytics?.by_status ?? []).map((item) => ({
        key: item.status,
        name: t(`boards.settings.automation.ops.metrics.charts.status.${item.status}`, {
          defaultValue: item.status,
        }),
        count: item.count,
      })),
    [analytics?.by_status, t]
  );

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      <section className="automation-ops-glow-top overflow-hidden rounded-xl border border-subtle bg-layer-1 p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl border border-subtle bg-layer-2 text-success-primary">
            <TrendingUp className="size-4" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="text-14 font-semibold text-primary">
              {t("boards.settings.automation.ops.metrics.charts.efficiency_title")}
            </h2>
            <p className="text-12 text-tertiary">
              {t("boards.settings.automation.ops.metrics.charts.efficiency_description", {
                days: analytics.period_days,
              })}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            label={t("boards.settings.automation.ops.metrics.charts.success_rate")}
            value={summary?.success_rate != null ? `${summary.success_rate}%` : "—"}
            tone="success"
          />
          <KpiTile
            label={t("boards.settings.automation.ops.metrics.charts.runs_24h")}
            value={(summary?.runs_last_24h ?? 0).toLocaleString()}
            tone="accent"
          />
          <KpiTile
            label={t("boards.settings.automation.ops.metrics.charts.avg_duration")}
            value={formatDuration(summary?.avg_duration_ms)}
            hint={
              summary?.p95_duration_ms != null
                ? t("boards.settings.automation.ops.metrics.charts.p95_duration", {
                    value: formatDuration(summary.p95_duration_ms),
                  })
                : undefined
            }
          />
          <KpiTile
            label={t("boards.settings.automation.ops.metrics.charts.failed_runs")}
            value={(summary?.failed_count ?? 0).toLocaleString()}
            tone={(summary?.failed_count ?? 0) > 0 ? "danger" : "neutral"}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartSection
          title={t("boards.settings.automation.ops.metrics.charts.timeline_title")}
          description={t("boards.settings.automation.ops.metrics.charts.timeline_description")}
          icon={LineChartIcon}
          iconClassName="text-accent-primary"
        >
          {hasRuns ? (
            <AreaChart
              className="h-[280px] w-full"
              data={timelineData}
              margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
              areas={[
                {
                  key: "success",
                  label: t("boards.settings.automation.ops.metrics.keys.run_success"),
                  fill: STATUS_COLORS.success,
                  strokeColor: STATUS_COLORS.success,
                  stackId: "runs",
                  fillOpacity: 0.55,
                  strokeOpacity: 1,
                  showDot: false,
                  smoothCurves: true,
                },
                {
                  key: "failed",
                  label: t("boards.settings.automation.ops.metrics.keys.run_failed"),
                  fill: STATUS_COLORS.failed,
                  strokeColor: STATUS_COLORS.failed,
                  stackId: "runs",
                  fillOpacity: 0.55,
                  strokeOpacity: 1,
                  showDot: false,
                  smoothCurves: true,
                },
                {
                  key: "skipped",
                  label: t("boards.settings.automation.ops.metrics.keys.run_skipped"),
                  fill: STATUS_COLORS.skipped,
                  strokeColor: STATUS_COLORS.skipped,
                  stackId: "runs",
                  fillOpacity: 0.45,
                  strokeOpacity: 1,
                  showDot: false,
                  smoothCurves: true,
                },
              ]}
              xAxis={{ key: "label", label: "" }}
              yAxis={{ key: "total", label: "" }}
              legend={{ show: true }}
            />
          ) : (
            <EmptyStateCompact
              title={t("boards.settings.automation.ops.metrics.charts.empty_runs_title")}
              description={t("boards.settings.automation.ops.metrics.charts.empty_runs_description")}
            />
          )}
        </ChartSection>

        <ChartSection
          title={t("boards.settings.automation.ops.metrics.charts.efficiency_line_title")}
          description={t("boards.settings.automation.ops.metrics.charts.efficiency_line_description")}
          icon={TrendingUp}
          iconClassName="text-success-primary"
        >
          {hasRuns ? (
            <LineChart
              className="h-[280px] w-full"
              data={timelineData}
              margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
              lines={[
                {
                  key: "efficiency",
                  label: t("boards.settings.automation.ops.metrics.charts.success_rate"),
                  stroke: STATUS_COLORS.success,
                  fill: STATUS_COLORS.success,
                  showDot: true,
                  smoothCurves: true,
                  dashedLine: false,
                },
              ]}
              xAxis={{ key: "label", label: "" }}
              yAxis={{ key: "efficiency", label: "%" }}
              legend={{ show: false }}
            />
          ) : (
            <EmptyStateCompact
              title={t("boards.settings.automation.ops.metrics.charts.empty_runs_title")}
              description={t("boards.settings.automation.ops.metrics.charts.empty_runs_description")}
            />
          )}
        </ChartSection>
      </div>

      {eventTypeChartData.length > 0 ? (
        <ChartSection
          title={t("boards.settings.automation.ops.metrics.charts.event_type_title")}
          description={t("boards.settings.automation.ops.metrics.charts.event_type_description")}
          icon={BarChart3}
          iconClassName="text-[var(--extended-color-purple-500)]"
        >
          <BarChart
            className="h-[240px] w-full"
            data={eventTypeChartData}
            margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
            bars={[
              {
                key: "count",
                label: t("boards.settings.automation.ops.metrics.charts.event_type_count"),
                stackId: "events",
                fill: "var(--bg-accent-primary)",
                textClassName: "",
                showPercentage: false,
                showTopBorderRadius: () => true,
                showBottomBorderRadius: () => true,
              },
            ]}
            xAxis={{ key: "name", label: "" }}
            yAxis={{ key: "count", label: "" }}
            barSize={24}
            legend={{ show: false }}
          />
        </ChartSection>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartSection
          title={t("boards.settings.automation.ops.metrics.charts.status_title")}
          description={t("boards.settings.automation.ops.metrics.charts.status_description")}
          icon={PieChartIcon}
          iconClassName="text-[var(--extended-color-purple-500)]"
        >
          {statusChartData.length > 0 ? (
            <PieChart
              className="h-[280px] w-full"
              data={statusChartData}
              dataKey="count"
              innerRadius={58}
              outerRadius={96}
              cells={statusChartData.map((item) => ({
                key: item.key,
                fill: STATUS_COLORS[item.key] ?? "var(--bg-layer-3)",
              }))}
              legend={{ show: true }}
              showTooltip
              showLabel={false}
              paddingAngle={3}
              cornerRadius={3}
            />
          ) : (
            <EmptyStateCompact
              title={t("boards.settings.automation.ops.metrics.charts.empty_runs_title")}
              description={t("boards.settings.automation.ops.metrics.charts.empty_runs_description")}
            />
          )}
        </ChartSection>

        <ChartSection
          title={t("boards.settings.automation.ops.metrics.charts.by_rule_title")}
          description={t("boards.settings.automation.ops.metrics.charts.by_rule_description")}
          icon={BarChart3}
          iconClassName="text-accent-primary"
        >
          {ruleChartData.length > 0 ? (
            <BarChart
              className="h-[280px] w-full"
              data={ruleChartData}
              margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
              bars={[
                {
                  key: "success",
                  label: t("boards.settings.automation.ops.metrics.keys.run_success"),
                  stackId: "rule",
                  fill: STATUS_COLORS.success,
                  textClassName: "",
                  showPercentage: false,
                  showTopBorderRadius: () => false,
                  showBottomBorderRadius: () => true,
                },
                {
                  key: "failed",
                  label: t("boards.settings.automation.ops.metrics.keys.run_failed"),
                  stackId: "rule",
                  fill: STATUS_COLORS.failed,
                  textClassName: "",
                  showPercentage: false,
                  showTopBorderRadius: () => true,
                  showBottomBorderRadius: () => false,
                },
              ]}
              xAxis={{ key: "name", label: "" }}
              yAxis={{ key: "total", label: "" }}
              barSize={22}
              legend={{ show: true }}
            />
          ) : (
            <EmptyStateCompact
              title={t("boards.settings.automation.ops.metrics.charts.empty_runs_title")}
              description={t("boards.settings.automation.ops.metrics.charts.empty_runs_description")}
            />
          )}
        </ChartSection>
      </div>

      {(analytics.recent_failures?.length ?? 0) > 0 ? (
        <ChartSection
          title={t("boards.settings.automation.ops.metrics.charts.recent_failures_title")}
          description={t("boards.settings.automation.ops.metrics.charts.recent_failures_description")}
          icon={AlertTriangle}
          iconClassName="text-danger-primary"
        >
          <ul className="space-y-3">
            {analytics.recent_failures.map((failure) => (
              <li key={failure.id} className="automation-ops-dlq-card px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-13 font-medium text-primary">
                    {failure.rule_name || t("boards.settings.automation.ops.dead_letters.unknown_rule")}
                  </p>
                  {failure.created_at ? (
                    <span className="flex items-center gap-1 text-11 text-tertiary">
                      <Clock3 className="size-3" />
                      {calculateTimeAgo(failure.created_at)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-11 text-tertiary">{failure.event_type}</p>
                {failure.error_message ? (
                  <p className="font-mono mt-2 line-clamp-2 text-11 text-danger-primary">{failure.error_message}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </ChartSection>
      ) : null}
    </div>
  );
}
