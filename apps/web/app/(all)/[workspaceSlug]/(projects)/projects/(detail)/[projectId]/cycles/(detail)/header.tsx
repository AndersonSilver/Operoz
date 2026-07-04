import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { ChartNoAxesColumn, PanelRight, SlidersHorizontal } from "lucide-react";
// plane imports
import {
  EIssueFilterType,
  EUserPermissions,
  EUserPermissionsLevel,
  ISSUE_DISPLAY_FILTERS_BY_PAGE,
  WORK_ITEM_TRACKER_ELEMENTS,
} from "@operoz/constants";
import { usePlatformOS } from "@operoz/hooks";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { IconButton } from "@operoz/propel/icon-button";
import { CycleIcon } from "@operoz/propel/icons";
import { Tooltip } from "@operoz/propel/tooltip";
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties, IModule } from "@operoz/types";
import { EIssuesStoreType, EIssueLayoutTypes } from "@operoz/types";
import { Header } from "@operoz/ui";
import { cn } from "@operoz/utils";
// components
import { BOARD_HUB_TOOLBAR_CLUSTER } from "@/components/board/board-hub-background";
import { WorkItemsModal } from "@/components/analytics/work-items/modal";
import { CountChip } from "@/components/common/count-chip";
import { CycleQuickActions } from "@/components/cycles/quick-actions";
import {
  DisplayFiltersSelection,
  FiltersDropdown,
  LayoutSelection,
  MobileLayoutSelection,
} from "@/components/issues/issue-layouts/filters";
import {
  ProjectFeaturePageActions,
  ProjectFeaturePageHeader,
  ProjectFeaturePageTitle,
} from "@/components/project/project-feature-page-header";
import { ProjectHubModuleSearchSelect } from "@/components/project/project-hub-module-search-select";
import { ProjectHubPrimaryAction, ProjectHubToolbarDivider } from "@/components/project/project-hub-toolbar";
import { WorkItemFiltersToggle } from "@/components/work-item-filters/filters-toggle";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import useLocalStorage from "@/hooks/use-local-storage";

