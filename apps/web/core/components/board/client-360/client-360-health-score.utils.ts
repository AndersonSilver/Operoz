import type { TClient360Health, TClient360HealthBreakdownItem, TClient360HealthDimension } from "@operis/types";
import type { Client360Tone } from "@/components/board/client-360/client-360-tokens";

export function client360HealthDimensionLabelKey(dimension: TClient360HealthDimension): string {
  switch (dimension) {
    case "report":
      return "boards.client_360.health_dim_report";
    case "overdue":
      return "boards.client_360.health_dim_overdue";
    case "support":
      return "boards.client_360.health_dim_support";
  }
}

export function client360HealthDimensionShortLabelKey(dimension: TClient360HealthDimension): string {
  switch (dimension) {
    case "report":
      return "boards.client_360.health_dim_short_report";
    case "overdue":
      return "boards.client_360.health_dim_short_overdue";
    case "support":
      return "boards.client_360.health_dim_short_support";
  }
}

export function client360HealthScoreTone(health: TClient360Health): Client360Tone {
  switch (health) {
    case "critical":
      return "danger";
    case "warning":
      return "warning";
    default:
      return "success";
  }
}

export function client360DimensionBarTone(score: number): Client360Tone {
  if (score >= 80) return "success";
  if (score >= 50) return "warning";
  return "danger";
}

export function client360WeightedContribution(item: TClient360HealthBreakdownItem): number {
  return Math.round((item.score * item.weight) / 100);
}

export function client360BreakdownWeightedSum(breakdown: TClient360HealthBreakdownItem[]): number {
  return breakdown.reduce((sum, item) => sum + client360WeightedContribution(item), 0);
}

export function hasClient360HealthScoreData(
  healthScore: number | undefined,
  breakdown: TClient360HealthBreakdownItem[] | undefined
): breakdown is TClient360HealthBreakdownItem[] {
  return typeof healthScore === "number" && Array.isArray(breakdown) && breakdown.length > 0;
}

export type HealthExplainerWhyInsight = {
  dimension: TClient360HealthDimension;
  score: number;
  weight: number;
  contribution: number;
  detail: string;
  tone: Client360Tone;
};

export type HealthExplainerWhy = {
  primaryDrag: HealthExplainerWhyInsight | null;
  positive: HealthExplainerWhyInsight[];
  weightedSum: number;
};

export function buildHealthExplainerWhy(breakdown: TClient360HealthBreakdownItem[]): HealthExplainerWhy {
  const insights: HealthExplainerWhyInsight[] = breakdown.map((item) => ({
    dimension: item.dimension,
    score: item.score,
    weight: item.weight,
    contribution: client360WeightedContribution(item),
    detail: item.detail ?? "",
    tone: client360DimensionBarTone(item.score),
  }));

  const weightedSum = insights.reduce((sum, item) => sum + item.contribution, 0);
  const drags = insights
    .filter((item) => item.score < 80)
    .sort((a, b) => a.contribution - b.contribution || b.weight - a.weight);
  const positive = insights
    .filter((item) => item.score >= 80 && item.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution);

  return {
    primaryDrag: drags[0] ?? null,
    positive,
    weightedSum,
  };
}
