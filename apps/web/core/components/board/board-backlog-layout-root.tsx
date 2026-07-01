import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@operoz/constants";
import { EIssueLayoutTypes, EIssuesStoreType } from "@operoz/types";
import { SpreadsheetLayoutLoader } from "@/components/ui/loader/layouts/spreadsheet-layout-loader";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
import { WorkspaceActiveLayout } from "@/components/views/helper";
import { BoardLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/board-level";
import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row";
import { useIssues } from "@/hooks/store/use-issues";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
import { BoardHubContentPanel } from "@/components/board/board-hub-content-panel";

type Props = {
  isLoading?: boolean;
  toggleLoading: (value: boolean) => void;
};

export const BoardBacklogLayoutRoot = observer(function BoardBacklogLayoutRoot(props: Props) {
  const { isLoading = false, toggleLoading } = props;
  const { workspaceSlug: routerWorkspaceSlug, boardSlug: routerBoardSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const boardSlug = routerBoardSlug?.toString();
  const searchParams = useSearchParams();

  const {
    issuesFilter: { filters, fetchFilters, updateFilterExpression },
    issues: { clear, groupedIssueIds, fetchIssues, fetchNextIssues, getIssueLoader },
  } = useIssues(EIssuesStoreType.BOARD);

  const workItemFilters = boardSlug ? filters?.[boardSlug] : undefined;
  const activeLayout: EIssueLayoutTypes = workItemFilters?.displayFilters?.layout ?? EIssueLayoutTypes.SPREADSHEET;

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

  const routeFilters: { [key: string]: string } = {};
  searchParams.forEach((value: string, key: string) => {
    routeFilters[key] = value;
  });

  const fetchNextPages = useCallback(() => {
    if (workspaceSlug && boardSlug) fetchNextIssues(workspaceSlug, boardSlug);
  }, [fetchNextIssues, workspaceSlug, boardSlug]);

  const { isLoading: issuesLoading } = useSWR(
    workspaceSlug && boardSlug ? `BOARD_BACKLOG_ISSUES_${workspaceSlug}_${boardSlug}` : null,
    async () => {
      if (workspaceSlug && boardSlug) {
        clear();
        toggleLoading(true);
        await fetchFilters(workspaceSlug, boardSlug, { preferredLayout: EIssueLayoutTypes.SPREADSHEET });
        await fetchIssues(workspaceSlug, boardSlug, groupedIssueIds ? "mutation" : "init-loader", {
          canGroup: false,
          perPageCount: 100,
        });
        toggleLoading(false);
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const filtersReady = Boolean(workItemFilters?.displayFilters);
  const issueLoader = getIssueLoader();
  const isInitLoader = issueLoader === "init-loader";
  const showLoader =
    !filtersReady || (isLoading && issuesLoading && isInitLoader) || (!groupedIssueIds && isInitLoader);
  if (!workspaceSlug || !boardSlug) return null;

  if (showLoader) {
    return <SpreadsheetLayoutLoader />;
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
            <div className="flex h-full w-full flex-col">
              {boardWorkItemsFilter ? (
                <div className="shrink-0 border-b border-subtle">
                  <WorkItemFiltersRow filter={boardWorkItemsFilter} />
                </div>
              ) : null}
              <div className="min-h-0 flex-1">
                <WorkspaceActiveLayout
                  activeLayout={activeLayout}
                  isDefaultView
                  isLoading={isLoading}
                  toggleLoading={toggleLoading}
                  workspaceSlug={workspaceSlug}
                  globalViewId={boardSlug}
                  routeFilters={routeFilters}
                  fetchNextPages={fetchNextPages}
                  globalViewsLoading={false}
                  issuesLoading={issuesLoading}
                />
              </div>
            </div>
            <IssuePeekOverview />
          </BoardHubContentPanel>
        )}
      </BoardLevelWorkItemFiltersHOC>
    </IssuesStoreContext.Provider>
  );
});
