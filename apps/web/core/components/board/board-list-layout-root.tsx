import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@operoz/constants";
import { EIssueLayoutTypes, EIssuesStoreType } from "@operoz/types";
import { ListLayoutLoader } from "@/components/ui/loader/layouts/list-layout-loader";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
import { WorkspaceActiveLayout } from "@/components/views/helper";
import { BoardLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/board-level";
import { ListColumnsMenu } from "@/components/issues/issue-layouts/list/list-columns-menu";
import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row";
import { useIssues } from "@/hooks/store/use-issues";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
import { BoardHubContentPanel } from "@/components/board/board-hub-content-panel";

type Props = {
  isLoading?: boolean;
  toggleLoading: (value: boolean) => void;
};

export const BoardListLayoutRoot = observer(function BoardListLayoutRoot(props: Props) {
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
  const activeLayout: EIssueLayoutTypes = workItemFilters?.displayFilters?.layout ?? EIssueLayoutTypes.LIST;
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
    workspaceSlug && boardSlug ? `BOARD_LIST_ISSUES_${workspaceSlug}_${boardSlug}` : null,
    async () => {
      if (workspaceSlug && boardSlug) {
        clear();
        toggleLoading(true);
        await fetchFilters(workspaceSlug, boardSlug, { preferredLayout: EIssueLayoutTypes.LIST });
        await fetchIssues(workspaceSlug, boardSlug, groupedIssueIds ? "mutation" : "init-loader", {
          canGroup: true,
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
    return <ListLayoutLoader />;
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
              <div className="flex min-h-11 w-full shrink-0 items-center gap-2 border-b border-subtle">
                <div className="min-w-0 flex-1">
                  {boardWorkItemsFilter && <WorkItemFiltersRow filter={boardWorkItemsFilter} />}
                </div>
                {activeLayout === EIssueLayoutTypes.LIST && <ListColumnsMenu />}
              </div>
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
