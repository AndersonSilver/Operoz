import { useMemo } from "react";
import { Activity, ArrowRightLeft, Gauge, RefreshCw, Server } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import type { TAutomationMetricsResponse } from "@operis/types";
import { cn } from "@operis/ui";
import { AutomationListHero } from "./automation-list-hero";
import { AutomationMetricsCharts } from "./automation-metrics-charts";
import { AutomationOpsSignals } from "./automation-ops-signals";
import { normalizeAutomationMetrics } from "./automation-ops-utils";
import "./automation-list.css";
import "./automation-ops.css";

type Props = {
  data: TAutomationMetricsResponse | null;
  refreshing: boolean;
  onRefresh: () => void;
};

export function AutomationMetricsPanel(props: Props) {
  const { data, refreshing, onRefresh } = props;
  const { t } = useTranslation();

  const normalizedMetrics = useMemo(() => normalizeAutomationMetrics(data?.metrics ?? {}), [data?.metrics]);

  const totalRuns =
    data?.analytics?.summary.total_runs ??
    (normalizedMetrics.run_success ?? 0) + (normalizedMetrics.run_failed ?? 0) + (normalizedMetrics.run_skipped ?? 0);

  const pipelineSteps = useMemo(
    () =>
      [
        {
          key: "dispatch_rules_matched",
          label: t("boards.settings.automation.ops.metrics.keys.dispatch_rules_matched"),
        },
        { key: "outbox_scheduled", label: t("boards.settings.automation.ops.metrics.keys.outbox_scheduled") },
        { key: "outbox_enqueued", label: t("boards.settings.automation.ops.metrics.keys.outbox_enqueued") },
        { key: "run_success", label: t("boards.settings.automation.ops.metrics.keys.run_success") },
      ].map((step) => ({
        ...step,
        value: normalizedMetrics[step.key] ?? 0,
      })),
    [normalizedMetrics, t]
  );

  const pipelineMax = Math.max(...pipelineSteps.map((step) => step.value), 1);

  return (
    <div className="space-y-6">
      <AutomationListHero
        icon={Gauge}
        title={t("boards.settings.automation.ops.metrics.hero_title")}
        description={t("boards.settings.automation.ops.metrics.hero_description")}
        createLabel={t("boards.settings.automation.ops.metrics.refresh")}
        creating={refreshing}
        onCreate={onRefresh}
        showIllustration={false}
        accentClass="text-[var(--extended-color-purple-500)] bg-[var(--extended-color-purple-500)]/10"
        gradientClass="from-[var(--extended-color-purple-500)]/15"
        highlights={[
          {
            label: t("boards.settings.automation.ops.metrics.queue_badge", {
              queue: data?.queue ?? "automation",
            }),
            icon: Server,
            tone: "purple",
          },
          {
            label: t("boards.settings.automation.ops.metrics.window_hint"),
            icon: Activity,
            tone: "accent",
          },
        ]}
      />

      <section className="automation-ops-glow-top overflow-hidden rounded-xl border border-subtle bg-layer-1 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl border border-subtle bg-layer-2 text-accent-primary">
              <Activity className="size-4" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="text-14 font-semibold text-primary">
                {t("boards.settings.automation.ops.metrics.overview_title")}
              </h2>
              <p className="text-12 text-tertiary">
                {t("boards.settings.automation.ops.metrics.overview_description")}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={refreshing}
            prependIcon={<RefreshCw className={cn(refreshing && "animate-spin")} />}
          >
            {refreshing ? t("loading") : t("boards.settings.automation.ops.metrics.refresh")}
          </Button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border border-subtle bg-surface-1 px-4 py-3">
            <p className="text-11 text-tertiary">{t("boards.settings.automation.ops.metrics.total_runs")}</p>
            <p className="automation-ops-metric-value mt-1 text-success-primary">{totalRuns.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-subtle bg-surface-1 px-4 py-3">
            <p className="text-11 text-tertiary">{t("boards.settings.automation.ops.metrics.charts.success_rate")}</p>
            <p className="automation-ops-metric-value mt-1 text-primary">
              {data?.analytics?.summary.success_rate != null ? `${data.analytics.summary.success_rate}%` : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-subtle bg-surface-1 px-4 py-3">
            <p className="text-11 text-tertiary">{t("boards.settings.automation.ops.metrics.dlq_count")}</p>
            <p className="automation-ops-metric-value mt-1 text-danger-primary">
              {(normalizedMetrics.dlq_persisted ?? 0).toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-subtle bg-surface-1 px-4 py-3">
            <p className="text-11 text-tertiary">{t("boards.settings.automation.ops.metrics.charts.runs_24h")}</p>
            <p className="automation-ops-metric-value mt-1 text-accent-primary">
              {(data?.analytics?.summary.runs_last_24h ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      <AutomationMetricsCharts analytics={data?.analytics} />

      {pipelineSteps.some((step) => step.value > 0) ? (
        <section className="automation-ops-glow-top overflow-hidden rounded-xl border border-subtle bg-layer-1 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl border border-subtle bg-layer-2 text-accent-primary">
              <ArrowRightLeft className="size-4" strokeWidth={1.75} />
            </span>
            <div>
              <h2 className="text-14 font-semibold text-primary">
                {t("boards.settings.automation.ops.metrics.charts.pipeline_title")}
              </h2>
              <p className="text-12 text-tertiary">
                {t("boards.settings.automation.ops.metrics.charts.pipeline_description")}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {pipelineSteps.map((step) => (
              <div key={step.key}>
                <div className="mb-1 flex items-center justify-between gap-2 text-12">
                  <span className="text-secondary">{step.label}</span>
                  <span className="font-medium text-primary tabular-nums">{step.value.toLocaleString()}</span>
                </div>
                <div className="automation-ops-bar-track">
                  <div
                    className="automation-ops-bar-fill bg-accent-primary"
                    style={{ width: `${Math.max(6, (step.value / pipelineMax) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <AutomationOpsSignals metrics={data?.metrics ?? {}} />

      {totalRuns === 0 && Object.keys(normalizedMetrics).length === 0 ? (
        <section className="flex flex-col items-center justify-center rounded-xl border border-dashed border-subtle bg-layer-1 px-6 py-14 text-center">
          <span className="grid size-14 place-items-center rounded-2xl border border-subtle bg-accent-subtle text-accent-primary">
            <Gauge className="size-6" strokeWidth={1.5} />
          </span>
          <h3 className="text-15 mt-4 font-semibold text-primary">
            {t("boards.settings.automation.ops.metrics.empty_title")}
          </h3>
          <p className="mt-2 max-w-md text-13 leading-relaxed text-tertiary">
            {t("boards.settings.automation.ops.metrics.empty_description")}
          </p>
        </section>
      ) : null}
    </div>
  );
}
