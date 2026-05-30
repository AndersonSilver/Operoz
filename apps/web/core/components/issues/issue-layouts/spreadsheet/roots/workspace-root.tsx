import React, { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane constants
import { ALL_ISSUES, EIssueFilterType, EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import type { IIssueDisplayFilterOptions } from "@operis/types";
import { EIssuesStoreType, EIssueLayoutTypes } from "@operis/types";
// components
import { AllIssueQuickActions } from "@/components/issues/issue-layouts/quick-action-dropdowns";
import { SpreadsheetLayoutLoader } from "@/components/ui/loader/layouts/spreadsheet-layout-loader";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useUserPermissions } from "@/hooks/store/user";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
import type { IBoardIssuesFilter } from "@/store/issue/board/filter.store";
// store
import { IssueLayoutHOC } from "../../issue-layout-HOC";
import { useBoardAlignedDisplayProperties } from "../../list-display-properties";
import type { TRenderQuickActions } from "../../list/list-view-types";
import { SpreadsheetView } from "../spreadsheet-view";

type Props = {
  isDefaultView: boolean;
  isLoading?: boolean;
  toggleLoading: (value: boolean) => void;
  workspaceSlug: string;
  globalViewId: string;
  routeFilters: {
    [key: string]: string;
  };
  fetchNextPages: () => void;
  globalViewsLoading: boolean;
  issuesLoading: boolean;
};

export const WorkspaceSpreadsheetRoot = observer(function WorkspaceSpreadsheetRoot(props: Props) {
  const { isLoading = false, workspaceSlug, globalViewId, fetchNextPages, issuesLoading } = props;

  // Custom hooks
  useWorkspaceIssueProperties(workspaceSlug);

  // Store hooks (GLOBAL ou BOARD conforme IssuesStoreContext / rota)
  const { projectId: routerProjectId } = useParams();
  const projectId = routerProjectId?.toString();

  const storeType = useIssueStoreType();
  const {
    issuesFilter,
    issues: { getIssueLoader, getPaginationData, groupedIssueIds },
  } = useIssues(storeType);
  const { filters } = issuesFilter;
  const { updateIssue, removeIssue, archiveIssue, updateFilters } = useIssuesActions(storeType);
  const { allowPermissions } = useUserPermissions();

  // Derived values
  const issueFilters = globalViewId ? filters?.[globalViewId.toString()] : undefined;
  const displayProperties = useBoardAlignedDisplayProperties(globalViewId, {
    layout: EIssueLayoutTypes.SPREADSHEET,
  });

  // Permission checker
  const canEditProperties = useCallback(
    (projectId: string | undefined) => {
      if (!projectId) return false;
      return allowPermissions(
        [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        EUserPermissionsLevel.PROJECT,
        workspaceSlug.toString(),
        projectId
      );
    },
    [allowPermissions, workspaceSlug]
  );

  // Display filters handler
  const handleDisplayFiltersUpdate = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !globalViewId) return;

      if (storeType === EIssuesStoreType.BOARD) {
        (issuesFilter as IBoardIssuesFilter).updateFilters(
          workspaceSlug.toString(),
          undefined,
          EIssueFilterType.DISPLAY_FILTERS,
          { ...updatedDisplayFilter },
          globalViewId.toString()
        );
      } else {
        updateFilters(projectId ?? "", EIssueFilterType.DISPLAY_FILTERS, { ...updatedDisplayFilter });
      }
    },
    [updateFilters, workspaceSlug, globalViewId, storeType, issuesFilter, projectId]
  );

  // Quick actions renderer
  const renderQuickActions: TRenderQuickActions = useCallback(
    ({ issue, parentRef, customActionButton, placement, portalElement }) => (
      <AllIssueQuickActions
        parentRef={parentRef}
        customActionButton={customActionButton}
        issue={issue}
        handleDelete={async () => removeIssue(issue.project_id, issue.id)}
        handleUpdate={async (data) => updateIssue && updateIssue(issue.project_id, issue.id, data)}
        handleArchive={async () => archiveIssue && archiveIssue(issue.project_id, issue.id)}
        portalElement={portalElement}
        readOnly={!canEditProperties(issue.project_id ?? undefined)}
        placements={placement}
      />
    ),
    [canEditProperties, removeIssue, updateIssue, archiveIssue]
  );

  // Loading state
  if ((isLoading && issuesLoading && getIssueLoader() === "init-loader") || !globalViewId || !groupedIssueIds) {
    return <SpreadsheetLayoutLoader />;
  }

  // Computed values
  const issueIds = groupedIssueIds[ALL_ISSUES];
  const nextPageResults = getPaginationData(ALL_ISSUES, undefined)?.nextPageResults;

  // Render spreadsheet
  return (
    <IssueLayoutHOC layout={EIssueLayoutTypes.SPREADSHEET}>
      <SpreadsheetView
        displayProperties={displayProperties ?? {}}
        displayFilters={issueFilters?.displayFilters ?? {}}
        handleDisplayFilterUpdate={handleDisplayFiltersUpdate}
        issueIds={Array.isArray(issueIds) ? issueIds : []}
        quickActions={renderQuickActions}
        updateIssue={updateIssue}
        canEditProperties={canEditProperties}
        canLoadMoreIssues={!!nextPageResults}
        loadMoreIssues={fetchNextPages}
        isWorkspaceLevel={storeType === EIssuesStoreType.GLOBAL}
      />
    </IssueLayoutHOC>
  );
});
