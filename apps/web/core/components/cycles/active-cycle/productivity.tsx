import { Fragment } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useTheme } from "next-themes";
// plane imports
import { useTranslation } from "@operis/i18n";
import type { ICycle, TCycleEstimateType } from "@operis/types";
import { Loader } from "@operis/ui";
// assets
import darkChartAsset from "@/app/assets/empty-state/active-cycle/chart-dark.webp?url";
import lightChartAsset from "@/app/assets/empty-state/active-cycle/chart-light.webp?url";
// components
import ProgressChart from "@/components/core/sidebar/progress-chart";
import { BOARD_HUB_CYCLE_METRIC_CARD } from "@/components/board/board-hub-background";
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
import { cn } from "@operis/utils";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { EstimateTypeDropdown } from "../dropdowns/estimate-type-dropdown";

export type ActiveCycleProductivityProps = {
  workspaceSlug: string;
  projectId: string;
  cycle: ICycle | null;
};

export const ActiveCycleProductivity = observer(function ActiveCycleProductivity(props: ActiveCycleProductivityProps) {
  const { workspaceSlug, projectId, cycle } = props;
  // theme hook
  const { resolvedTheme } = useTheme();
  // plane hooks
  const { t } = useTranslation();
  // hooks
  const { getEstimateTypeByCycleId, setEstimateType } = useCycle();
  // derived values
  const estimateType: TCycleEstimateType = (cycle && getEstimateTypeByCycleId(cycle.id)) || "issues";
  const resolvedPath = resolvedTheme === "light" ? lightChartAsset : darkChartAsset;

  const onChange = async (value: TCycleEstimateType) => {
    if (!workspaceSlug || !projectId || !cycle || !cycle.id) return;
    setEstimateType(cycle.id, value);
  };

  const chartDistributionData =
    cycle && estimateType === "points" ? cycle?.estimate_distribution : cycle?.distribution || undefined;
  const completionChartDistributionData = chartDistributionData?.completion_chart || undefined;

  return cycle && completionChartDistributionData ? (
    <div className={cn(BOARD_HUB_CYCLE_METRIC_CARD)}>
      <div className="relative flex items-center justify-between gap-4">
        <Link href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle?.id}`}>
          <h3 className="text-14 font-semibold text-tertiary">{t("project_cycles.active_cycle.issue_burndown")}</h3>
        </Link>
        <EstimateTypeDropdown value={estimateType} onChange={onChange} cycleId={cycle.id} projectId={projectId} />
      </div>

      <Link href={`/${workspaceSlug}/projects/${projectId}/cycles/${cycle?.id}`}>
        {cycle.total_issues > 0 ? (
          <>
            <div className="h-full w-full px-2">
              <div className="flex items-center justify-end gap-4 py-1 text-11 text-tertiary">
                {estimateType === "points" ? (
                  <span>
                    {t("project_cycles.active_cycle.pending_points", {
                      count:
                        cycle.backlog_estimate_points + cycle.unstarted_estimate_points + cycle.started_estimate_points,
                    })}
                  </span>
                ) : (
                  <span>
                    {t("project_cycles.active_cycle.pending_work_items", {
                      count: cycle.backlog_issues + cycle.unstarted_issues + cycle.started_issues,
                    })}
                  </span>
                )}
              </div>

              <div className="relative h-full">
                {completionChartDistributionData && (
                  <Fragment>
                    {estimateType === "points" ? (
                      <ProgressChart
                        distribution={completionChartDistributionData}
                        totalIssues={cycle.total_estimate_points || 0}
                        plotTitle={t("points")}
                      />
                    ) : (
                      <ProgressChart
                        distribution={completionChartDistributionData}
                        totalIssues={cycle.total_issues || 0}
                        plotTitle={t("work_items")}
                      />
                    )}
                  </Fragment>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-full w-full items-center justify-center">
              <SimpleEmptyState title={t("active_cycle.empty_state.chart.title")} assetPath={resolvedPath} />
            </div>
          </>
        )}
      </Link>
    </div>
  ) : (
    <Loader className={cn(BOARD_HUB_CYCLE_METRIC_CARD)}>
      <Loader.Item width="100%" height="100%" />
    </Loader>
  );
});
