/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { useBoardLayout } from "@/components/board/board-layout-context";
import { ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { EIssueLayoutTypes, EIssuesStoreType } from "@plane/types";
import { KanbanLayoutLoader } from "@/components/ui/loader/layouts/kanban-layout-loader";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
import { WorkspaceKanbanRoot } from "@/components/issues/issue-layouts/kanban/roots/workspace-root";
import { BoardLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/board-level";
import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row";
import { WORKSPACE_STATES } from "@/constants/fetch-keys";
import { useIssues } from "@/hooks/store/use-issues";
import { useProjectState } from "@/hooks/store/use-project-state";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
import { BoardHubContentPanel } from "@/components/board/board-hub-content-panel";

export const BoardViewsLayoutRoot = observer(function BoardViewsLayoutRoot() {
  const { workspaceSlug, boardSlug } = useBoardLayout();
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const {
    issuesFilter: { filters, fetchFilters, updateFilterExpression },
    issues: { clear, groupedIssueIds, fetchIssues, getIssueLoader },
  } = useIssues(EIssuesStoreType.BOARD);

  const { workspaceStates, fetchWorkspaceStates } = useProjectState();

  const workItemFilters = boardSlug ? filters?.[boardSlug] : undefined;
  const groupByWorkspaceState = workItemFilters?.displayFilters?.group_by === "state";

  useSWR(
    workspaceSlug && workspaceStates === undefined ? WORKSPACE_STATES(workspaceSlug) : null,
    () => fetchWorkspaceStates(workspaceSlug!),
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const initialWorkItemFilters = useMemo(() => {
    if (!boardSlug || !workItemFilters?.displayFilters) return undefined;
    return {
      displayFilters: workItemFilters.displayFilters,
      displayProperties: workItemFilters.displayProperties,
      kanbanFilters: workItemFilters.kanbanFilters,
      richFilters: workItemFilters.richFilters ?? {},
    };
  }, [boardSlug, workItemFilters]);

  useWorkspaceIssueProperties(workspaceSlug);

  useEffect(() => {
    if (!workspaceSlug || !boardSlug) return;

    let cancelled = false;
    setIsBootstrapping(true);

    void (async () => {
      clear();
      await fetchFilters(workspaceSlug, boardSlug, { preferredLayout: EIssueLayoutTypes.KANBAN });
      if (cancelled) return;
      await fetchIssues(workspaceSlug, boardSlug, "init-loader", {
        canGroup: true,
        perPageCount: 30,
      });
      if (!cancelled) setIsBootstrapping(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [boardSlug, clear, fetchFilters, fetchIssues, workspaceSlug]);

  const filtersReady = Boolean(workItemFilters?.displayFilters);
  const statesPending = groupByWorkspaceState && workspaceStates === undefined;
  const issueLoader = getIssueLoader();
  const isInitLoader = issueLoader === "init-loader";
  const showLoader =
    isBootstrapping ||
    !filtersReady ||
    (isInitLoader && (!groupedIssueIds || statesPending));
  if (!workspaceSlug || !boardSlug) return null;

  if (showLoader) {
    return <KanbanLayoutLoader />;
  }

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.BOARD}>
      <BoardLevelWorkItemFiltersHOC
        entityId={boardSlug}
        entityType={EIssuesStoreType.BOARD}
        boardSlug={boardSlug}
        showOnMount
        filtersToShowByLayout={ISSUE_DISPLAY_FILTERS_BY_PAGE.board_backlog.filters}
        initialWorkItemFilters={initialWorkItemFilters}
        updateFilters={updateFilterExpression.bind(updateFilterExpression, workspaceSlug, boardSlug)}
        workspaceSlug={workspaceSlug}
      >
        {({ filter: boardWorkItemsFilter }) => (
          <BoardHubContentPanel>
            {boardWorkItemsFilter ? (
              <div className="shrink-0 border-b border-subtle">
                <WorkItemFiltersRow filter={boardWorkItemsFilter} />
              </div>
            ) : null}
            <div className="min-h-0 flex-1">
              <WorkspaceKanbanRoot viewId={boardSlug} />
            </div>
            <IssuePeekOverview />
          </BoardHubContentPanel>
        )}
      </BoardLevelWorkItemFiltersHOC>
    </IssuesStoreContext.Provider>
  );
});
