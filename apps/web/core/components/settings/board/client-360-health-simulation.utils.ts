import type {
  IHealthScoreThresholds,
  IHealthScoreWeights,
  TClient360Client,
  TClient360Health,
  TClient360ReportCoverage,
} from "@operis/types";

export type Client360HealthSimulationRow = {
  projectId: string;
  name: string;
  identifier: string;
  currentScore: number;
  currentHealth: TClient360Health;
  simulatedScore: number;
  simulatedHealth: TClient360Health;
  delta: number;
  healthChanged: boolean;
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function healthFromScore(score: number, thresholds: IHealthScoreThresholds): TClient360Health {
  if (score >= thresholds.ok_min) return "ok";
  if (score >= thresholds.warning_min) return "warning";
  return "critical";
}

export function recomputeHealthFromBreakdown(
  client: Pick<TClient360Client, "health_breakdown" | "status_report" | "issues" | "support">,
  weights: IHealthScoreWeights,
  thresholds: IHealthScoreThresholds
): { score: number; health: TClient360Health } {
  const scores = new Map(client.health_breakdown.map((item) => [item.dimension, item.score]));
  const reportScore = scores.get("report") ?? 0;
  const overdueScore = scores.get("overdue") ?? 0;
  const supportScore = scores.get("support") ?? 0;

  let score = clampScore(
    (reportScore * weights.report + overdueScore * weights.overdue + supportScore * weights.support) / 100
  );

  const coverage = client.status_report.coverage as TClient360ReportCoverage;
  const modulesTotal = client.status_report.modules_total;
  const overdueIssues = client.issues.overdue;
  const supportOverdue = client.support.overdue_count;

  if (coverage === "missing" && modulesTotal > 0) {
    score = Math.min(score, 40);
  }
  if (overdueIssues >= 5) {
    score = Math.min(score, 35);
  }
  if (supportOverdue > 0) {
    score = Math.min(score, 35);
  }

  return { score, health: healthFromScore(score, thresholds) };
}

export function simulateBoardHealthScores(
  clients: TClient360Client[],
  weights: IHealthScoreWeights,
  thresholds: IHealthScoreThresholds
): Client360HealthSimulationRow[] {
  const rows = clients.map((client) => {
    const simulated = recomputeHealthFromBreakdown(client, weights, thresholds);
    return {
      projectId: client.project_id,
      name: client.name,
      identifier: client.identifier,
      currentScore: client.health_score,
      currentHealth: client.health,
      simulatedScore: simulated.score,
      simulatedHealth: simulated.health,
      delta: simulated.score - client.health_score,
      healthChanged: simulated.health !== client.health,
    };
  });

  return rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

export function weightsEqual(a: IHealthScoreWeights, b: IHealthScoreWeights): boolean {
  return a.report === b.report && a.overdue === b.overdue && a.support === b.support;
}
