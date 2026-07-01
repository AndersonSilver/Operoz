import { useTranslation } from "@operoz/i18n";
import type { TClient360Health, TClient360HealthDimension, TClient360HealthDimensionItem } from "@operoz/types";
import { Tooltip } from "@operoz/propel/tooltip";
import { cn } from "@operoz/utils";
import { CLIENT_360_TONE } from "@/components/board/client-360/client-360-tokens";
import {
  client360HealthDimensionLabelKey,
  client360HealthDimensionShortLabelKey,
  client360HealthScoreTone,
} from "@/components/board/client-360/client-360-health-score.utils";

type Props = {
  dimensions: TClient360HealthDimensionItem[];
  compact?: boolean;
  className?: string;
};

function healthStateLabelKey(health: TClient360Health): string {
  switch (health) {
    case "critical":
      return "boards.client_360.health_critical";
    case "warning":
      return "boards.client_360.health_warning";
    default:
      return "boards.client_360.health_ok";
  }
}

function DimensionChip({ item, compact }: { item: TClient360HealthDimensionItem; compact?: boolean }) {
  const { t } = useTranslation();
  const tone = client360HealthScoreTone(item.health);
  const token = CLIENT_360_TONE[tone];
  const labelKey = compact
    ? client360HealthDimensionShortLabelKey(item.dimension)
    : client360HealthDimensionLabelKey(item.dimension);

  const chip = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border border-subtle bg-layer-2 font-medium text-secondary",
        compact ? "px-1.5 py-0.5 text-10" : "px-2 py-0.5 text-11"
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", token.dot)} aria-hidden />
      <span>{t(labelKey)}</span>
    </span>
  );

  return (
    <Tooltip
      position="top"
      tooltipHeading={t(client360HealthDimensionLabelKey(item.dimension))}
      tooltipContent={
        <span className="text-12 tabular-nums">
          {item.score}/100 · {t(healthStateLabelKey(item.health))}
        </span>
      }
    >
      <span className="inline-flex cursor-default">{chip}</span>
    </Tooltip>
  );
}

const DIMENSION_ORDER: TClient360HealthDimension[] = ["report", "overdue", "support"];

export function Client360HealthDimensionChips({ dimensions, compact = false, className }: Props) {
  if (!dimensions.length) return null;

  const ordered = DIMENSION_ORDER.map((dimension) => dimensions.find((item) => item.dimension === dimension)).filter(
    (item): item is TClient360HealthDimensionItem => item != null
  );

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1", className)}>
      {ordered.map((item) => (
        <DimensionChip key={item.dimension} item={item} compact={compact} />
      ))}
    </span>
  );
}
