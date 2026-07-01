import React, { useCallback, useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { ALL_ISSUES, EUserPermissions, EUserPermissionsLevel } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IBlockUpdateData, IBlockUpdateDependencyData, IIssueDisplayFilterOptions, TIssue } from "@operoz/types";
import { EIssuesStoreType } from "@operoz/types";
import { EIssueLayoutTypes, GANTT_TIMELINE_TYPE } from "@operoz/types";
import { renderFormattedPayloadDate } from "@operoz/utils";
// components
import { GanttDependencyContext, TimeLineTypeContext } from "@/components/gantt-chart/contexts";
import { GanttChartRoot } from "@/components/gantt-chart/root";
import { IssueGanttSidebar } from "@/components/gantt-chart/sidebar/issues/sidebar";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useUserPermissions } from "@/hooks/store/user";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { useTimeLineChart } from "@/hooks/use-timeline-chart";
// plane web hooks
import { useBulkOperationStatus } from "@/plane-web/hooks/use-bulk-operation-status";

import { IssueLayoutHOC } from "../issue-layout-HOC";
import { GanttQuickAddIssueButton, QuickAddIssueRoot } from "../quick-add";
import { IssueGanttBlock } from "./blocks";
import { GanttSubIssueExpansionProvider, useGanttSubIssueExpansion } from "./gantt-sub-issue-expansion";

interface IBaseGanttRoot {
  viewId?: string | undefined;
  isCompletedCycle?: boolean;
  isEpic?: boolean;
}

export type GanttStoreType =
  | EIssuesStoreType.PROJECT
  | EIssuesStoreType.MODULE
  | EIssuesStoreType.CYCLE
  | EIssuesStoreType.PROJECT_VIEW
  | EIssuesStoreType.BOARD
  | EIssuesStoreType.EPIC;

type GanttChartBodyProps = {
  isEpic: boolean;
  isAllowed: boolean;
  isCompletedCycle: boolean;
  isBulkOperationsEnabled: boolean;
  canEditIssue: (issueId: string) => boolean;
  appliedDisplayFilters: IIssueDisplayFilterOptions | undefined;
  updateIssueBlockStructure: (issue: TIssue, data: IBlockUpdateData) => Promise<void>;
  updateBlockDates: (updates: IBlockUpdateDependencyData[]) => Promise<void>;
  quickAddIssue: ReturnType<typeof useIssuesActions>["quickAddIssue"];
  loadMoreIssues: () => void;
  nextPageResults: boolean | undefined;
  targetDate: Date;
};

const GanttChartBody = observer(function GanttChartBody(props: GanttChartBodyProps) {
  const {
    isEpic,
    isAllowed,
    isCompletedCycle,
    isBulkOperationsEnabled,
    canEditIssue,
    appliedDisplayFilters,
    updateIssueBlockStructure,
    updateBlockDates,
    quickAddIssue,
    loadMoreIssues,
    nextPageResults,
    targetDate,
  } = props;
  const { t } = useTranslation();
  const storeType = useIssueStoreType() as GanttStoreType;
  const { issues } = useIssues(storeType);
  const { displayBlockIds } = useGanttSubIssueExpansion();

  const { enableIssueCreation } = issues?.viewFlags || {};

  const quickAdd =
    enableIssueCreation && isAllowed && !isCompletedCycle ? (
      <QuickAddIssueRoot
        layout={EIssueLayoutTypes.GANTT}
        QuickAddButton={GanttQuickAddIssueButton}
        containerClassName="sticky bottom-0 z-[1]"
        prePopulatedData={{
          start_date: renderFormattedPayloadDate(new Date()),
          target_date: renderFormattedPayloadDate(targetDate),
        }}
        quickAddCallback={quickAddIssue}
        isEpic={isEpic}
      />
    ) : undefined;

  return (
    <GanttChartRoot
      border={false}
      title={isEpic ? t("epic.label", { count: 2 }) : t("issue.label", { count: 2 })}
      loaderTitle={isEpic ? t("epic.label", { count: 2 }) : t("issue.label", { count: 2 })}
      blockIds={displayBlockIds}
      blockUpdateHandler={updateIssueBlockStructure}
      blockToRender={(data: TIssue) => <IssueGanttBlock issueId={data.id} isEpic={isEpic} />}
      sidebarToRender={(sidebarProps) => <IssueGanttSidebar {...sidebarProps} showAllBlocks isEpic={isEpic} />}
      enableBlockLeftResize={canEditIssue}
      enableBlockRightResize={canEditIssue}
      enableBlockMove={canEditIssue}
      enableReorder={appliedDisplayFilters?.order_by === "sort_order" ? canEditIssue : false}
      enableAddBlock={isAllowed}
      enableSelection={isBulkOperationsEnabled && isAllowed}
      quickAdd={quickAdd}
      loadMoreBlocks={loadMoreIssues}
      canLoadMoreBlocks={nextPageResults}
      updateBlockDates={updateBlockDates}
      showAllBlocks
      enableDependency
      isEpic={isEpic}
    />
  );
});

