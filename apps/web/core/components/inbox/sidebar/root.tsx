import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import { EmptyStateDetailed } from "@operoz/propel/empty-state";
import type { TInboxIssueCurrentTab, THubMode } from "@operoz/types";
import { EInboxIssueCurrentTab, EHubMode } from "@operoz/types";
import { getInboxHubIssueUrl } from "@/utils/inbox-hub";
// plane imports
import { Header, Loader, EHeaderVariant } from "@operoz/ui";
import { cn } from "@operoz/utils";
import { BOARD_HUB_GLASS_HEADER, useBoardHubHasBackground } from "@/components/board/board-hub-background";
// components
import { InboxSidebarLoader } from "@/components/ui/loader/layouts/project-inbox/inbox-sidebar-loader";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
// local imports
import { FiltersRoot } from "../inbox-filter";
import { InboxIssueAppliedFilters } from "../inbox-filter/applied-filters/root";
import { InboxIssueList } from "./inbox-list";
import { InboxQueueScope } from "./queue-scope";
import { InboxSupportQueueFilter } from "./support-queue-filter";

type IInboxSidebarProps = {
  hubMode: THubMode;
  workspaceSlug: string;
  projectId: string;
  inboxIssueId: string | undefined;
  setIsMobileSidebar: (value: boolean) => void;
};

const supportTabNavigationOptions: { key: TInboxIssueCurrentTab; i18n_label: string }[] = [
  { key: EInboxIssueCurrentTab.OPEN, i18n_label: "inbox_issue.tabs_support.open" },
  { key: EInboxIssueCurrentTab.IN_PROGRESS, i18n_label: "inbox_issue.tabs.in_progress" },
  { key: EInboxIssueCurrentTab.CLOSED, i18n_label: "inbox_issue.tabs.closed" },
];

const intakeTabNavigationOptions: { key: TInboxIssueCurrentTab; i18n_label: string }[] = [
  { key: EInboxIssueCurrentTab.OPEN, i18n_label: "inbox_issue.tabs.open" },
  { key: EInboxIssueCurrentTab.CLOSED, i18n_label: "inbox_issue.tabs.closed" },
];

