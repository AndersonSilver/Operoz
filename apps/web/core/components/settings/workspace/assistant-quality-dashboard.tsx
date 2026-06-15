import { useEffect, useState } from "react";
import { useTranslation } from "@operis/i18n";
import { cn } from "@operis/utils";
import { AssistantService } from "@/services/assistant.service";

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

  if (loading) {
    return <p className="text-sm text-tertiary">{t("loading")}</p>;
  }

  if (error) {
    return <p className="text-danger text-sm">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-tertiary">{t("workspace_settings.settings.assistant.period_days", { days: 7 })}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg border border-subtle bg-surface-1 p-4">
            <p className="text-xs font-medium tracking-wide text-tertiary uppercase">{metric.label}</p>
            <p className="text-2xl mt-1 font-semibold text-primary">{metric.value}</p>
            {metric.meetsTarget != null && (
              <p className={cn("text-xs mt-2 font-medium", metric.meetsTarget ? "text-accent-primary" : "text-danger")}>
                {metric.meetsTarget
                  ? t("workspace_settings.settings.assistant.target_met")
                  : t("workspace_settings.settings.assistant.target_missed")}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
