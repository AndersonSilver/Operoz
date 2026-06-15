import { AlertTriangle, DollarSign, Gauge, TrendingDown, TrendingUp, Users } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import type { TClient360FinopsPayload } from "@operis/types";
import { Client360FinopsProfileForm } from "@/components/board/client-360/client-360-finops-profile-form";
import { Client360Section, Client360StatGrid, Client360StatTile } from "@/components/board/client-360/client-360-ui";
import { formatClient360Currency } from "@/components/board/client-360/client-360-utils";

type Props = {
  workspaceSlug: string;
  projectId: string;
  finops: TClient360FinopsPayload;
  onFinopsSaved?: () => void;
};

export function Client360FinopsSections({ workspaceSlug, projectId, finops, onFinopsSaved }: Props) {
  const { t } = useTranslation();
  const hasFinancials =
    finops.budget_planned != null ||
    finops.budget_actual != null ||
    finops.revenue_contract != null ||
    finops.harness_cost_mtd != null;

  const hasMetrics =
    hasFinancials ||
    finops.utilization != null ||
    finops.backlog_points > 0 ||
    finops.margin_pct != null ||
    finops.budget_variance_pct != null;

  return (
    <div className="flex flex-col gap-4">
      <Client360FinopsProfileForm
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        finops={finops}
        onSaved={onFinopsSaved}
      />

      {!hasMetrics ? (
        <p className="rounded-xl border border-dashed border-subtle bg-layer-2/20 px-4 py-6 text-center text-13 leading-relaxed text-tertiary">
          {t("boards.client_360.finops_form_empty_metrics")}
        </p>
      ) : (
        <>
          <Client360Section
            icon={DollarSign}
            iconTone={finops.finops_alert ? "danger" : "accent"}
            title={t("boards.client_360.finops_title")}
            description={t("boards.client_360.finops_subtitle")}
          >
            <Client360StatGrid>
              {finops.utilization ? (
                <Client360StatTile
                  icon={Users}
                  label={t("boards.client_360.finops_utilization")}
                  value={finops.utilization.pct != null ? `${finops.utilization.pct}%` : "—"}
                  tone={finops.utilization.over_allocated ? "danger" : "neutral"}
                  highlightValue={finops.utilization.over_allocated}
                />
              ) : null}
              {finops.harness_cost_mtd != null ? (
                <Client360StatTile
                  icon={DollarSign}
                  label={t("boards.client_360.finops_cost_mtd")}
                  value={formatClient360Currency(finops.harness_cost_mtd)}
                  tone="info"
                />
              ) : null}
              {finops.margin_pct != null ? (
                <Client360StatTile
                  icon={finops.margin_pct < 15 ? TrendingDown : TrendingUp}
                  label={t("boards.client_360.finops_margin")}
                  value={`${finops.margin_pct}%`}
                  tone={finops.margin_pct < 15 ? "danger" : "success"}
                />
              ) : null}
              {finops.budget_variance_pct != null ? (
                <Client360StatTile
                  icon={AlertTriangle}
                  label={t("boards.client_360.finops_variance")}
                  value={`${finops.budget_variance_pct > 0 ? "+" : ""}${finops.budget_variance_pct}%`}
                  tone={Math.abs(finops.budget_variance_pct) > 10 ? "danger" : "warning"}
                />
              ) : null}
            </Client360StatGrid>
          </Client360Section>

          <Client360Section
            icon={Gauge}
            iconTone="accent"
            title={t("boards.client_360.finops_forecast_title")}
            description={t("boards.client_360.finops_forecast_subtitle")}
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-md border border-subtle bg-layer-2 px-4 py-3">
                <p className="text-11 tracking-wide text-tertiary uppercase">
                  {t("boards.client_360.finops_burn_rate")}
                </p>
                <p className="mt-1 text-24 font-semibold text-primary tabular-nums">{finops.burn_rate}</p>
              </div>
              <div className="rounded-md border border-subtle bg-layer-2 px-4 py-3">
                <p className="text-11 tracking-wide text-tertiary uppercase">{t("boards.client_360.finops_backlog")}</p>
                <p className="mt-1 text-24 font-semibold text-primary tabular-nums">{finops.backlog_points}</p>
              </div>
              <div className="rounded-md border border-subtle bg-layer-2 px-4 py-3">
                <p className="text-11 tracking-wide text-tertiary uppercase">
                  {t("boards.client_360.finops_forecast_weeks")}
                </p>
                <p className="mt-1 text-24 font-semibold text-primary tabular-nums">
                  {finops.forecast.status === "indeterminate"
                    ? t("boards.client_360.finops_forecast_indeterminate")
                    : (finops.forecast.weeks ?? "—")}
                </p>
              </div>
            </div>
            {finops.forward_capacity.overload ? (
              <p className="mt-3 text-13 text-danger-primary">{t("boards.client_360.finops_capacity_overload")}</p>
            ) : null}
          </Client360Section>
        </>
      )}
    </div>
  );
}
