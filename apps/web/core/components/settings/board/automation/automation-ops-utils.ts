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

const METRIC_META: Record<string, { group: AutomationMetricGroup; variant: AutomationMetricVariant }> = {
  dispatch_rules_matched: { group: "dispatch", variant: "accent" },
  dispatch_rules_skipped: { group: "dispatch", variant: "neutral" },
  dispatch_blocked: { group: "dispatch", variant: "warning" },
  schedule_dispatched: { group: "dispatch", variant: "accent" },
  schedule_dispatch_failed: { group: "dispatch", variant: "danger" },
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
  run_rule_unpublished: { group: "runs", variant: "warning" },
  run_duration_ms: { group: "runs", variant: "purple" },
  dlq_persisted: { group: "resilience", variant: "danger" },
};

/** Já representados no funil operacional ou nos gráficos de execução. */
export const PIPELINE_METRIC_KEYS = new Set([
  "dispatch_rules_matched",
  "outbox_scheduled",
  "outbox_enqueued",
  "run_success",
]);

const ALERT_METRIC_KEYS = new Set([
  "dispatch_blocked",
  "dispatch_rules_skipped",
  "schedule_dispatch_failed",
  "outbox_enqueue_failed",
  "run_failed",
  "run_skipped",
  "run_filtered",
  "run_exception",
  "run_circuit_open",
  "run_duplicate_skipped",
  "run_rule_not_found",
  "run_rule_disabled",
  "run_rule_unpublished",
  "dlq_persisted",
]);

export const METRIC_GROUP_ORDER: AutomationMetricGroup[] = ["dispatch", "outbox", "runs", "resilience"];

function parseMetricEntry(rawKey: string, value: number): ParsedAutomationMetric | null {
  if (value <= 0) return null;

  const [baseKey, ...labelParts] = rawKey.split(":");
  const reasonPart = labelParts.find((part) => part.startsWith("reason="));
  const reason = reasonPart?.replace("reason=", "");
  const meta = METRIC_META[baseKey] ?? { group: "runs" as const, variant: "neutral" as const };

  return {
    rawKey,
    baseKey,
    reason,
    value,
    group: meta.group,
    variant: meta.variant,
  };
}

/** Agrega durações por regra num único contador legível. */
export function normalizeAutomationMetrics(metrics: Record<string, number>): Record<string, number> {
  const normalized: Record<string, number> = {};
  let durationTotal = 0;

  for (const [rawKey, value] of Object.entries(metrics)) {
    if (value <= 0) continue;
    const [baseKey] = rawKey.split(":");
    if (baseKey === "run_duration_ms") {
      durationTotal += value;
      continue;
    }
    normalized[rawKey] = value;
  }

  if (durationTotal > 0) {
    normalized.run_duration_ms = durationTotal;
  }

  return normalized;
}

export function parseAutomationMetrics(metrics: Record<string, number>): ParsedAutomationMetric[] {
  const parsed: ParsedAutomationMetric[] = [];

  for (const [rawKey, value] of Object.entries(normalizeAutomationMetrics(metrics))) {
    const entry = parseMetricEntry(rawKey, value);
    if (entry) parsed.push(entry);
  }

  return parsed.sort((a, b) => {
    const groupDiff = METRIC_GROUP_ORDER.indexOf(a.group) - METRIC_GROUP_ORDER.indexOf(b.group);
    if (groupDiff !== 0) return groupDiff;
    return b.value - a.value;
  });
}

export function getOperationalSignals(metrics: Record<string, number>): {
  alerts: ParsedAutomationMetric[];
  info: ParsedAutomationMetric[];
} {
  const parsed = parseAutomationMetrics(metrics);
  const alerts: ParsedAutomationMetric[] = [];
  const info: ParsedAutomationMetric[] = [];

  for (const item of parsed) {
    if (PIPELINE_METRIC_KEYS.has(item.baseKey)) continue;

    if (ALERT_METRIC_KEYS.has(item.baseKey) || item.variant === "danger") {
      alerts.push(item);
      continue;
    }

    info.push(item);
  }

  return { alerts, info };
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
