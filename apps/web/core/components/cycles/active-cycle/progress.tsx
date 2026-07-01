import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// plane imports
import { PROGRESS_STATE_GROUPS_DETAILS } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import type { TWorkItemFilterCondition } from "@operoz/shared-state";
import type { ICycle } from "@operoz/types";
import { LinearProgressIndicator, Loader } from "@operoz/ui";
// assets
import darkProgressAsset from "@/app/assets/empty-state/active-cycle/progress-dark.webp?url";
import lightProgressAsset from "@/app/assets/empty-state/active-cycle/progress-light.webp?url";
// components
import { BOARD_HUB_CYCLE_METRIC_CARD } from "@/components/board/board-hub-background";
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
import { cn } from "@operoz/utils";

const STATE_GROUP_KEYS = ["completed", "started", "unstarted", "backlog"] as const;

export type ActiveCycleProgressProps = {
  cycle: ICycle | null;
  workspaceSlug: string;
  projectId: string;
  handleFiltersUpdate: (conditions: TWorkItemFilterCondition[]) => void;
};

export const ActiveCycleProgress = observer(function ActiveCycleProgress(props: ActiveCycleProgressProps) {
  const { handleFiltersUpdate, cycle } = props;
  // theme hook
  const { resolvedTheme } = useTheme();
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const progressIndicatorData = PROGRESS_STATE_GROUPS_DETAILS.map((group, index) => ({
    id: index,
    name: t(`workspace_projects.state.${STATE_GROUP_KEYS[index]}`),
    value: cycle && cycle.total_issues > 0 ? (cycle[group.key as keyof ICycle] as number) : 0,
    color: group.color,
  }));
  const groupedIssues: any = cycle
    ? {
        completed: cycle?.completed_issues,
        started: cycle?.started_issues,
        unstarted: cycle?.unstarted_issues,
        backlog: cycle?.backlog_issues,
      }
    : {};
  const resolvedPath = resolvedTheme === "light" ? lightProgressAsset : darkProgressAsset;

  return cycle && cycle.hasOwnProperty("started_issues") ? (
    <div className={cn(BOARD_HUB_CYCLE_METRIC_CARD)}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-14 font-semibold text-tertiary">{t("project_cycles.active_cycle.progress")}</h3>
          {cycle.total_issues > 0 && (
            <span className="flex gap-1 rounded-xs px-3 py-1 text-13 font-medium whitespace-nowrap text-placeholder">
              {t("project_cycles.active_cycle.closed_count", {
                closed: cycle.completed_issues + cycle.cancelled_issues,
                total: cycle.total_issues - cycle.cancelled_issues,
                entity:
                  cycle.completed_issues + cycle.cancelled_issues > 1 ? t("common.work_items") : t("common.work_item"),
              })}
            </span>
          )}
        </div>
        {cycle.total_issues > 0 && <LinearProgressIndicator size="lg" data={progressIndicatorData} />}
      </div>

      {cycle.total_issues > 0 ? (
        <div className="flex flex-col gap-5">
          {Object.keys(groupedIssues).map((group, index) => (
            <>
              {groupedIssues[group] > 0 && (
                <div key={index}>
                  <div
                    className="flex cursor-pointer items-center justify-between gap-2 text-13"
                    onClick={() => {
                      handleFiltersUpdate([{ property: "state_group", operator: "in", value: [group] }]);
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className="block h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: PROGRESS_STATE_GROUPS_DETAILS[index].color,
                        }}
                      />
                      <span className="w-16 font-medium text-tertiary">
                        {t(`workspace_projects.state.${group as (typeof STATE_GROUP_KEYS)[number]}`)}
                      </span>
                    </div>
                    <span className="text-tertiary">{`${groupedIssues[group]} ${
                      groupedIssues[group] > 1 ? t("common.work_items") : t("common.work_item")
                    }`}</span>
                  </div>
                </div>
              )}
            </>
          ))}
          {cycle.cancelled_issues > 0 && (
            <span className="flex items-center gap-2 text-13 text-tertiary">
              <span>{t("project_cycles.active_cycle.cancelled_excluded", { count: cycle.cancelled_issues })}</span>
            </span>
          )}
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <SimpleEmptyState title={t("active_cycle.empty_state.progress.title")} assetPath={resolvedPath} />
        </div>
      )}
    </div>
  ) : (
    <Loader className={cn(BOARD_HUB_CYCLE_METRIC_CARD)}>
      <Loader.Item width="100%" height="100%" />
    </Loader>
  );
});