export const BaseGanttRoot = observer(function BaseGanttRoot(props: IBaseGanttRoot) {
  const { viewId, isCompletedCycle = false, isEpic = false } = props;
  const { t } = useTranslation();
  // router
  const { workspaceSlug, projectId } = useParams();

  const storeType = useIssueStoreType() as GanttStoreType;
  const { issues, issuesFilter } = useIssues(storeType);
  const { fetchIssues, fetchNextIssues, updateIssue, quickAddIssue } = useIssuesActions(storeType);
  const { initGantt } = useTimeLineChart(GANTT_TIMELINE_TYPE.ISSUE);
  // useTimeLineChart (not useTimeLineChartStore) because BaseGanttRoot is the
  // TimeLineTypeContext.Provider — the type-based hook must be used instead.
  const ganttStore = useTimeLineChart(GANTT_TIMELINE_TYPE.ISSUE);
  const { createRelation, removeRelation } = useIssueDetail();
  // store hooks
  const { allowPermissions } = useUserPermissions();

  const appliedDisplayFilters = issuesFilter.issueFilters?.displayFilters;
  const boardGanttReady =
    storeType !== EIssuesStoreType.BOARD || appliedDisplayFilters?.layout === EIssueLayoutTypes.GANTT;
  // plane web hooks
  const isBulkOperationsEnabled = useBulkOperationStatus();
  // derived values
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 1);

  useEffect(() => {
    if (!boardGanttReady) return;
    if (storeType === EIssuesStoreType.BOARD) return;
    if (storeType === EIssuesStoreType.MODULE || storeType === EIssuesStoreType.PROJECT) return;
    fetchIssues("init-loader", { canGroup: false, perPageCount: 100 }, viewId);
  }, [boardGanttReady, fetchIssues, storeType, viewId]);

  useEffect(() => {
    initGantt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const issuesIds = (issues.groupedIssueIds?.[ALL_ISSUES] as string[]) ?? [];
  const nextPageResults = issues.getPaginationData(undefined, undefined)?.nextPageResults;

  const loadMoreIssues = useCallback(() => {
    fetchNextIssues();
  }, [fetchNextIssues]);

  const updateIssueBlockStructure = async (issue: TIssue, data: IBlockUpdateData) => {
    if (!workspaceSlug) return;

    const payload: any = { ...data };
    if (data.sort_order) payload.sort_order = data.sort_order.newSortOrder;

    updateIssue && (await updateIssue(issue.project_id, issue.id, payload));
  };

  const canEditIssue = useCallback(
    (issueId: string) => {
      const slug = workspaceSlug?.toString();
      if (!slug) return false;

      const issueProjectId =
        storeType === EIssuesStoreType.BOARD
          ? issues.rootIssueStore.issues.getIssueById(issueId)?.project_id
          : projectId?.toString();

      if (!issueProjectId) return false;

      return allowPermissions(
        [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        EUserPermissionsLevel.PROJECT,
        slug,
        issueProjectId
      );
    },
    [allowPermissions, issues.rootIssueStore.issues, projectId, storeType, workspaceSlug]
  );

  const isAllowed =
    storeType === EIssuesStoreType.BOARD
      ? allowPermissions(
          [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
          EUserPermissionsLevel.WORKSPACE,
          workspaceSlug?.toString()
        )
      : allowPermissions(
          [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
          EUserPermissionsLevel.PROJECT,
          workspaceSlug?.toString(),
          projectId?.toString()
        );
  const updateBlockDates = useCallback(
    async (updates: IBlockUpdateDependencyData[]) => {
      if (!workspaceSlug) return;

      const onError = () => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: "Error while updating work item dates, Please try again Later",
        });
      };

      if (storeType === EIssuesStoreType.BOARD) {
        const getIssueById = issues.rootIssueStore.issues.getIssueById;
        const updatesByProject: Record<string, IBlockUpdateDependencyData[]> = {};

        for (const update of updates) {
          const projectIdForIssue = getIssueById(update.id)?.project_id;
          if (!projectIdForIssue) continue;
          if (!updatesByProject[projectIdForIssue]) updatesByProject[projectIdForIssue] = [];
          updatesByProject[projectIdForIssue].push(update);
        }

        await Promise.all(
          Object.entries(updatesByProject).map(([projectIdForIssue, projectUpdates]) =>
            issues.updateIssueDates(workspaceSlug.toString(), projectUpdates, projectIdForIssue)
          )
        ).catch(onError);
        return;
      }

      if (!projectId) return;

      await issues.updateIssueDates(workspaceSlug.toString(), updates, projectId.toString()).catch(onError);
    },
    [issues, projectId, storeType, t, workspaceSlug]
  );

  /**
   * Creates a Finish-to-Start dependency.
   * predecessorBlockId must finish before successorBlockId can start.
   */
  const handleCreateDependency = useCallback(
    async (predecessorBlockId: string, successorBlockId: string) => {
      if (!workspaceSlug) return;

      const successorBlock = ganttStore.getBlockById(successorBlockId);
      const issueProjectId = successorBlock?.meta?.project_id ?? projectId?.toString();
      if (!issueProjectId) return;

      ganttStore.addDependency(successorBlockId, predecessorBlockId);

      try {
        await createRelation(workspaceSlug.toString(), issueProjectId, successorBlockId, "blocked_by", [
          predecessorBlockId,
        ]);
      } catch {
        ganttStore.removeDependency(successorBlockId, predecessorBlockId);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: "Erro ao criar dependência. Tente novamente.",
        });
      }
    },
    [createRelation, ganttStore, projectId, t, workspaceSlug]
  );

  /**
   * Removes an existing Finish-to-Start dependency between two blocks.
   */
  const handleDeleteDependency = useCallback(
    async (successorBlockId: string, predecessorBlockId: string) => {
      if (!workspaceSlug) return;

      const successorBlock = ganttStore.getBlockById(successorBlockId);
      const issueProjectId = successorBlock?.meta?.project_id ?? projectId?.toString();
      if (!issueProjectId) return;

      ganttStore.removeDependency(successorBlockId, predecessorBlockId);

      try {
        await removeRelation(
          workspaceSlug.toString(),
          issueProjectId,
          successorBlockId,
          "blocked_by",
          predecessorBlockId
        );
      } catch {
        ganttStore.addDependency(successorBlockId, predecessorBlockId);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: "Erro ao remover dependência. Tente novamente.",
        });
      }
    },
    [ganttStore, projectId, removeRelation, t, workspaceSlug]
  );

  return (
    <IssueLayoutHOC layout={EIssueLayoutTypes.GANTT}>
      <TimeLineTypeContext.Provider value={GANTT_TIMELINE_TYPE.ISSUE}>
        <GanttDependencyContext.Provider
          value={{
            onCreateDependency: handleCreateDependency,
            onDeleteDependency: handleDeleteDependency,
          }}
        >
          <div className="h-full w-full">
            <GanttSubIssueExpansionProvider issueIds={issuesIds} isEpic={isEpic}>
              <GanttChartBody
                isEpic={isEpic}
                isAllowed={isAllowed}
                isCompletedCycle={isCompletedCycle}
                isBulkOperationsEnabled={isBulkOperationsEnabled}
                canEditIssue={canEditIssue}
                appliedDisplayFilters={appliedDisplayFilters}
                updateIssueBlockStructure={updateIssueBlockStructure}
                updateBlockDates={updateBlockDates}
                quickAddIssue={quickAddIssue}
                loadMoreIssues={loadMoreIssues}
                nextPageResults={nextPageResults}
                targetDate={targetDate}
              />
            </GanttSubIssueExpansionProvider>
          </div>
        </GanttDependencyContext.Provider>
      </TimeLineTypeContext.Provider>
    </IssueLayoutHOC>
  );
});
