import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane constants
import { ISSUE_DISPLAY_FILTERS_BY_PAGE, PROJECT_VIEW_TRACKER_ELEMENTS } from "@operoz/constants";
import { EIssueLayoutTypes, EIssuesStoreType } from "@operoz/types";
import { Spinner } from "@operoz/ui";
import { BOARD_HUB_PROJECT_WORK_SURFACE_INNER } from "@/components/board/board-hub-background";
import { cn } from "@operoz/utils";
// components
import { ProjectLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/project-level";
import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row";
// hooks
import { useCalendarView } from "@/hooks/store/use-calendar-view";
import { useIssues } from "@/hooks/store/use-issues";
import { getCalendarPaginationOptions } from "../calendar/utils";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
// local imports
import { IssuePeekOverview } from "../../peek-overview";
import { CalendarLayout } from "../calendar/roots/project-root";
import { BaseGanttRoot } from "../gantt";
import { KanBanLayout } from "../kanban/roots/project-root";
import { ListLayout } from "../list/roots/project-root";
import { ProjectSpreadsheetLayout } from "../spreadsheet/roots/project-root";

function ProjectIssueLayout(props: { activeLayout: EIssueLayoutTypes | undefined }) {
  switch (props.activeLayout) {
    case EIssueLayoutTypes.LIST:
      return <ListLayout />;
    case EIssueLayoutTypes.KANBAN:
      return <KanBanLayout />;
    case EIssueLayoutTypes.CALENDAR:
      return <CalendarLayout />;
    case EIssueLayoutTypes.GANTT:
      return <BaseGanttRoot />;
    case EIssueLayoutTypes.SPREADSHEET:
      return <ProjectSpreadsheetLayout />;
    default:
      return null;
  }
}

export const ProjectLayoutRoot = observer(function ProjectLayoutRoot() {
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  const projectId = routerProjectId ? routerProjectId.toString() : undefined;
  // hooks
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.PROJECT);
  const issueCalendarView = useCalendarView();
  // derived values
  const workItemFilters = projectId ? issuesFilter?.getIssueFilters(projectId) : undefined;
  const activeLayout = workItemFilters?.displayFilters?.layout;
  const displayFilters = workItemFilters?.displayFilters;

  useSWR(
    workspaceSlug && projectId ? `PROJECT_FILTERS_${workspaceSlug}_${projectId}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await issuesFilter?.fetchFilters(workspaceSlug, projectId);
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const projectIssuesFetchKey =
    workspaceSlug && projectId && displayFilters?.layout
      ? [
          workspaceSlug,
          projectId,
          displayFilters.layout,
          displayFilters.group_by,
          displayFilters.sub_group_by,
          displayFilters.order_by,
          displayFilters.layout === EIssueLayoutTypes.CALENDAR
            ? issueCalendarView.calendarFilters.activeMonthDate.toISOString()
            : "",
        ].join("|")
      : null;

  useSWR(
    projectIssuesFetchKey,
    async () => {
      if (!workspaceSlug || !projectId || !displayFilters?.layout) return;

      const layout = displayFilters.layout;
      const subGroupBy = displayFilters.sub_group_by;
      const groupBy = displayFilters.group_by;

      if (layout === EIssueLayoutTypes.CALENDAR) {
        const calendarLayout = displayFilters.calendar?.layout ?? "month";
        const calendarOptions = getCalendarPaginationOptions(issueCalendarView, calendarLayout);

        if (calendarOptions) {
          await issues.fetchIssues(workspaceSlug, projectId, "init-loader", calendarOptions);
        }
        return;
      }

      if (layout === EIssueLayoutTypes.GANTT || layout === EIssueLayoutTypes.SPREADSHEET) {
        await issues.fetchIssues(workspaceSlug, projectId, "init-loader", {
          canGroup: false,
          perPageCount: 100,
        });
        return;
      }

      const perPageCount = layout === EIssueLayoutTypes.KANBAN ? (subGroupBy ? 10 : 30) : groupBy ? 50 : 100;

      await issues.fetchIssues(workspaceSlug, projectId, "init-loader", {
        canGroup: true,
        perPageCount,
      });
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (!workspaceSlug || !projectId || !workItemFilters) return <></>;
  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.PROJECT}>
      <ProjectLevelWorkItemFiltersHOC
        enableSaveView
        entityType={EIssuesStoreType.PROJECT}
        entityId={projectId}
        filtersToShowByLayout={ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.filters}
        initialWorkItemFilters={workItemFilters}
        updateFilters={issuesFilter?.updateFilterExpression.bind(issuesFilter, workspaceSlug, projectId)}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
      >
        {({ filter: projectWorkItemsFilter }) => (
          <div className="relative flex h-full min-h-0 w-full flex-col overflow-hidden">
            {projectWorkItemsFilter ? (
              <div className="shrink-0 border-b border-subtle bg-layer-1">
                <WorkItemFiltersRow
                  filter={projectWorkItemsFilter}
                  trackerElements={{
                    saveView: PROJECT_VIEW_TRACKER_ELEMENTS.PROJECT_HEADER_SAVE_AS_VIEW_BUTTON,
                  }}
                />
              </div>
            ) : null}
            <div className={cn("relative min-h-0 flex-1 overflow-hidden", BOARD_HUB_PROJECT_WORK_SURFACE_INNER)}>
              {issues?.getIssueLoader() === "mutation" && (
                <div className="shadow-sm fixed top-[70px] right-[20px] z-50 flex h-[40px] w-[40px] items-center justify-center rounded-sm bg-layer-1">
                  <Spinner className="h-4 w-4" />
                </div>
              )}
              <ProjectIssueLayout activeLayout={activeLayout} />
            </div>
            <IssuePeekOverview />
          </div>
        )}
      </ProjectLevelWorkItemFiltersHOC>
    </IssuesStoreContext.Provider>
  );
});
