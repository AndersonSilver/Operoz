import { Activity, ChevronDown } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import type { TClient360Health, TClient360HealthBreakdownItem, TClient360HealthDimensionItem } from "@operis/types";
import { cn } from "@operis/utils";
import { CLIENT_360_TONE } from "@/components/board/client-360/client-360-tokens";
import { Client360HealthDimensionChips } from "@/components/board/client-360/client-360-health-dimension-chips";
import { useClient360DetailSection } from "@/components/board/client-360/client-360-detail-section-context";
import { useClient360SectionOpen } from "@/components/board/client-360/use-client-360-section-open";
import {
  client360BreakdownWeightedSum,
  client360DimensionBarTone,
  client360HealthDimensionLabelKey,
  client360HealthScoreTone,
  client360WeightedContribution,
} from "@/components/board/client-360/client-360-health-score.utils";

type BreakdownProps = {
  health: TClient360Health;
  healthScore: number;
  breakdown: TClient360HealthBreakdownItem[];
  healthDimensions?: TClient360HealthDimensionItem[];
  className?: string;
};

function BreakdownBar({ item, showDetail = true }: { item: TClient360HealthBreakdownItem; showDetail?: boolean }) {
  const { t } = useTranslation();
  const tone = client360DimensionBarTone(item.score);
  const barColor = CLIENT_360_TONE[tone].bar;
  const contribution = client360WeightedContribution(item);

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
        <span className="text-12 font-medium text-primary">{t(client360HealthDimensionLabelKey(item.dimension))}</span>
        <span className="font-mono text-11 text-tertiary">
          {item.score}/100 · {item.weight}% · +{contribution}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-layer-2">
        <div
          className="h-full rounded-full transition-[width] duration-300"
          style={{ width: `${item.score}%`, backgroundColor: barColor }}
          role="progressbar"
          aria-valuenow={item.score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={t(client360HealthDimensionLabelKey(item.dimension))}
        />
      </div>
      {showDetail && item.detail ? <p className="text-11 leading-snug text-tertiary">{item.detail}</p> : null}
    </div>
  );
}

export function Client360HealthBreakdownTooltipContent({
  healthScore,
  breakdown,
}: {
  healthScore: number;
  breakdown: TClient360HealthBreakdownItem[];
}) {
  const { t } = useTranslation();
  const weightedSum = client360BreakdownWeightedSum(breakdown);

  return (
    <div className="w-56 space-y-3 py-0.5">
      <p className="text-11 text-tertiary">
        {t("boards.client_360.health_breakdown_weighted_sum", { sum: weightedSum })}
      </p>
      <div className="space-y-3">
        {breakdown.map((item) => (
          <BreakdownBar key={item.dimension} item={item} showDetail={false} />
        ))}
      </div>
      {weightedSum !== healthScore ? (
        <p className="text-10 text-tertiary">{t("boards.client_360.health_breakdown_capped_note")}</p>
      ) : null}
    </div>
  );
}

export function Client360HealthBreakdownPanel({
  health,
  healthScore,
  breakdown,
  className,
  compact,
}: BreakdownProps & { compact?: boolean }) {
  const { t } = useTranslation();
  const scoreTone = client360HealthScoreTone(health);
  const weightedSum = client360BreakdownWeightedSum(breakdown);
  const scoreColor = CLIENT_360_TONE[scoreTone].icon;

  return (
    <div className={cn(compact ? "px-0 py-0" : "px-4 py-4", className)}>
      <div
        className={cn(
          "flex flex-col gap-3",
          compact ? "sm:flex-row sm:items-center sm:justify-between" : "sm:flex-row sm:items-start sm:justify-between"
        )}
      >
        <div className="flex items-end gap-2">
          <span
            className={cn(
              "font-mono leading-none font-semibold tabular-nums",
              compact ? "text-28" : "text-36",
              scoreColor
            )}
          >
            {healthScore}
          </span>
          <span className={cn("text-tertiary", compact ? "pb-0.5 text-12" : "pb-1 text-13")}>/100</span>
        </div>
        {!compact ? (
          <div className="text-12 text-tertiary sm:text-right">
            <p>{t("boards.client_360.health_breakdown_weighted_sum", { sum: weightedSum })}</p>
            {weightedSum !== healthScore ? (
              <p className="mt-0.5 text-11">{t("boards.client_360.health_breakdown_capped_note")}</p>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className={cn(compact ? "mt-3 space-y-2.5" : "mt-5 space-y-4")}>
        {breakdown.map((item) => (
          <BreakdownBar key={item.dimension} item={item} showDetail={!compact} />
        ))}
      </div>
    </div>
  );
}

export function Client360HealthBreakdownSection({ health, healthScore, breakdown, healthDimensions }: BreakdownProps) {
  const { t } = useTranslation();
  const { collapsible, defaultOpen, collapseScope } = useClient360DetailSection("health-breakdown");
  const storageKey = collapseScope ? `${collapseScope}:health-breakdown` : undefined;
  const { open, toggle } = useClient360SectionOpen(storageKey, defaultOpen);

  return (
    <section className="rounded-md border border-subtle bg-layer-1">
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 border-b border-subtle px-4 py-3",
          collapsible && "cursor-pointer select-none hover:bg-layer-transparent-hover"
        )}
        role={collapsible ? "button" : undefined}
        tabIndex={collapsible ? 0 : undefined}
        aria-expanded={collapsible ? open : undefined}
        onClick={collapsible ? toggle : undefined}
        onKeyDown={
          collapsible
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggle();
                }
              }
            : undefined
        }
      >
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-sm bg-layer-2">
            <Activity className="size-3.5 text-accent-primary" strokeWidth={1.75} />
          </span>
          <h2 className="text-13 font-semibold text-primary">{t("boards.client_360.health_breakdown_title")}</h2>
        </div>
        <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
          {healthDimensions?.length ? <Client360HealthDimensionChips dimensions={healthDimensions} /> : null}
          {collapsible ? (
            <ChevronDown
              className={cn("size-4 text-tertiary transition-transform", !open && "-rotate-90")}
              strokeWidth={1.75}
              aria-hidden
            />
          ) : null}
        </div>
      </div>
      {(!collapsible || open) && (
        <Client360HealthBreakdownPanel health={health} healthScore={healthScore} breakdown={breakdown} />
      )}
    </section>
  );
}

export function Client360HealthBreakdownSkeleton({ className }: { className?: string }) {
  return (
    <section className={cn("animate-pulse rounded-md border border-subtle bg-layer-1", className)}>
      <div className="border-b border-subtle px-4 py-3">
        <div className="h-4 w-40 rounded-sm bg-layer-2" />
      </div>
      <div className="space-y-4 px-4 py-4">
        <div className="h-10 w-24 rounded-sm bg-layer-2" />
        {[0, 1, 2].map((key) => (
          <div key={key} className="space-y-2">
            <div className="h-3 w-full rounded-sm bg-layer-2" />
            <div className="h-2 w-full rounded-full bg-layer-2" />
          </div>
        ))}
      </div>
    </section>
  );
}
