import type { FC } from "react";
import { useCallback, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { TGroupedIssues } from "@operoz/types";
import { EIssueLayoutTypes, EIssuesStoreType } from "@operoz/types";
import { renderFormattedPayloadDate } from "@operoz/utils";
// hooks
import { useCalendarView } from "@/hooks/store/use-calendar-view";
import { useIssues } from "@/hooks/store/use-issues";
import { useCanEditIssueOnProject } from "@/hooks/use-board-issue-capabilities";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
// types
import type { IQuickActionProps } from "../list/list-view-types";
import { CalendarChart } from "./calendar";
import { buildCalendarDateUpdatePayload, getCalendarPaginationOptions, resolveLayoutDisplayFilters } from "./utils";

export type CalendarStoreType =
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.MODULE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.PROJECT_VIEW
  | EIssuesStoreType.BOARD
  | EIssuesStoreType.TEAM
  | EIssuesStoreType.TEAM_VIEW
  | EIssuesStoreType.EPIC;

interface IBaseCalendarRoot {
  QuickActions: FC<IQuickActionProps>;
  addIssuesToView?: (issueIds: string[]) => Promise<any>;
  isCompletedCycle?: boolean;
  viewId?: string | undefined;
  isEpic?: boolean;
  canEditPropertiesBasedOnProject?: (projectId: string) => boolean;
}

export const BaseCalendarRoot = observer(function BaseCalendarRoot(props: IBaseCalendarRoot) {
  const {
    QuickActions,
    addIssuesToView,
    isCompletedCycle = false,
    viewId,
    isEpic = false,
    canEditPropertiesBasedOnProject,
  } = props;

  // router
  const { workspaceSlug, projectId: routerProjectId } = useParams();

  // hooks
  const fallbackStoreType = useIssueStoreType() as CalendarStoreType;
  const storeType = isEpic ? EIssuesStoreType.EPIC : fallbackStoreType;
  const { issues, issuesFilter, issueMap } = useIssues(storeType);
  const {
    fetchIssues,
    fetchNextIssues,
    quickAddIssue,
    updateIssue,
    removeIssue,
    removeIssueFromView,
    archiveIssue,
    restoreIssue,
    updateFilters,
  } = useIssuesActions(storeType);

  const canEditIssueOnProject = useCanEditIssueOnProject();
  const issueCalendarView = useCalendarView();

  const { enableInlineEditing } = issues?.viewFlags || {};

  const filterEntityId = viewId ?? (storeType === EIssuesStoreType.PROJECT ? routerProjectId?.toString() : undefined);
  const displayFilters = resolveLayoutDisplayFilters(issuesFilter, filterEntityId);

  const groupedIssueIds = (issues.groupedIssueIds ?? {}) as TGroupedIssues;

  const layout = displayFilters?.calendar?.layout ?? "month";
  const calendarFetchReady =
    (storeType !== EIssuesStoreType.BOARD && storeType !== EIssuesStoreType.MODULE) ||
    displayFilters?.layout === EIssueLayoutTypes.CALENDAR;

  const { startDate, endDate } =
    issueCalendarView.getStartAndEndDate(layout) ??
    issueCalendarView.getMonthDateRange(issueCalendarView.calendarFilters.activeMonthDate);

  useEffect(() => {
    issueCalendarView.regenerateCalendar();
  }, [issueCalendarView]);

  useEffect(() => {
    if (displayFilters?.layout !== EIssueLayoutTypes.CALENDAR) return;
    issueCalendarView.updateCalendarPayload(issueCalendarView.calendarFilters.activeMonthDate);
  }, [displayFilters?.layout, issueCalendarView.calendarFilters.activeMonthDate, issueCalendarView]);

  useEffect(() => {
    // Módulo e projeto fazem fetch no layout-root (moduleId/projectId da URL).
    if (storeType === EIssuesStoreType.MODULE || storeType === EIssuesStoreType.PROJECT) {
      return;
    }

    if (!calendarFetchReady) return;

    const paginationOptions = getCalendarPaginationOptions(issueCalendarView, layout);
    if (!paginationOptions) return;

    void fetchIssues("init-loader", paginationOptions, viewId).catch(() => {
      // Errors are handled in the issues store; avoid uncaught rejections blocking the layout.
    });
  }, [
    calendarFetchReady,
    displayFilters?.layout,
    fetchIssues,
    issueCalendarView,
    issueCalendarView.calendarFilters.activeMonthDate,
    layout,
    startDate,
    endDate,
    storeType,
    viewId,
  ]);

  const handleDragAndDrop = async (
    issueId: string | undefined,
    issueProjectId: string | undefined,
    sourceDate: string | undefined,
    destinationDate: string | undefined
  ) => {
    if (!issueId || !destinationDate || !issueProjectId) return;

    const issueDetails = issues.rootIssueStore.issues.getIssueById(issueId);
    const resolvedProjectId = issueProjectId ?? issueDetails?.project_id;
    const resolvedSourceDate =
      sourceDate ?? (issueDetails?.target_date ? renderFormattedPayloadDate(issueDetails.target_date) : undefined);

    if (!resolvedProjectId || !resolvedSourceDate) return;

    const slug = Array.isArray(workspaceSlug) ? workspaceSlug[0] : workspaceSlug?.toString();
    if (!slug) return;

    const datePayload = buildCalendarDateUpdatePayload(resolvedSourceDate, destinationDate, issueDetails);

    if (!datePayload) {
      setToast({
        title: "Error!",
        type: TOAST_TYPE.ERROR,
        message: "Could not move this work item to the selected date.",
      });
      return;
    }

    try {
      if (!updateIssue) return;
      await updateIssue(resolvedProjectId, issueId, datePayload);
    } catch (err: unknown) {
      const error = err as { detail?: string; message?: string };
      setToast({
        title: "Error!",
        type: TOAST_TYPE.ERROR,
        message: error?.detail ?? error?.message ?? "Failed to perform this action",
      });
    }
  };

  const loadMoreIssues = useCallback(
    (dateString: string) => {
      fetchNextIssues(dateString);
    },
    [fetchNextIssues]
  );

  const getPaginationData = useCallback(
    (groupId: string | undefined) => issues?.getPaginationData(groupId, undefined),
    [issues?.getPaginationData]
  );

  const getGroupIssueCount = useCallback(
    (groupId: string | undefined) => issues?.getGroupIssueCount(groupId, undefined, false),
    [issues?.getGroupIssueCount]
  );

  const canEditProperties = useCallback(
    (projectId: string | undefined) => {
      if (!enableInlineEditing || !projectId) return false;
      if (canEditPropertiesBasedOnProject) {
        return canEditPropertiesBasedOnProject(projectId);
      }
      return canEditIssueOnProject(projectId);
    },
    [canEditPropertiesBasedOnProject, canEditIssueOnProject, enableInlineEditing]
  );

  return (
    <>
      <div className="h-full w-full overflow-hidden bg-surface-1 pt-4">
        <CalendarChart
          issuesFilterStore={issuesFilter}
          issues={issueMap}
          groupedIssueIds={groupedIssueIds}
          layout={layout}
          showWeekends={displayFilters?.calendar?.show_weekends ?? false}
          issueCalendarView={issueCalendarView}
          quickActions={({ issue, parentRef, customActionButton, placement }) => (
            <QuickActions
              parentRef={parentRef}
              customActionButton={customActionButton}
              issue={issue}
              handleDelete={async () => removeIssue(issue.project_id, issue.id)}
              handleUpdate={async (data) => updateIssue && updateIssue(issue.project_id, issue.id, data)}
              handleRemoveFromView={async () => removeIssueFromView && removeIssueFromView(issue.project_id, issue.id)}
              handleArchive={async () => archiveIssue && archiveIssue(issue.project_id, issue.id)}
              handleRestore={async () => restoreIssue && restoreIssue(issue.project_id, issue.id)}
              readOnly={!canEditProperties(issue.project_id ?? undefined) || isCompletedCycle}
              placements={placement}
            />
          )}
          loadMoreIssues={loadMoreIssues}
          getPaginationData={getPaginationData}
          getGroupIssueCount={getGroupIssueCount}
          addIssuesToView={addIssuesToView}
          quickAddCallback={quickAddIssue}
          readOnly={isCompletedCycle}
          updateFilters={updateFilters}
          handleDragAndDrop={handleDragAndDrop}
          canEditProperties={canEditProperties}
          isEpic={isEpic}
        />
      </div>
    </>
  );
});
