import { memo, useEffect, useMemo } from "react";
import { useTranslation } from "@operoz/i18n";
import { Tooltip } from "@operoz/propel/tooltip";
import { cn } from "@operoz/utils";
import {
  buildClient360SparklinePath,
  CLIENT_360_SPARKLINE_HEIGHT,
  CLIENT_360_SPARKLINE_WIDTH,
  client360SparklineScores,
  client360SparklineStrokeClass,
  client360SparklineTrend,
  formatClient360SparklineWeekLabel,
} from "@/components/board/client-360/client-360-health-sparkline.utils";
import { useClient360HealthHistory } from "@/components/board/client-360/client-360-health-history-provider";

type Props = {
  projectId: string;
  className?: string;
};

export const Client360HealthSparkline = memo(function Client360HealthSparkline({ projectId, className }: Props) {
  const { t, currentLocale } = useTranslation();
  const { requestHistory, getHistory, revision } = useClient360HealthHistory();

  useEffect(() => {
    requestHistory(projectId);
  }, [projectId, requestHistory]);

  const entry = useMemo(() => getHistory(projectId), [getHistory, projectId, revision]);
  const scores = useMemo(() => client360SparklineScores(entry.history), [entry.history]);
  const path = useMemo(() => buildClient360SparklinePath(scores), [scores]);
  const trend = useMemo(() => client360SparklineTrend(scores), [scores]);
  const strokeClass = client360SparklineStrokeClass(trend);

  if (entry.status === "idle" || entry.status === "loading") {
    return <span className={cn("inline-block h-5 w-14 shrink-0 rounded-sm bg-layer-3/80", className)} aria-hidden />;
  }

  if (entry.status === "error" || scores.length === 0) {
    return (
      <span
        className={cn("inline-flex h-5 w-14 shrink-0 items-center justify-center text-11 text-tertiary", className)}
      >
        —
      </span>
    );
  }

  if (scores.length < 2 || !path) {
    return (
      <span
        className={cn("inline-flex h-5 w-14 shrink-0 items-center justify-center text-11 text-tertiary", className)}
      >
        —
      </span>
    );
  }

  const tooltipRows = [...entry.history].reverse().map((item) => ({
    label: formatClient360SparklineWeekLabel(item.period_start, currentLocale),
    score: item.health_score,
  }));

  const chart = (
    <svg
      width={CLIENT_360_SPARKLINE_WIDTH}
      height={CLIENT_360_SPARKLINE_HEIGHT}
      viewBox={`0 0 ${CLIENT_360_SPARKLINE_WIDTH} ${CLIENT_360_SPARKLINE_HEIGHT}`}
      className="shrink-0 overflow-visible"
      aria-hidden
    >
      <path
        d={path}
        fill="none"
        className={cn(strokeClass, "stroke-[1.5]")}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <Tooltip
      position="top"
      className="max-w-none px-3 py-2"
      tooltipHeading={t("boards.client_360.health_sparkline_tooltip_title")}
      tooltipContent={
        <ul className="space-y-1 text-12">
          {tooltipRows.map((row) => (
            <li key={`${row.label}-${row.score}`} className="flex items-center justify-between gap-4 tabular-nums">
              <span className="text-secondary">{row.label}</span>
              <span className="font-mono font-medium text-primary">{row.score}</span>
            </li>
          ))}
        </ul>
      }
    >
      <span className={cn("inline-flex cursor-default items-center", className)}>{chart}</span>
    </Tooltip>
  );
});
