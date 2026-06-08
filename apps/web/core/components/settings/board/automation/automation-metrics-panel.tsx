import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRightLeft,
  Gauge,
  Inbox,
  RefreshCw,
  Server,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import type { TAutomationMetricsResponse } from "@operis/types";
import { cn } from "@operis/ui";
import { AutomationListHero } from "./automation-list-hero";
import {
  METRIC_GROUP_ORDER,
  formatMetricValue,
  parseAutomationMetrics,
  type AutomationMetricGroup,
  type ParsedAutomationMetric,
} from "./automation-ops-utils";
import "./automation-list.css";
import "./automation-ops.css";

const GROUP_ICONS: Record<AutomationMetricGroup, LucideIcon> = {
  dispatch: ArrowRightLeft,
  outbox: Inbox,
  runs: Zap,
  resilience: ShieldAlert,
};

const GROUP_ACCENT: Record<AutomationMetricGroup, string> = {
  dispatch: "text-accent-primary bg-accent-subtle",
  outbox: "text-[var(--extended-color-purple-500)] bg-[var(--extended-color-purple-500)]/10",
  runs: "text-success-primary bg-success-subtle",
  resilience: "text-danger-primary bg-danger-subtle",
};

const VARIANT_CLASS: Record<ParsedAutomationMetric["variant"], string> = {
  success: "automation-ops-metric-card--success",
  warning: "automation-ops-metric-card--warning",
  danger: "automation-ops-metric-card--danger",
  accent: "automation-ops-metric-card--accent",
  purple: "automation-ops-metric-card--purple",
  neutral: "",
};

type Props = {
  data: TAutomationMetricsResponse | null;
  refreshing: boolean;
  onRefresh: () => void;
};

export function AutomationMetricsPanel(props: Props) {
  const { data, refreshing, onRefresh } = props;
  const { t } = useTranslation();

  const parsed = useMemo(
    () => parseAutomationMetrics(data?.metrics ?? {}),
    [data?.metrics]
  );

  const maxValue = useMemo(
    () => Math.max(...parsed.map((item) => item.value), 1),
    [parsed]
  );

  const grouped = useMemo(() => {
    const map = new Map<AutomationMetricGroup, ParsedAutomationMetric[]>();
    for (const group of METRIC_GROUP_ORDER) map.set(group, []);
    for (const item of parsed) {
      map.get(item.group)?.push(item);
    }
    return map;
  }, [parsed]);

  const totalRuns = parsed
    .filter((item) => ["run_success", "run_failed", "run_skipped"].includes(item.baseKey))
    .reduce((sum, item) => sum + item.value, 0);

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

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-subtle bg-surface-1 px-4 py-3">
            <p className="text-11 text-tertiary">{t("boards.settings.automation.ops.metrics.total_signals")}</p>
            <p className="automation-ops-metric-value mt-1 text-primary">{parsed.length}</p>
          </div>
          <div className="rounded-lg border border-subtle bg-surface-1 px-4 py-3">
            <p className="text-11 text-tertiary">{t("boards.settings.automation.ops.metrics.total_runs")}</p>
            <p className="automation-ops-metric-value mt-1 text-success-primary">{totalRuns.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-subtle bg-surface-1 px-4 py-3">
            <p className="text-11 text-tertiary">{t("boards.settings.automation.ops.metrics.dlq_count")}</p>
            <p className="automation-ops-metric-value mt-1 text-danger-primary">
              {(data?.metrics?.dlq_persisted ?? 0).toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      {parsed.length === 0 ? (
        <section className="flex flex-col items-center justify-center rounded-xl border border-dashed border-subtle bg-layer-1 px-6 py-14 text-center">
          <span className="grid size-14 place-items-center rounded-2xl border border-subtle bg-accent-subtle text-accent-primary">
            <Gauge className="size-6" strokeWidth={1.5} />
          </span>
          <h3 className="mt-4 text-15 font-semibold text-primary">
            {t("boards.settings.automation.ops.metrics.empty_title")}
          </h3>
          <p className="mt-2 max-w-md text-13 leading-relaxed text-tertiary">
            {t("boards.settings.automation.ops.metrics.empty_description")}
          </p>
        </section>
      ) : (
        METRIC_GROUP_ORDER.map((group) => {
          const items = grouped.get(group) ?? [];
          if (items.length === 0) return null;
          const GroupIcon = GROUP_ICONS[group];

          return (
            <section key={group} className="space-y-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-lg border border-subtle",
                    GROUP_ACCENT[group]
                  )}
                >
                  <GroupIcon className="size-3.5" strokeWidth={1.75} />
                </span>
                <h3 className="text-13 font-semibold text-primary">
                  {t(`boards.settings.automation.ops.metrics.groups.${group}`)}
                </h3>
                <span className="rounded-full bg-layer-2 px-2 py-0.5 text-10 text-tertiary">
                  {items.length}
                </span>
              </div>

              <div className="automation-ops-metric-grid">
                {items.map((item) => (
                  <article
                    key={item.rawKey}
                    className={cn("automation-ops-metric-card", VARIANT_CLASS[item.variant])}
                  >
                    <p className="text-11 font-medium text-secondary">
                      {item.reason
                        ? t(`boards.settings.automation.ops.metrics.reasons.${item.reason}`, {
                            defaultValue: item.reason,
                          })
                        : t(`boards.settings.automation.ops.metrics.keys.${item.baseKey}`, {
                            defaultValue: item.baseKey,
                          })}
                    </p>
                    <p className="automation-ops-metric-value mt-2 text-primary">
                      {formatMetricValue(item.value, item.baseKey)}
                    </p>
                    <div className="automation-ops-bar-track mt-3">
                      <div
                        className={cn(
                          "automation-ops-bar-fill",
                          item.variant === "success" && "bg-success-primary",
                          item.variant === "danger" && "bg-danger-primary",
                          item.variant === "warning" && "bg-warning-primary",
                          item.variant === "accent" && "bg-accent-primary",
                          item.variant === "purple" && "bg-[var(--extended-color-purple-500)]",
                          item.variant === "neutral" && "bg-layer-3"
                        )}
                        style={{ width: `${Math.max(8, (item.value / maxValue) * 100)}%` }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
