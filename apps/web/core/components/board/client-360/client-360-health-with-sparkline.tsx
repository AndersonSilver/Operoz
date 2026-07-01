import type {
  TClient360Client,
  TClient360Health,
  TClient360HealthBreakdownItem,
  TClient360HealthDimensionItem,
} from "@operoz/types";
import { Client360HealthScoreBadge } from "@/components/board/client-360/client-360-health-score-badge";
import { Client360HealthScoreAlertBadge } from "@/components/board/client-360/client-360-health-score-alert-badge";
import { Client360HealthDimensionChips } from "@/components/board/client-360/client-360-health-dimension-chips";
import { Client360HealthSparkline } from "@/components/board/client-360/client-360-health-sparkline";

type Props = {
  health: TClient360Health;
  healthScore?: number;
  healthBreakdown?: TClient360HealthBreakdownItem[];
  healthDimensions?: TClient360HealthDimensionItem[];
  healthScoreAlert?: boolean;
  scoreAlertThreshold?: number;
  projectId: string;
  showSparkline?: boolean;
  showDimensionChips?: boolean;
  showHealthScore?: boolean;
  className?: string;
};

export function Client360HealthWithSparkline({
  health,
  healthScore,
  healthBreakdown,
  healthDimensions,
  healthScoreAlert = false,
  scoreAlertThreshold = 40,
  projectId,
  showSparkline = false,
  showDimensionChips = true,
  showHealthScore = false,
  className,
}: Props) {
  const hasDimensions = showHealthScore && showDimensionChips && (healthDimensions?.length ?? 0) > 0;

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Client360HealthScoreBadge
        health={health}
        healthScore={healthScore}
        healthBreakdown={healthBreakdown}
        className={className}
        showScore={showHealthScore}
      />
      {hasDimensions ? <Client360HealthDimensionChips dimensions={healthDimensions!} compact /> : null}
      {healthScoreAlert && showHealthScore ? (
        <Client360HealthScoreAlertBadge scoreAlertThreshold={scoreAlertThreshold} />
      ) : null}
      {showSparkline ? <Client360HealthSparkline projectId={projectId} /> : null}
    </span>
  );
}

export function Client360ClientHealthWithSparkline({
  client,
  showSparkline = false,
  showDimensionChips = true,
  showHealthScore = false,
}: {
  client: TClient360Client;
  showSparkline?: boolean;
  showDimensionChips?: boolean;
  showHealthScore?: boolean;
}) {
  return (
    <Client360HealthWithSparkline
      health={client.health}
      healthScore={client.health_score}
      healthBreakdown={client.health_breakdown}
      healthDimensions={client.health_dimensions}
      healthScoreAlert={client.health_score_alert}
      scoreAlertThreshold={client.score_alert_threshold}
      projectId={client.project_id}
      showSparkline={showHealthScore && showSparkline}
      showDimensionChips={showDimensionChips}
      showHealthScore={showHealthScore}
    />
  );
}
