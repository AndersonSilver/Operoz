import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { cn } from "@operis/utils";
import { AssistantService } from "@/services/assistant.service";
import "@/components/exporter/workspace-exports-settings.css";

type QualityMetric = {
  label: string;
  value: string;
  meetsTarget: boolean | null;
};

function formatRate(rate: number | null | undefined): string {
  if (rate == null) return "—";
  return `${Math.round(rate * 100)}%`;
}

function formatMs(ms: number | null | undefined): string {
  if (ms == null) return "—";
  return `${ms} ms`;
}

export function AssistantQualityDashboard({ workspaceSlug }: { workspaceSlug: string }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<QualityMetric[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const service = new AssistantService();
    service
      .getQualityDashboard(workspaceSlug, 7)
      .then((data) => {
        const assistant = data.assistant;
        const automation = data.automation;
        setMetrics([
          {
            label: t("workspace_settings.settings.assistant.tool_usage"),
            value: formatRate(assistant.tool_usage.rate),
            meetsTarget: assistant.tool_usage.meets_target,
          },
          {
            label: t("workspace_settings.settings.assistant.satisfaction"),
            value: formatRate(assistant.satisfaction.rate),
            meetsTarget: assistant.satisfaction.meets_target,
          },
          {
            label: t("workspace_settings.settings.assistant.latency_p95"),
            value: formatMs(assistant.latency.p95_first_token_ms),
            meetsTarget: assistant.latency.meets_target,
          },
          {
            label: t("workspace_settings.settings.assistant.hallucination"),
            value: formatRate(assistant.hallucination_reviews.rate),
            meetsTarget: assistant.hallucination_reviews.meets_target,
          },
          {
            label: t("workspace_settings.settings.assistant.automation_p95"),
            value: formatMs(automation.p95_duration_ms),
            meetsTarget: automation.meets_target,
          },
        ]);
      })
      .catch(() => setError(t("workspace_settings.settings.assistant.no_data")))
      .finally(() => setLoading(false));
  }, [workspaceSlug, t]);

  return (
    <section className="workspace-exports-history-panel overflow-hidden rounded-xl border border-subtle bg-layer-1">
      <div className="border-b border-subtle px-5 py-4 lg:px-6">
        <h3 className="text-13 font-semibold text-primary">
          {t("workspace_settings.settings.assistant.metrics_title")}
        </h3>
        <p className="mt-0.5 text-12 text-tertiary">
          {t("workspace_settings.settings.assistant.period_days", { days: 7 })}
        </p>
      </div>

      <div className="p-5 lg:p-6">
        {loading ? (
          <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="size-7 animate-spin text-accent-primary" strokeWidth={1.75} />
            <p className="text-13 text-tertiary">{t("loading")}</p>
          </div>
        ) : error ? (
          <div className="flex min-h-[12rem] items-center justify-center rounded-xl border border-dashed border-subtle bg-layer-2/30 px-6 py-10 text-center">
            <p className="text-13 text-secondary">{error}</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-xl border border-subtle bg-surface-1 p-4 transition-colors hover:border-accent-subtle/40 hover:bg-layer-1-hover/40"
              >
                <p className="text-11 font-medium tracking-wide text-tertiary uppercase">{metric.label}</p>
                <p className="mt-2 text-24 font-semibold tracking-tight text-primary tabular-nums">{metric.value}</p>
                {metric.meetsTarget != null ? (
                  <p
                    className={cn(
                      "mt-2 inline-flex rounded-full border px-2 py-0.5 text-11 font-medium",
                      metric.meetsTarget
                        ? "border-success-subtle/50 bg-success-subtle/30 text-success-primary"
                        : "border-danger-subtle/50 bg-danger-subtle/30 text-danger-primary"
                    )}
                  >
                    {metric.meetsTarget
                      ? t("workspace_settings.settings.assistant.target_met")
                      : t("workspace_settings.settings.assistant.target_missed")}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
