import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EIssueFilterType, EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import type { GroupByColumnTypes, TGroupedIssues, TIssue, TIssueKanbanFilters } from "@operis/types";
import { EIssuesStoreType, EIssueLayoutTypes } from "@operis/types";
import { AllIssueQuickActions } from "@/components/issues/issue-layouts/quick-action-dropdowns";
import { ListLayoutLoader } from "@/components/ui/loader/layouts/list-layout-loader";
import { useIssues } from "@/hooks/store/use-issues";
import { useUserPermissions } from "@/hooks/store/user";
import { useGroupIssuesDragNDrop } from "@/hooks/use-group-dragndrop";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
import type { IBoardIssuesFilter } from "@/store/issue/board/filter.store";
import { IssueLayoutHOC } from "../../issue-layout-HOC";
import { useBoardAlignedDisplayProperties } from "../../list-display-properties";
import { List } from "../default";
import type { TRenderQuickActions } from "../list-view-types";

type Props = {
  isLoading?: boolean;
  workspaceSlug: string;
  globalViewId: string;
  issuesLoading: boolean;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
};

export const WorkspaceListRoot = observer(function WorkspaceListRoot(props: Props) {
  const { isLoading = false, workspaceSlug, globalViewId, issuesLoading, addIssuesToView } = props;
  const { projectId: routerProjectId } = useParams();
  const projectId = routerProjectId?.toString();

  useWorkspaceIssueProperties(workspaceSlug);

  const storeType = useIssueStoreType();
  const {
    issuesFilter,
    issues: { getIssueLoader, groupedIssueIds, viewFlags },
  } = useIssues(storeType);
  const { filters } = issuesFilter;
  const { updateIssue, removeIssue, archiveIssue, fetchNextIssues, updateFilters } = useIssuesActions(storeType);
  const { allowPermissions } = useUserPermissions();
  const { issueMap } = useIssues();

  const issueFilters = globalViewId ? filters?.[globalViewId] : undefined;
  const displayFilters = issueFilters?.displayFilters;
  const displayProperties = useBoardAlignedDisplayProperties(globalViewId);
  const orderBy = displayFilters?.order_by || undefined;
  const group_by = (displayFilters?.group_by || null) as GroupByColumnTypes | null;
  const showEmptyGroup = displayFilters?.show_empty_groups ?? false;
  const collapsedGroups =
    issueFilters?.kanbanFilters || ({ group_by: [], sub_group_by: [] } as TIssueKanbanFilters);

  const canEditProperties = useCallback(
    (projectId: string | undefined) => {
      if (!projectId) return false;
      return allowPermissions(
        [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        EUserPermissionsLevel.PROJECT,
        workspaceSlug,
        projectId
      );
    },
    [allowPermissions, workspaceSlug]
  );

  const handleCollapsedGroups = useCallback(
    (value: string) => {
      if (!workspaceSlug || !globalViewId) return;

      let nextCollapsed = issueFilters?.kanbanFilters?.group_by || [];
      if (nextCollapsed.includes(value)) {
        nextCollapsed = nextCollapsed.filter((_value) => _value !== value);
      } else {
        nextCollapsed = [...nextCollapsed, value];
      }

      const payload = { group_by: nextCollapsed } as TIssueKanbanFilters;
      if (storeType === EIssuesStoreType.BOARD) {
        (issuesFilter as IBoardIssuesFilter).updateFilters(
          workspaceSlug,
          undefined,
          EIssueFilterType.KANBAN_FILTERS,
          payload,
          globalViewId
        );
      } else {
        updateFilters(projectId ?? "", EIssueFilterType.KANBAN_FILTERS, payload);
      }
    },
    [workspaceSlug, globalViewId, issueFilters, issuesFilter, storeType, updateFilters, projectId]
  );

  const handleOnDrop = useGroupIssuesDragNDrop(
    storeType as
      | EIssuesStoreType.PROJECT
      | EIssuesStoreType.MODULE
      | EIssuesStoreType.GLOBAL
      | EIssuesStoreType.BOARD
      | EIssuesStoreType.PROFILE,
    orderBy,
    group_by
  );

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

  const loadMoreIssues = useCallback(
    (groupId?: string) => {
      fetchNextIssues(groupId);
    },
    [fetchNextIssues]
  );

  if ((isLoading && issuesLoading && getIssueLoader() === "init-loader") || !globalViewId || !groupedIssueIds) {
    return <ListLayoutLoader />;
  }

  const { enableQuickAdd, enableIssueCreation } = viewFlags || {};

  return (
    <IssueLayoutHOC layout={EIssueLayoutTypes.LIST}>
      <div className="relative size-full bg-surface-2">
        <List
          issuesMap={issueMap}
          displayProperties={displayProperties}
          group_by={group_by}
          orderBy={orderBy}
          updateIssue={updateIssue}
          quickActions={renderQuickActions}
          groupedIssueIds={(groupedIssueIds ?? {}) as TGroupedIssues}
          loadMoreIssues={loadMoreIssues}
          showEmptyGroup={showEmptyGroup}
          enableIssueQuickAdd={!!enableQuickAdd}
          canEditProperties={canEditProperties}
          disableIssueCreation={!enableIssueCreation}
          handleOnDrop={handleOnDrop}
          handleCollapsedGroups={handleCollapsedGroups}
          collapsedGroups={collapsedGroups}
          addIssuesToView={addIssuesToView}
        />
      </div>
    </IssueLayoutHOC>
  );
});