export const CycleIssuesHeader = observer(function CycleIssuesHeader() {
  // refs
  const parentRef = useRef<HTMLDivElement>(null);
  // states
  const [analyticsModal, setAnalyticsModal] = useState(false);
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId, cycleId } = useParams();
  // i18n
  const { t } = useTranslation();
  // store hooks
  const {
    issuesFilter: { issueFilters, updateFilters },
    issues: { getGroupIssueCount },
  } = useIssues(EIssuesStoreType.CYCLE);
  const { currentProjectCycleIds, getCycleById } = useCycle();
  const { toggleCreateIssueModal } = useCommandPalette();
  const { currentProjectDetails, loader } = useProject();
  const { isMobile } = usePlatformOS();
  const { allowPermissions } = useUserPermissions();

  const activeLayout = issueFilters?.displayFilters?.layout;

  const { setValue, storedValue } = useLocalStorage("cycle_sidebar_collapsed", false);

  const isSidebarCollapsed = storedValue ? (storedValue === true ? true : false) : false;
  const toggleSidebar = () => {
    setValue(!isSidebarCollapsed);
  };

  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, { layout: layout }, cycleId);
    },
    [workspaceSlug, projectId, cycleId, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter, cycleId);
    },
    [workspaceSlug, projectId, cycleId, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_PROPERTIES, property, cycleId);
    },
    [workspaceSlug, projectId, cycleId, updateFilters]
  );

  // derived values
  const cycleDetails = cycleId ? getCycleById(cycleId.toString()) : undefined;
  const isCompletedCycle = cycleDetails?.status?.toLocaleLowerCase() === "completed";
  const canUserCreateIssue = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  const showCycleSearch = Boolean(currentProjectCycleIds && currentProjectCycleIds.length > 1);

  const workItemsCount = getGroupIssueCount(undefined, undefined, false);

  if (!cycleDetails || !workspaceSlug || !projectId || !cycleId) return null;

  return (
    <>
      <WorkItemsModal
        projectDetails={currentProjectDetails}
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        cycleDetails={cycleDetails ?? undefined}
      />
      <ProjectFeaturePageHeader>
        <Header.LeftItem className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2.5">
            <ProjectFeaturePageTitle
              title={cycleDetails.name}
              icon={<CycleIcon className="size-4 text-secondary" strokeWidth={1.75} />}
              isLoading={loader === "init-loader"}
            />
            {workItemsCount && workItemsCount > 0 ? (
              <Tooltip
                isMobile={isMobile}
                tooltipContent={`There are ${workItemsCount} ${
                  workItemsCount > 1 ? "work items" : "work item"
                } in this cycle`}
                position="bottom"
              >
                <CountChip count={workItemsCount} />
              </Tooltip>
            ) : null}
          </div>
        </Header.LeftItem>
        <Header.RightItem className="shrink-0">
          <ProjectFeaturePageActions>
            <div className={cn("flex flex-wrap items-center justify-end gap-2", BOARD_HUB_TOOLBAR_CLUSTER)}>
              <div className="shadow-sm hidden items-center gap-2.5 rounded-md border border-subtle/60 bg-layer-2/70 px-2.5 py-1.5 backdrop-blur-sm md:flex">
                {showCycleSearch ? (
                  <>
                    <ProjectHubModuleSearchSelect
                      variant="toolbar"
                      multiple={false}
                      labelIcon={CycleIcon}
                      moduleIds={currentProjectCycleIds ?? []}
                      getModuleById={(id) => {
                        const cycle = getCycleById(id);
                        if (!cycle) return null;
                        return { id: cycle.id, name: cycle.name } as unknown as IModule;
                      }}
                      value={cycleId.toString()}
                      onChange={(next) => {
                        const id = Array.isArray(next) ? next[0] : next;
                        if (id && id !== cycleId) {
                          router.push(`/${workspaceSlug}/projects/${projectId}/cycles/${id}`);
                        }
                      }}
                      disabled={loader === "init-loader"}
                    />
                    <ProjectHubToolbarDivider />
                  </>
                ) : null}
                <div className="hidden @4xl:flex">
                  <LayoutSelection
                    layouts={[
                      EIssueLayoutTypes.LIST,
                      EIssueLayoutTypes.KANBAN,
                      EIssueLayoutTypes.CALENDAR,
                      EIssueLayoutTypes.SPREADSHEET,
                      EIssueLayoutTypes.GANTT,
                    ]}
                    onChange={(layout) => handleLayoutChange(layout)}
                    selectedLayout={activeLayout}
                  />
                </div>
                <div className="flex @4xl:hidden">
                  <MobileLayoutSelection
                    layouts={[
                      EIssueLayoutTypes.LIST,
                      EIssueLayoutTypes.KANBAN,
                      EIssueLayoutTypes.CALENDAR,
                      EIssueLayoutTypes.SPREADSHEET,
                      EIssueLayoutTypes.GANTT,
                    ]}
                    onChange={(layout) => handleLayoutChange(layout)}
                    activeLayout={activeLayout}
                  />
                </div>
                <WorkItemFiltersToggle entityType={EIssuesStoreType.CYCLE} entityId={cycleId} />
                <FiltersDropdown
                  title={t("common.display")}
                  placement="bottom-end"
                  miniIcon={<SlidersHorizontal className="size-3.5" />}
                  appearance="hub"
                >
                  <DisplayFiltersSelection
                    layoutDisplayFiltersOptions={
                      activeLayout ? ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.layoutOptions[activeLayout] : undefined
                    }
                    displayFilters={issueFilters?.displayFilters ?? {}}
                    handleDisplayFiltersUpdate={handleDisplayFilters}
                    displayProperties={issueFilters?.displayProperties ?? {}}
                    handleDisplayPropertiesUpdate={handleDisplayProperties}
                    ignoreGroupedFilters={["cycle"]}
                    cycleViewDisabled={!currentProjectDetails?.cycle_view}
                    moduleViewDisabled={!currentProjectDetails?.module_view}
                  />
                </FiltersDropdown>
              </div>

              {canUserCreateIssue && (
                <>
                  <Button
                    className="hidden md:flex"
                    onClick={() => setAnalyticsModal(true)}
                    variant="secondary"
                    size="lg"
                  >
                    <span className="hidden @4xl:flex">Analytics</span>
                    <span className="@4xl:hidden">
                      <ChartNoAxesColumn className="size-3.5" />
                    </span>
                  </Button>
                  {!isCompletedCycle && (
                    <ProjectHubPrimaryAction
                      className="hidden shrink-0 sm:flex"
                      onClick={() => {
                        toggleCreateIssueModal(true, EIssuesStoreType.CYCLE);
                      }}
                      data-ph-element={WORK_ITEM_TRACKER_ELEMENTS.HEADER_ADD_BUTTON.CYCLE}
                    >
                      <span className="sm:hidden">{t("add")}</span>
                      <span className="hidden sm:inline">{t("issue.add.label")}</span>
                    </ProjectHubPrimaryAction>
                  )}
                </>
              )}
              <IconButton
                variant="tertiary"
                size="lg"
                icon={PanelRight}
                onClick={toggleSidebar}
                className={cn({
                  "bg-accent-subtle text-accent-primary": !isSidebarCollapsed,
                })}
              />
              <CycleQuickActions
                parentRef={parentRef}
                cycleId={cycleId}
                projectId={projectId}
                workspaceSlug={workspaceSlug}
                customClassName="flex size-[26px] shrink-0 items-center justify-center rounded-sm"
              />
            </div>
          </ProjectFeaturePageActions>
        </Header.RightItem>
      </ProjectFeaturePageHeader>
    </>
  );
});
