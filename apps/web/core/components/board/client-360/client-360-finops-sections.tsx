import { AlertTriangle, Banknote, DollarSign, Gauge, TrendingDown, TrendingUp, Users } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import type { TClient360FinopsPayload } from "@operoz/types";
import { cn } from "@operoz/utils";
import {
  Client360BentoGrid,
  Client360BentoMetric,
  Client360BentoTile,
} from "@/components/board/client-360/client-360-bento";
import { Client360FinopsMeter } from "@/components/board/client-360/client-360-finops-meter";
import { Client360FinopsProfileForm } from "@/components/board/client-360/client-360-finops-profile-form";
import type { Client360Tone } from "@/components/board/client-360/client-360-tokens";
import { formatClient360Currency } from "@/components/board/client-360/client-360-utils";

type Props = {
  workspaceSlug: string;
  projectId: string;
  finops: TClient360FinopsPayload;
  onFinopsSaved?: () => void;
};

function formatVariancePct(value: number): string {
  return `${value > 0 ? "+" : ""}${value}%`;
}

function forecastRunwayKey(finops: TClient360FinopsPayload): "indeterminate" | "ok" {
  return finops.forecast.status === "indeterminate" ? "indeterminate" : "ok";
}

export function Client360FinopsSections({ workspaceSlug, projectId, finops, onFinopsSaved }: Props) {
  const { t } = useTranslation();

  const marginTone: Client360Tone =
    finops.margin_pct != null && finops.margin_pct < 15 ? "danger" : finops.margin_pct != null ? "success" : "neutral";

  const varianceTone: Client360Tone =
    finops.budget_variance_pct != null && Math.abs(finops.budget_variance_pct) > 10
      ? "danger"
      : finops.budget_variance_pct != null && finops.budget_variance_pct !== 0
        ? "warning"
        : "neutral";

  const utilizationTone: Client360Tone = finops.utilization?.over_allocated
    ? "danger"
    : finops.utilization?.pct != null && finops.utilization.pct > 85
      ? "warning"
      : "neutral";

  const hasBudget = finops.budget_planned != null || finops.budget_actual != null;
  const hasCapacity =
    finops.utilization != null && (finops.utilization.hours_allocated > 0 || finops.utilization.capacity_hours > 0);

  const forecastWeeks =
    finops.forecast.status === "indeterminate"
      ? null
      : (finops.forecast.weeks ?? finops.forward_capacity.weeks_to_clear);

  const runwayDays = forecastWeeks != null ? Math.max(1, Math.round(forecastWeeks * 5)) : null;

  const budgetMax = Math.max(finops.budget_planned ?? 0, finops.budget_actual ?? 0, 1);
  const plannedPct = ((finops.budget_planned ?? 0) / budgetMax) * 100;
  const actualPct = ((finops.budget_actual ?? 0) / budgetMax) * 100;

  const capacityPct = finops.utilization?.pct ?? 0;

  const forecastRunwayPct =
    forecastWeeks != null ? Math.min((forecastWeeks / 12) * 100, 100) : finops.backlog_points > 0 ? 8 : 0;

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      {finops.finops_alert ? (
        <div
          className="flex items-start gap-2.5 rounded-xl border border-danger-subtle bg-danger-subtle/20 px-4 py-3"
          role="status"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger-primary" strokeWidth={1.75} />
          <p className="text-13 leading-relaxed text-danger-primary">{t("boards.client_360.finops_alert_banner")}</p>
        </div>
      ) : null}

      <div
        className={cn(
          "shadow-xs overflow-hidden rounded-xl border border-subtle bg-layer-1",
          "grid grid-cols-2 divide-x divide-y divide-subtle sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4"
        )}
      >
        <Client360BentoMetric
          align="center"
          label={t("boards.client_360.finops_margin")}
          value={finops.margin_pct != null ? `${finops.margin_pct}%` : "—"}
          tone={marginTone}
          emphasizeValue={marginTone === "danger"}
          icon={finops.margin_pct != null && finops.margin_pct < 15 ? TrendingDown : TrendingUp}
        />
        <Client360BentoMetric
          align="center"
          label={t("boards.client_360.finops_variance")}
          value={finops.budget_variance_pct != null ? formatVariancePct(finops.budget_variance_pct) : "—"}
          tone={varianceTone}
          emphasizeValue={varianceTone === "danger"}
          icon={AlertTriangle}
        />
        <Client360BentoMetric
          align="center"
          label={t("boards.client_360.finops_utilization")}
          value={finops.utilization?.pct != null ? `${finops.utilization.pct}%` : "—"}
          tone={utilizationTone}
          emphasizeValue={finops.utilization?.over_allocated ?? false}
          icon={Users}
        />
        <Client360BentoMetric
          align="center"
          label={t("boards.client_360.finops_cost_mtd")}
          value={finops.harness_cost_mtd != null ? formatClient360Currency(finops.harness_cost_mtd) : "—"}
          tone="info"
          icon={DollarSign}
        />
      </div>

      <Client360BentoGrid>
        {hasBudget ? (
          <Client360BentoTile
            className="md:col-span-12 lg:col-span-7"
            title={t("boards.client_360.finops_budget_title")}
            icon={Banknote}
            iconTone={varianceTone === "danger" ? "danger" : "neutral"}
          >
            <Client360FinopsMeter
              label={t("boards.client_360.finops_budget_actual_label")}
              valueLabel={
                finops.budget_actual != null
                  ? formatClient360Currency(finops.budget_actual)
                  : t("boards.client_360.finops_not_set")
              }
              pct={actualPct}
              tone={varianceTone === "neutral" ? "accent" : varianceTone}
              secondary={{
                label: `${t("boards.client_360.finops_budget_planned_label")} · ${
                  finops.budget_planned != null
                    ? formatClient360Currency(finops.budget_planned)
                    : t("boards.client_360.finops_not_set")
                }`,
                pct: plannedPct,
              }}
              detail={
                finops.budget_variance_pct != null
                  ? `${t("boards.client_360.finops_variance")}: ${formatVariancePct(finops.budget_variance_pct)}`
                  : finops.revenue_contract != null
                    ? `${t("boards.client_360.finops_form_revenue")}: ${formatClient360Currency(finops.revenue_contract)}`
                    : undefined
              }
            />
          </Client360BentoTile>
        ) : null}

        {hasCapacity ? (
          <Client360BentoTile
            className={hasBudget ? "md:col-span-12 lg:col-span-5" : "md:col-span-12"}
            title={t("boards.client_360.finops_capacity_title")}
            icon={Users}
            iconTone={utilizationTone === "danger" ? "danger" : "accent"}
          >
            <Client360FinopsMeter
              label={t("boards.client_360.finops_utilization")}
              valueLabel={t("boards.client_360.finops_capacity_hours", {
                allocated: finops.utilization?.hours_allocated ?? 0,
                capacity: finops.utilization?.capacity_hours ?? 0,
              })}
              pct={capacityPct}
              tone={utilizationTone === "neutral" ? "accent" : utilizationTone}
              detail={finops.utilization?.over_allocated ? t("boards.client_360.finops_capacity_overload") : undefined}
            />
          </Client360BentoTile>
        ) : null}

        <Client360BentoTile
          className="md:col-span-12"
          title={t("boards.client_360.finops_forecast_title")}
          icon={Gauge}
          iconTone="accent"
          highlight
        >
          <div
            className={cn(
              "overflow-hidden rounded-lg border border-subtle/80 bg-layer-2/20",
              "grid divide-y divide-subtle sm:grid-cols-3 sm:divide-x sm:divide-y-0"
            )}
          >
            <Client360BentoMetric
              align="center"
              label={t("boards.client_360.finops_burn_rate")}
              value={finops.burn_rate}
              tone="neutral"
            />
            <Client360BentoMetric
              align="center"
              label={t("boards.client_360.finops_backlog")}
              value={finops.backlog_points}
              tone="neutral"
            />
            <Client360BentoMetric
              align="center"
              label={t("boards.client_360.finops_forecast_weeks")}
              value={
                finops.forecast.status === "indeterminate"
                  ? t("boards.client_360.finops_forecast_indeterminate")
                  : (forecastWeeks ?? "—")
              }
              tone={forecastWeeks != null && forecastWeeks < 2 ? "warning" : "accent"}
              emphasizeValue={forecastWeeks != null && forecastWeeks < 2}
              valueVariant={finops.forecast.status === "indeterminate" ? "status" : "numeric"}
            />
          </div>

          <div className="mt-4 space-y-2">
            <Client360FinopsMeter
              label={t("boards.client_360.finops_forecast_runway_label")}
              valueLabel={
                forecastRunwayKey(finops) === "indeterminate"
                  ? t("boards.client_360.finops_forecast_indeterminate")
                  : forecastWeeks != null
                    ? t("boards.client_360.finops_forecast_weeks_value", { weeks: forecastWeeks })
                    : "—"
              }
              pct={forecastRunwayPct}
              tone={forecastWeeks != null && forecastWeeks < 2 ? "warning" : "accent"}
              detail={
                forecastRunwayKey(finops) === "indeterminate"
                  ? t("boards.client_360.finops_forecast_runway_indeterminate")
                  : runwayDays != null
                    ? t("boards.client_360.finops_forecast_runway", { weeks: forecastWeeks, days: runwayDays })
                    : undefined
              }
            />
          </div>
        </Client360BentoTile>
      </Client360BentoGrid>

      <Client360FinopsProfileForm
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        finops={finops}
        onSaved={onFinopsSaved}
      />
    </div>
  );
}
