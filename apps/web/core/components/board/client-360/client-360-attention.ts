import type { TClient360Client } from "@operoz/types";

import type { Client360FilterKey } from "@/components/board/client-360/client-360-client-filters";
import type { Client360Tone } from "@/components/board/client-360/client-360-tokens";

export type Client360AttentionReason = "critical" | "score_alert" | "report_missing" | "overdue" | "support_open";

export type Client360AttentionItem = {
  projectId: string;
  clientName: string;
  boardName?: string;
  reason: Client360AttentionReason;
  filterKey: Client360FilterKey;
  tone: Client360Tone;
  sortPriority: number;
  metric?: number;
};

const REASON_META: Record<
  Client360AttentionReason,
  { filterKey: Client360FilterKey; tone: Client360Tone; sortPriority: number }
> = {
  critical: { filterKey: "critical", tone: "danger", sortPriority: 0 },
  score_alert: { filterKey: "score_alert", tone: "danger", sortPriority: 1 },
  report_missing: { filterKey: "report_missing", tone: "warning", sortPriority: 2 },
  overdue: { filterKey: "overdue", tone: "warning", sortPriority: 3 },
  support_open: { filterKey: "support_open", tone: "info", sortPriority: 4 },
};

function resolveAttentionReason(client: TClient360Client): Client360AttentionReason | null {
  if (client.health === "critical") return "critical";
  if (client.health_score_alert) return "score_alert";
  if (client.status_report.coverage === "missing") return "report_missing";
  if (client.issues.overdue > 0) return "overdue";
  if (client.support.open_count > 0) return "support_open";
  return null;
}

function metricForReason(client: TClient360Client, reason: Client360AttentionReason): number | undefined {
  switch (reason) {
    case "overdue":
      return client.issues.overdue;
    case "support_open":
      return client.support.open_count;
    case "score_alert":
      return client.score_alert_threshold;
    default:
      return undefined;
  }
}

export function buildClient360AttentionItems(clients: TClient360Client[], limit = 8): Client360AttentionItem[] {
  const items: Client360AttentionItem[] = [];

  for (const client of clients) {
    const reason = resolveAttentionReason(client);
    if (!reason) continue;

    const meta = REASON_META[reason];
    items.push({
      projectId: client.project_id,
      clientName: client.name,
      boardName: client.board?.name,
      reason,
      filterKey: meta.filterKey,
      tone: meta.tone,
      sortPriority: meta.sortPriority,
      metric: metricForReason(client, reason),
    });
  }

  items.sort((a, b) => {
    if (a.sortPriority !== b.sortPriority) return a.sortPriority - b.sortPriority;
    return (b.metric ?? 0) - (a.metric ?? 0);
  });

  return items.slice(0, limit);
}

const ATTENTION_FILTER_ORDER: Client360FilterKey[] = [
  "critical",
  "score_alert",
  "report_missing",
  "overdue",
  "support_open",
];

export function client360AttentionFilterKeys(items: Client360AttentionItem[]): Client360FilterKey[] {
  const keys = new Set(items.map((item) => item.filterKey));
  return ATTENTION_FILTER_ORDER.filter((key) => keys.has(key));
}
