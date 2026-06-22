import { Clock, FileText, Headphones, Layers, ListTodo } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import type { TClient360DetailResponse } from "@operis/types";
import { cn } from "@operis/utils";
import { Client360BentoMetric } from "@/components/board/client-360/client-360-bento";
import { reportCoverageLabelKey } from "@/components/board/client-360/client-360-utils";

export function Client360DetailKpiStrip({
  data,
  onMetricClick,
  embedded = false,
}: {
  data: TClient360DetailResponse;
  onMetricClick?: (key: "overdue" | "support" | "pending" | "reports") => void;
  /** Omits outer card chrome when nested in the command bar. */
  embedded?: boolean;
}) {
  const { t } = useTranslation();
  const reportKey = reportCoverageLabelKey(data.status_report.coverage);
  const reportTone =
    data.status_report.coverage === "complete"
      ? "success"
      : data.status_report.coverage === "partial"
        ? "warning"
        : data.status_report.coverage === "missing"
          ? "danger"
          : "neutral";

  const cols =
    data.status_report.modules_total > 0
      ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
      : "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div
      className={cn(
        "grid divide-y divide-subtle sm:divide-x sm:divide-y-0",
        cols,
        embedded ? "bg-transparent" : "shadow-xs overflow-hidden rounded-xl border border-subtle bg-layer-1"
      )}
    >
      <Client360BentoMetric
        align="center"
        label={t("boards.client_360.report_column")}
        value={t(reportKey)}
        tone={reportTone}
        valueVariant="status"
        icon={FileText}
      />
      <Client360BentoMetric
        align="center"
        label={t("boards.client_360.overdue_short")}
        value={data.issues.overdue}
        tone="danger"
        emphasizeValue={data.issues.overdue > 0}
        icon={Clock}
        onClick={data.issues.overdue > 0 ? () => onMetricClick?.("overdue") : undefined}
      />
      <Client360BentoMetric
        align="center"
        label={t("boards.client_360.support_short")}
        value={data.support.open_count}
        tone="info"
        emphasizeValue={data.support.open_count > 0}
        icon={Headphones}
        onClick={data.support.open_count > 0 ? () => onMetricClick?.("support") : undefined}
      />
      <Client360BentoMetric
        align="center"
        label={t("boards.overview_pending_kpi")}
        value={data.issues.pending}
        tone="accent"
        emphasizeValue={data.issues.pending > 0}
        icon={ListTodo}
        onClick={data.issues.pending > 0 ? () => onMetricClick?.("pending") : undefined}
      />
      {data.status_report.modules_total > 0 ? (
        <Client360BentoMetric
          align="center"
          label={t("boards.client_360.modules_published_short")}
          value={`${data.status_report.modules_published}/${data.status_report.modules_total}`}
          tone={data.status_report.modules_published >= data.status_report.modules_total ? "success" : "warning"}
          icon={Layers}
          onClick={() => onMetricClick?.("reports")}
        />
      ) : null}
    </div>
  );
}

export const Client360DetailKpiIcons = { Clock, FileText, Headphones, Layers, ListTodo };
