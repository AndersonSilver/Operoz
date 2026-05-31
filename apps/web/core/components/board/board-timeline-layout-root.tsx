import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@operis/constants";
import { EIssueLayoutTypes, EIssuesStoreType } from "@operis/types";
import { GanttLayoutLoader } from "@/components/ui/loader/layouts/gantt-layout-loader";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
import { BoardGanttRoot } from "@/components/issues/issue-layouts/gantt/roots/board-root";
import { useBoardLayout } from "@/components/board/board-layout-context";
import { BoardHubContentPanel } from "@/components/board/board-hub-content-panel";
import { BoardLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/board-level";
import { WORKSPACE_STATES } from "@/constants/fetch-keys";
import { useIssues } from "@/hooks/store/use-issues";
import { useProjectState } from "@/hooks/store/use-project-state";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";

export const BoardTimelineLayoutRoot = observer(function BoardTimelineLayoutRoot() {
  const { workspaceSlug, boardSlug } = useBoardLayout();
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const {
    issuesFilter: { filters, fetchFilters, updateFilterExpression },
    issues: { clear, fetchIssues, getIssueLoader },
  } = useIssues(EIssuesStoreType.BOARD);

  const { workspaceStates, fetchWorkspaceStates } = useProjectState();

  const workItemFilters = boardSlug ? filters?.[boardSlug] : undefined;

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
      await fetchFilters(workspaceSlug, boardSlug, { preferredLayout: EIssueLayoutTypes.GANTT });
      if (cancelled) return;
      await fetchIssues(workspaceSlug, boardSlug, "init-loader", {
        canGroup: false,
        perPageCount: 100,
      });
      if (!cancelled) setIsBootstrapping(false);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- evita loop: fetchFilters/fetchIssues mudam de referência
  }, [boardSlug, workspaceSlug]);

  const filtersReady = Boolean(workItemFilters?.displayFilters);
  const isInitLoader = getIssueLoader() === "init-loader";
  const showLoader = isBootstrapping || !filtersReady || isInitLoader;

  if (!workspaceSlug || !boardSlug) return null;

  if (showLoader) {
    return <GanttLayoutLoader />;
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
            <div className="min-h-0 flex-1">
              <BoardGanttRoot
                viewId={boardSlug}
                workItemsFilter={boardWorkItemsFilter}
                bootstrapDisplayFilters={workItemFilters?.displayFilters}
              />
            </div>
            <IssuePeekOverview />
          </BoardHubContentPanel>
        )}
      </BoardLevelWorkItemFiltersHOC>
    </IssuesStoreContext.Provider>
  );
});
