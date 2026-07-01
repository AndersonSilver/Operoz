import type { TClient360HealthHistoryItem } from "@operoz/types";

export type Client360SparklineTrend = "up" | "down" | "flat";

export const CLIENT_360_SPARKLINE_WIDTH = 56;
export const CLIENT_360_SPARKLINE_HEIGHT = 20;

export function client360SparklineScores(history: TClient360HealthHistoryItem[]): number[] {
  return history.map((item) => item.health_score);
}

export function client360SparklineTrend(scores: number[]): Client360SparklineTrend {
  if (scores.length < 2) return "flat";
  const delta = scores[scores.length - 1] - scores[0];
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

export function client360SparklineStrokeClass(trend: Client360SparklineTrend): string {
  if (trend === "up") return "stroke-success-primary";
  if (trend === "down") return "stroke-danger-primary";
  return "stroke-tertiary";
}

/** SVG path for scores left-to-right (oldest → newest). */
export function buildClient360SparklinePath(
  scores: number[],
  width: number = CLIENT_360_SPARKLINE_WIDTH,
  height: number = CLIENT_360_SPARKLINE_HEIGHT
): string {
  if (scores.length < 2) return "";

  const padding = 2;
  const innerHeight = height - padding * 2;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;
  const step = width / (scores.length - 1);

  return scores
    .map((score, index) => {
      const x = index * step;
      const y = padding + innerHeight - ((score - min) / range) * innerHeight;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function formatClient360SparklineWeekLabel(periodStart: string, locale: string): string {
  const date = new Date(`${periodStart}T12:00:00`);
  if (Number.isNaN(date.getTime())) return periodStart;
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(date);
}