export const InboxSidebar = observer(function InboxSidebar(props: IInboxSidebarProps) {
  const { hubMode, workspaceSlug, projectId, inboxIssueId, setIsMobileSidebar } = props;
  // router
  const router = useAppRouter();
  // ref
  const containerRef = useRef<HTMLDivElement>(null);
  const [elementRef, setElementRef] = useState<HTMLDivElement | null>(null);
  // plane hooks
  const { t } = useTranslation();
  // store
  const { currentProjectDetails } = useProject();
  const {
    currentTab,
    handleCurrentTab,
    loader,
    filteredInboxIssueIds,
    inboxIssuePaginationInfo,
    fetchInboxPaginationIssues,
    getAppliedFiltersCount,
  } = useProjectInbox();
  const hasBoardWallpaper = useBoardHubHasBackground();
  const isSupportHub = hubMode === EHubMode.SUPPORT;
  const tabNavigationOptions = isSupportHub ? supportTabNavigationOptions : intakeTabNavigationOptions;
  const hubIssueUrl = (params?: { currentTab?: string; inboxIssueId?: string }) =>
    getInboxHubIssueUrl(workspaceSlug, projectId, hubMode, params);
  // derived values
  const fetchNextPages = useCallback(() => {
    if (!workspaceSlug || !projectId) return;
    fetchInboxPaginationIssues(workspaceSlug.toString(), projectId.toString());
  }, [workspaceSlug, projectId, fetchInboxPaginationIssues]);

  // page observer
  useIntersectionObserver(containerRef, elementRef, fetchNextPages, "20%");

  useEffect(() => {
    if (workspaceSlug && projectId && currentTab && filteredInboxIssueIds.length > 0) {
      if (inboxIssueId === undefined) {
        router.push(hubIssueUrl({ currentTab, inboxIssueId: filteredInboxIssueIds[0] }));
      }
    }
  }, [currentTab, filteredInboxIssueIds, hubMode, inboxIssueId, projectId, router, workspaceSlug]);

  return (
    <div className="h-full w-full flex-shrink-0">
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <Header
          variant={EHeaderVariant.SECONDARY}
          className={cn(hasBoardWallpaper && cn("!bg-transparent", BOARD_HUB_GLASS_HEADER))}
        >
          {tabNavigationOptions.map((option) => (
            <div
              key={option?.key}
              className={cn(
                `relative flex h-full cursor-pointer items-center gap-1 px-3 text-13 font-medium transition-all`,
                currentTab === option?.key ? `text-accent-primary` : `hover:text-secondary`
              )}
              onClick={() => {
                if (currentTab != option?.key) {
                  handleCurrentTab(workspaceSlug, projectId, option?.key);
                  router.push(hubIssueUrl({ currentTab: option?.key }));
                }
              }}
            >
              <div>{t(option?.i18n_label)}</div>
              {option?.key === "open" && currentTab === option?.key && (
                <div className="rounded-full bg-accent-primary/20 p-1.5 py-0.5 text-11 font-semibold text-accent-primary">
                  {inboxIssuePaginationInfo?.total_results || 0}
                </div>
              )}
              <div
                className={cn(
                  `absolute right-0 bottom-0 left-0 rounded-t-md border`,
                  currentTab === option?.key ? `border-accent-strong` : `border-transparent`
                )}
              />
            </div>
          ))}
          <div className="m-auto mr-0">
            <FiltersRoot />
          </div>
        </Header>
        <InboxIssueAppliedFilters />
        {isSupportHub && currentTab === EInboxIssueCurrentTab.OPEN && <InboxQueueScope />}
        {isSupportHub && currentTab === EInboxIssueCurrentTab.IN_PROGRESS && (
          <InboxSupportQueueFilter workspaceSlug={workspaceSlug} projectId={projectId} />
        )}

        {loader != undefined && loader === "filter-loading" && !inboxIssuePaginationInfo?.next_page_results ? (
          <InboxSidebarLoader />
        ) : (
          <div
            className="vertical-scrollbar scrollbar-md h-full w-full overflow-hidden overflow-y-auto"
            ref={containerRef}
          >
            {filteredInboxIssueIds.length > 0 ? (
              <InboxIssueList
                setIsMobileSidebar={setIsMobileSidebar}
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                projectIdentifier={currentProjectDetails?.identifier}
                inboxIssueIds={filteredInboxIssueIds}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                {getAppliedFiltersCount > 0 ? (
                  <EmptyStateDetailed
                    assetKey="search"
                    title={t("common_empty_state.search.title")}
                    description={t("common_empty_state.search.description")}
                    assetClassName="size-20"
                    rootClassName="px-page-x"
                  />
                ) : currentTab === EInboxIssueCurrentTab.OPEN ? (
                  <EmptyStateDetailed
                    assetKey="inbox"
                    title={t("inbox_issue.empty_state.sidebar_open_tab.title")}
                    description={t("inbox_issue.empty_state.sidebar_open_tab.description")}
                    assetClassName="size-20"
                    actions={[
                      {
                        label: t("project_empty_state.intake_sidebar.cta_primary"),
                        onClick: () => router.push(hubIssueUrl()),
                        variant: "primary",
                      },
                    ]}
                    rootClassName="px-page-x"
                  />
                ) : currentTab === EInboxIssueCurrentTab.IN_PROGRESS ? (
                  <EmptyStateDetailed
                    assetKey="inbox"
                    title={t("inbox_issue.empty_state.sidebar_in_progress_tab.title")}
                    description={t("inbox_issue.empty_state.sidebar_in_progress_tab.description")}
                    assetClassName="size-20"
                    rootClassName="px-page-x"
                  />
                ) : (
                  <EmptyStateDetailed
                    assetKey="inbox"
                    title={t("inbox_issue.empty_state.sidebar_closed_tab.title")}
                    description={t("inbox_issue.empty_state.sidebar_closed_tab.description")}
                    assetClassName="size-20"
                    rootClassName="px-page-x"
                  />
                )}
              </div>
            )}
            <div ref={setElementRef}>
              {inboxIssuePaginationInfo?.next_page_results && (
                <Loader className="mx-auto w-full space-y-4 px-2 py-4">
                  <Loader.Item height="64px" width="w-100" />
                  <Loader.Item height="64px" width="w-100" />
                </Loader>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
