import { AlertTriangle, Clock, FileWarning, Headphones, Users } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import type { TClient360Summary } from "@operoz/types";
import { cn } from "@operoz/utils";
import { Client360BentoMetric } from "@/components/board/client-360/client-360-bento";
import type { Client360FilterKey } from "@/components/board/client-360/client-360-client-filters";

type Props = {
  summary: TClient360Summary;
  onFilterChange?: (filter: Client360FilterKey) => void;
};

export function Client360PortfolioKpiStrip({ summary, onFilterChange }: Props) {
  const { t } = useTranslation();

  const clickable = (key: Client360FilterKey, count: number) =>
    onFilterChange && count > 0 ? () => onFilterChange(key) : undefined;

  return (
    <section className="client-360-workspace-kpi-panel workspace-exports-history-panel overflow-hidden rounded-xl border border-subtle bg-layer-1">
      <div className="border-b border-subtle bg-gradient-to-r from-layer-1 via-layer-1 to-accent-subtle/10 px-5 py-3 lg:px-6">
        <h2 className="text-13 font-semibold text-primary">{t("boards.client_360.kpi_strip_title")}</h2>
        <p className="mt-0.5 text-12 text-tertiary">{t("boards.client_360.kpi_strip_hint")}</p>
      </div>
      <div
        className="grid grid-cols-2 divide-x divide-y divide-subtle sm:grid-cols-3 sm:divide-y-0 lg:grid-cols-4 xl:grid-cols-7"
        role="list"
      >
        <Client360BentoMetric
          align="center"
          label={t("boards.client_360.summary_clients")}
          value={summary.total_clients}
          tone="neutral"
          icon={Users}
        />
        <Client360BentoMetric
          align="center"
          label={t("boards.client_360.summary_critical")}
          value={summary.health_critical}
          tone={summary.health_critical > 0 ? "danger" : "neutral"}
          emphasizeValue={summary.health_critical > 0}
          icon={AlertTriangle}
          onClick={clickable("critical", summary.health_critical)}
        />
        <Client360BentoMetric
          align="center"
          label={t("boards.client_360.summary_warning")}
          value={summary.health_warning}
          tone={summary.health_warning > 0 ? "warning" : "neutral"}
          emphasizeValue={summary.health_warning > 0}
          icon={AlertTriangle}
          onClick={clickable("warning", summary.health_warning)}
        />
        <Client360BentoMetric
          align="center"
          label={t("boards.client_360.summary_score_alert")}
          value={summary.health_score_alert}
          tone={summary.health_score_alert > 0 ? "danger" : "neutral"}
          emphasizeValue={summary.health_score_alert > 0}
          icon={AlertTriangle}
          onClick={clickable("score_alert", summary.health_score_alert)}
        />
        <Client360BentoMetric
          align="center"
          label={t("boards.client_360.summary_report_missing")}
          value={summary.report_missing}
          tone={summary.report_missing > 0 ? "warning" : "neutral"}
          emphasizeValue={summary.report_missing > 0}
          icon={FileWarning}
          onClick={clickable("report_missing", summary.report_missing)}
        />
        <Client360BentoMetric
          align="center"
          label={t("boards.client_360.summary_overdue")}
          value={summary.total_overdue}
          tone={summary.total_overdue > 0 ? "warning" : "neutral"}
          emphasizeValue={summary.total_overdue > 0}
          icon={Clock}
          onClick={clickable("overdue", summary.total_overdue)}
        />
        <Client360BentoMetric
          align="center"
          label={t("boards.client_360.summary_support")}
          value={summary.total_support_open}
          tone="neutral"
          icon={Headphones}
          onClick={clickable("support_open", summary.total_support_open)}
        />
      </div>
    </section>
  );
}
