import type { TClient360Client, TClient360SummaryDelta } from "@operoz/types";

export function computeScopedSummaryDelta(clients: TClient360Client[]): TClient360SummaryDelta | undefined {
  const active = clients.filter((client) => client.period_compare?.available);
  if (active.length === 0) return undefined;

  return {
    health_critical: 0,
    health_warning: 0,
    report_missing:
      active.filter((client) => client.status_report.coverage === "missing").length -
      active.filter((client) => client.period_compare?.previous_report_coverage === "missing").length,
    total_overdue: active.reduce((sum, client) => sum + (client.period_compare?.overdue_delta ?? 0), 0),
    total_support_open: active.reduce((sum, client) => sum + (client.period_compare?.support_open_delta ?? 0), 0),
    health_score_alert: 0,
  };
}
