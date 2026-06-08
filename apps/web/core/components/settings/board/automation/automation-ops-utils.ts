export type AutomationMetricGroup = "dispatch" | "outbox" | "runs" | "resilience";

export type AutomationMetricVariant = "success" | "warning" | "danger" | "accent" | "purple" | "neutral";

export type ParsedAutomationMetric = {
  rawKey: string;
  baseKey: string;
  reason?: string;
  value: number;
  group: AutomationMetricGroup;
  variant: AutomationMetricVariant;
};

const METRIC_META: Record<
  string,
  { group: AutomationMetricGroup; variant: AutomationMetricVariant }
> = {
  dispatch_rules_matched: { group: "dispatch", variant: "accent" },
  dispatch_rules_skipped: { group: "dispatch", variant: "neutral" },
  dispatch_blocked: { group: "dispatch", variant: "warning" },
  outbox_scheduled: { group: "outbox", variant: "accent" },
  outbox_enqueued: { group: "outbox", variant: "success" },
  outbox_enqueue_failed: { group: "outbox", variant: "danger" },
  outbox_flush_recovered: { group: "outbox", variant: "warning" },
  run_success: { group: "runs", variant: "success" },
  run_failed: { group: "runs", variant: "danger" },
  run_skipped: { group: "runs", variant: "warning" },
  run_filtered: { group: "runs", variant: "warning" },
  run_exception: { group: "runs", variant: "danger" },
  run_circuit_open: { group: "runs", variant: "warning" },
  run_duplicate_skipped: { group: "runs", variant: "neutral" },
  run_rule_not_found: { group: "runs", variant: "neutral" },
  run_rule_disabled: { group: "runs", variant: "neutral" },
  run_duration_ms: { group: "runs", variant: "purple" },
  dlq_persisted: { group: "resilience", variant: "danger" },
};

export const METRIC_GROUP_ORDER: AutomationMetricGroup[] = ["dispatch", "outbox", "runs", "resilience"];

export function parseAutomationMetrics(metrics: Record<string, number>): ParsedAutomationMetric[] {
  const parsed: ParsedAutomationMetric[] = [];

  for (const [rawKey, value] of Object.entries(metrics)) {
    const [baseKey, ...labelParts] = rawKey.split(":");
    const reasonPart = labelParts.find((part) => part.startsWith("reason="));
    const reason = reasonPart?.replace("reason=", "");
    const meta = METRIC_META[baseKey] ?? { group: "runs" as const, variant: "neutral" as const };

    parsed.push({
      rawKey,
      baseKey,
      reason,
      value,
      group: meta.group,
      variant: meta.variant,
    });
  }

  return parsed.sort((a, b) => {
    const groupDiff =
      METRIC_GROUP_ORDER.indexOf(a.group) - METRIC_GROUP_ORDER.indexOf(b.group);
    if (groupDiff !== 0) return groupDiff;
    return b.value - a.value;
  });
}

export function formatMetricValue(value: number, baseKey: string): string {
  if (baseKey === "run_duration_ms") {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}s`;
    return `${value}ms`;
  }
  return value.toLocaleString();
}

export function secretRefSyntax(key: string): string {
  return `{{secret:${key}}}`;
}
