import { useTranslation } from "@operis/i18n";
import { Tooltip } from "@operis/propel/tooltip";
import type { TClient360Health, TClient360HealthBreakdownItem } from "@operis/types";
import { cn } from "@operis/utils";
import { Client360HealthBadge } from "@/components/board/client-360/client-360-health-badge";
import { Client360HealthBreakdownTooltipContent } from "@/components/board/client-360/client-360-health-breakdown";

type Props = {
  health: TClient360Health;
  healthScore?: number;
  healthBreakdown?: TClient360HealthBreakdownItem[];
  className?: string;
  showScore?: boolean;
};

export function Client360HealthScoreBadge({
  health,
  healthScore,
  healthBreakdown,
  className,
  showScore = true,
}: Props) {
  const { t } = useTranslation();

  if (!showScore || typeof healthScore !== "number" || !healthBreakdown?.length) {
    return <Client360HealthBadge health={health} className={className} />;
  }

  const score = healthScore;
  const breakdownItems = healthBreakdown;

  const content = (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border border-subtle bg-layer-2 px-2 py-0.5",
        className
      )}
    >
      <Client360HealthBadge health={health} className="border-0 bg-transparent p-0" />
      {showScore ? <span className="font-mono text-11 font-semibold text-secondary tabular-nums">{score}</span> : null}
    </span>
  );

  return (
    <Tooltip
      position="top"
      className="max-w-none px-3 py-2"
      tooltipHeading={t("boards.client_360.health_score_tooltip_title", { score })}
      tooltipContent={<Client360HealthBreakdownTooltipContent healthScore={score} breakdown={breakdownItems} />}
    >
      <span className="inline-flex cursor-default">{content}</span>
    </Tooltip>
  );
}
