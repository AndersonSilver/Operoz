import type {
  TClient360Client,
  TClient360Summary,
  TClient360SupportAnalytics,
  TClient360SupportAnalyticsCriticality,
  TClient360SupportMetricBucket,
} from "@operis/types";

export const SUPPORT_ANALYTICS_CRITICALITY_ORDER: TClient360SupportAnalyticsCriticality[] = [
  "p0",
  "p1",
  "p2",
  "p3",
  "p4",
  "not_incident",
  "unknown",
];

export type Client360SupportPortfolioStats = {
  totalOpen: number;
  totalOverdue: number;
  clientsWithOpen: number;
  clientsWithSlaBreach: number;
  totalSlaBreaches: number;
  distribution: {
    clean: number;
    open: number;
    breach: number;
  };
};

export function computeSupportPortfolioStats(clients: TClient360Client[]): Client360SupportPortfolioStats {
  let totalOpen = 0;
  let totalOverdue = 0;
  let clientsWithOpen = 0;
  let clientsWithSlaBreach = 0;
  let totalSlaBreaches = 0;
  let clean = 0;
  let openOnly = 0;
  let breach = 0;

  for (const client of clients) {
    const open = client.support.open_count;
    const overdue = client.support.overdue_count;
    const slaBreached = client.support_sla?.breached ?? false;
    const breachCount = client.support_sla?.breach_count ?? 0;

    totalOpen += open;
    totalOverdue += overdue;

    if (open > 0) clientsWithOpen += 1;
    if (slaBreached) {
      clientsWithSlaBreach += 1;
      totalSlaBreaches += breachCount;
      breach += 1;
    } else if (open > 0) {
      openOnly += 1;
    } else {
      clean += 1;
    }
  }

  return {
    totalOpen,
    totalOverdue,
    clientsWithOpen,
    clientsWithSlaBreach,
    totalSlaBreaches,
    distribution: { clean, open: openOnly, breach },
  };
}

export function mergeSupportSummary(
  summary: TClient360Summary,
  stats: Client360SupportPortfolioStats
): TClient360Summary {
  return {
    ...summary,
    total_support_open: stats.totalOpen,
    support_sla_breach: stats.clientsWithSlaBreach,
  };
}

export function formatSupportMetricDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  if (hours < 48) return restMinutes > 0 ? `${hours}h ${restMinutes}min` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours > 0 ? `${days}d ${restHours}h` : `${days}d`;
}

export function hasSupportAnalyticsData(analytics?: TClient360SupportAnalytics | null): boolean {
  if (!analytics) return false;
  return SUPPORT_ANALYTICS_CRITICALITY_ORDER.some(
    (criticality) => (analytics.by_criticality[criticality]?.count ?? 0) > 0
  );
}

export function buildSupportAnalyticsRows(
  analytics: TClient360SupportAnalytics | undefined,
  clients: TClient360Client[]
): Array<{
  key: string;
  isPortfolio: boolean;
  clientLabel: string;
  criticality: TClient360SupportAnalyticsCriticality;
  bucket: TClient360SupportMetricBucket;
}> {
  if (!analytics) return [];

  const clientNameById = new Map(clients.map((client) => [client.project_id, client.name]));
  const rows: Array<{
    key: string;
    isPortfolio: boolean;
    clientLabel: string;
    criticality: TClient360SupportAnalyticsCriticality;
    bucket: TClient360SupportMetricBucket;
  }> = [];

  for (const criticality of SUPPORT_ANALYTICS_CRITICALITY_ORDER) {
    const bucket = analytics.by_criticality[criticality];
    if (!bucket?.count) continue;
    rows.push({
      key: `portfolio-${criticality}`,
      isPortfolio: true,
      clientLabel: "",
      criticality,
      bucket,
    });
  }

  for (const [projectId, buckets] of Object.entries(analytics.by_client)) {
    const clientLabel = clientNameById.get(projectId) ?? projectId;
    for (const criticality of SUPPORT_ANALYTICS_CRITICALITY_ORDER) {
      const bucket = buckets[criticality];
      if (!bucket?.count) continue;
      rows.push({
        key: `${projectId}-${criticality}`,
        isPortfolio: false,
        clientLabel,
        criticality,
        bucket,
      });
    }
  }

  return rows;
}
