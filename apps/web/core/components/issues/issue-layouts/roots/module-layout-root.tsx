/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { ISSUE_DISPLAY_FILTERS_BY_PAGE, PROJECT_VIEW_TRACKER_ELEMENTS } from "@plane/constants";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
import { cn } from "@plane/utils";
import { useBoardHubHasBackground } from "@/components/board/board-hub-background";
// hooks
import { ProjectLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/project-level";
import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row";
import { useCalendarView } from "@/hooks/store/use-calendar-view";
import { useIssues } from "@/hooks/store/use-issues";
import { useProjectState } from "@/hooks/store/use-project-state";
import { getModuleCalendarPaginationOptions } from "../calendar/utils";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
// local imports
import { IssuePeekOverview } from "../../peek-overview";
import { ModuleCalendarLayout } from "../calendar/roots/module-root";
import { BaseGanttRoot } from "../gantt";
import { ModuleKanBanLayout } from "../kanban/roots/module-root";
import { ModuleListLayout } from "../list/roots/module-root";
import { ModuleSpreadsheetLayout } from "../spreadsheet/roots/module-root";

function ModuleIssueLayout(props: { activeLayout: EIssueLayoutTypes | undefined; moduleId: string }) {
  switch (props.activeLayout) {
    case EIssueLayoutTypes.LIST:
      return <ModuleListLayout />;
    case EIssueLayoutTypes.KANBAN:
      return <ModuleKanBanLayout />;
    case EIssueLayoutTypes.CALENDAR:
      return <ModuleCalendarLayout />;
    case EIssueLayoutTypes.GANTT:
      return <BaseGanttRoot viewId={props.moduleId} />;
    case EIssueLayoutTypes.SPREADSHEET:
      return <ModuleSpreadsheetLayout />;
    default:
      return null;
  }
}

export const ModuleLayoutRoot = observer(function ModuleLayoutRoot() {
  const hasBoardWallpaper = useBoardHubHasBackground();
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId, moduleId: routerModuleId } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  const projectId = routerProjectId ? routerProjectId.toString() : undefined;
  const moduleId = routerModuleId ? routerModuleId.toString() : undefined;
  // hooks
  const { issuesFilter, issues } = useIssues(EIssuesStoreType.MODULE);
  const { fetchProjectStates } = useProjectState();
  // derived values
  const workItemFilters = moduleId ? issuesFilter?.getIssueFilters(moduleId) : undefined;
  const activeLayout = workItemFilters?.displayFilters?.layout || undefined;
  const displayFilters = workItemFilters?.displayFilters;

  useWorkspaceIssueProperties(workspaceSlug);

  useSWR(
    workspaceSlug && projectId ? `MODULE_PROJECT_STATES_${workspaceSlug}_${projectId}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await fetchProjectStates(workspaceSlug, projectId);
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  useSWR(
    workspaceSlug && projectId && moduleId
      ? `MODULE_FILTERS_${workspaceSlug}_${projectId}_${moduleId}`
      : null,
    async () => {
      if (workspaceSlug && projectId && moduleId) {
        await issuesFilter?.fetchFilters(workspaceSlug.toString(), projectId.toString(), moduleId.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const moduleIssuesFetchKey =
    workspaceSlug && projectId && moduleId && displayFilters?.layout
      ? [
          workspaceSlug,
          projectId,
          moduleId,
          displayFilters.layout,
          displayFilters.group_by,
          displayFilters.sub_group_by,
          displayFilters.order_by,
        ].join("|")
      : null;

  useSWR(
    moduleIssuesFetchKey,
    async () => {
      if (!workspaceSlug || !projectId || !moduleId || !displayFilters?.layout) return;

      const layout = displayFilters.layout;
      const subGroupBy = displayFilters.sub_group_by;
      const groupBy = displayFilters.group_by;

      if (layout === EIssueLayoutTypes.CALENDAR) {
        await issues.fetchIssues(
          workspaceSlug,
          projectId,
          "init-loader",
          getModuleCalendarPaginationOptions(),
          moduleId
        );
        return;
      }

      if (layout === EIssueLayoutTypes.GANTT || layout === EIssueLayoutTypes.SPREADSHEET) {
        await issues.fetchIssues(
          workspaceSlug,
          projectId,
          "init-loader",
          { canGroup: false, perPageCount: 100 },
          moduleId
        );
        return;
      }

      const perPageCount =
        layout === EIssueLayoutTypes.KANBAN ? (subGroupBy ? 10 : 30) : groupBy ? 50 : 100;

      await issues.fetchIssues(
        workspaceSlug,
        projectId,
        "init-loader",
        { canGroup: true, perPageCount },
        moduleId
      );
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (!workspaceSlug || !projectId || !moduleId || !workItemFilters) return <></>;
  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.MODULE}>
      <ProjectLevelWorkItemFiltersHOC
        enableSaveView
        entityType={EIssuesStoreType.MODULE}
        entityId={moduleId}
        filtersToShowByLayout={ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.filters}
        initialWorkItemFilters={workItemFilters}
        updateFilters={issuesFilter?.updateFilterExpression.bind(issuesFilter, workspaceSlug, projectId, moduleId)}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
      >
        {({ filter: moduleWorkItemsFilter }) => (
          <div className="relative flex h-full w-full flex-col overflow-hidden">
            {moduleWorkItemsFilter ? (
              <div className={cn("shrink-0", hasBoardWallpaper && "border-b border-subtle/40")}>
                <WorkItemFiltersRow
                  filter={moduleWorkItemsFilter}
                  trackerElements={{
                    saveView: PROJECT_VIEW_TRACKER_ELEMENTS.MODULE_HEADER_SAVE_AS_VIEW_BUTTON,
                  }}
                />
              </div>
            ) : null}
            <div
              className={cn(
                "relative h-full min-h-0 min-w-0 flex-1 overflow-hidden",
                hasBoardWallpaper ? "bg-transparent" : "bg-surface-1"
              )}
            >
              <ModuleIssueLayout activeLayout={activeLayout} moduleId={moduleId} />
            </div>
            {/* peek overview */}
            <IssuePeekOverview />
          </div>
        )}
      </ProjectLevelWorkItemFiltersHOC>
    </IssuesStoreContext.Provider>
  );
});
