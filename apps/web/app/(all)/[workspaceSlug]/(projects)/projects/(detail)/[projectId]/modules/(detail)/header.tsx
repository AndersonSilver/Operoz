import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChartNoAxesColumn, PanelRight, SlidersHorizontal } from "lucide-react";
import {
  EIssueFilterType,
  ISSUE_DISPLAY_FILTERS_BY_PAGE,
  EUserPermissions,
  EUserPermissionsLevel,
  WORK_ITEM_TRACKER_ELEMENTS,
} from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { IconButton } from "@operis/propel/icon-button";
import { ModuleIcon } from "@operis/propel/icons";
import { Tooltip } from "@operis/propel/tooltip";
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties } from "@operis/types";
import { EIssuesStoreType, EIssueLayoutTypes } from "@operis/types";
import { Header } from "@operis/ui";
import { cn } from "@operis/utils";
import { BOARD_HUB_TOOLBAR_CLUSTER } from "@/components/board/board-hub-background";
import { WorkItemsModal } from "@/components/analytics/work-items/modal";
import { CountChip } from "@/components/common/count-chip";
import {
  DisplayFiltersSelection,
  FiltersDropdown,
  LayoutSelection,
  MobileLayoutSelection,
} from "@/components/issues/issue-layouts/filters";
import { ModuleQuickActions } from "@/components/modules";
import {
  ProjectFeaturePageActions,
  ProjectFeaturePageHeader,
  ProjectFeaturePageTitle,
} from "@/components/project/project-feature-page-header";
import { ProjectHubModuleSearchSelect } from "@/components/project/project-hub-module-search-select";
import {
  ProjectHubPrimaryAction,
  ProjectHubToolbarDivider,
} from "@/components/project/project-hub-toolbar";
import { WorkItemFiltersToggle } from "@/components/work-item-filters/filters-toggle";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssues } from "@/hooks/store/use-issues";
import { useModule } from "@/hooks/store/use-module";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import useLocalStorage from "@/hooks/use-local-storage";
import { usePlatformOS } from "@/hooks/use-platform-os";

export const ModuleIssuesHeader = observer(function ModuleIssuesHeader() {
  const parentRef = useRef<HTMLDivElement>(null);
  const [analyticsModal, setAnalyticsModal] = useState(false);
  const router = useAppRouter();
  const { workspaceSlug, projectId, moduleId: routerModuleId } = useParams();
  const moduleId = routerModuleId ? routerModuleId.toString() : undefined;
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();
  const {
    issuesFilter,
    issues,
    issues: { getGroupIssueCount },
  } = useIssues(EIssuesStoreType.MODULE);
  const { updateFilters } = useIssuesActions(EIssuesStoreType.MODULE);
  const { projectModuleIds, getModuleById } = useModule();
  const { toggleCreateIssueModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  const { currentProjectDetails, loader } = useProject();
  const { setValue, storedValue } = useLocalStorage("module_sidebar_collapsed", "false");
  const isSidebarCollapsed = storedValue ? storedValue === "true" : false;
  const issueFilters = moduleId ? issuesFilter.getIssueFilters(moduleId) : undefined;
  const activeLayout = issueFilters?.displayFilters?.layout ?? EIssueLayoutTypes.LIST;
  const layoutDisplayFiltersOptions =
    ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.layoutOptions[activeLayout] ??
    ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.layoutOptions[EIssueLayoutTypes.LIST];
  const moduleDetails = moduleId ? getModuleById(moduleId) : undefined;
  const canUserCreateIssue = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );
  const workItemsCount = getGroupIssueCount(undefined, undefined, false);

  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>(moduleId ? [moduleId] : []);

  useEffect(() => {
    const scoped = issuesFilter?.scopedModuleIds;
    if (scoped?.length) {
      setSelectedModuleIds(scoped);
      return;
    }
    if (moduleId) setSelectedModuleIds([moduleId]);
  }, [moduleId, issuesFilter?.scopedModuleIds]);

  const handleModuleScopeChange = useCallback(
    (ids: string[]) => {
      if (!workspaceSlug || !projectId || !moduleId || ids.length === 0) return;

      const uniqueIds = [...new Set(ids)];
      setSelectedModuleIds(uniqueIds);

      if (uniqueIds.length === 1) {
        issuesFilter?.setScopedModuleIds(undefined);
        if (uniqueIds[0] !== moduleId) {
          router.push(`/${workspaceSlug}/projects/${projectId}/modules/${uniqueIds[0]}`);
          return;
        }
        void issues.fetchIssuesWithExistingPagination(workspaceSlug, projectId, "mutation", moduleId);
        return;
      }

      issuesFilter?.setScopedModuleIds(uniqueIds);
      if (!uniqueIds.includes(moduleId)) {
        router.push(`/${workspaceSlug}/projects/${projectId}/modules/${uniqueIds[0]}`);
        return;
      }
      void issues.fetchIssuesWithExistingPagination(workspaceSlug, projectId, "mutation", moduleId);
    },
    [workspaceSlug, projectId, moduleId, issuesFilter, issues, router]
  );

  const toggleSidebar = () => {
    setValue(`${!isSidebarCollapsed}`);
  };

  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
      if (!projectId) return;
      updateFilters(projectId.toString(), EIssueFilterType.DISPLAY_FILTERS, { layout: layout });
    },
    [projectId, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!projectId) return;
      updateFilters(projectId.toString(), EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter);
    },
    [projectId, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!projectId) return;
      updateFilters(projectId.toString(), EIssueFilterType.DISPLAY_PROPERTIES, property);
    },
    [projectId, updateFilters]
  );

  const showModuleSearch = Boolean(projectModuleIds && projectModuleIds.length > 1);

  return (
    <>
      <WorkItemsModal
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        moduleDetails={moduleDetails ?? undefined}
        projectDetails={currentProjectDetails}
      />
      <ProjectFeaturePageHeader>
        <Header.LeftItem className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2.5">
            <ProjectFeaturePageTitle
              title={moduleDetails?.name}
              icon={<ModuleIcon className="size-4 text-secondary" strokeWidth={1.75} />}
              isLoading={loader === "init-loader"}
            />
            {workItemsCount && workItemsCount > 0 ? (
              <Tooltip
                isMobile={isMobile}
                tooltipContent={t("project_modules.detail.work_items_count_tooltip", { count: workItemsCount })}
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
              <div className="hidden items-center gap-2 md:flex">
                {showModuleSearch ? (
                  <>
                    <ProjectHubModuleSearchSelect
                      variant="toolbar"
                      moduleIds={projectModuleIds ?? []}
                      getModuleById={getModuleById}
                      value={selectedModuleIds}
                      onChange={handleModuleScopeChange}
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
                {moduleId && <WorkItemFiltersToggle entityType={EIssuesStoreType.MODULE} entityId={moduleId} />}
                <FiltersDropdown
                  title={t("common.display")}
                  placement="bottom-end"
                  miniIcon={<SlidersHorizontal className="size-3.5" />}
                  appearance="hub"
                >
                  <DisplayFiltersSelection
                    layoutDisplayFiltersOptions={layoutDisplayFiltersOptions}
                    displayFilters={issueFilters?.displayFilters ?? {}}
                    handleDisplayFiltersUpdate={handleDisplayFilters}
                    displayProperties={issueFilters?.displayProperties ?? {}}
                    handleDisplayPropertiesUpdate={handleDisplayProperties}
                    ignoreGroupedFilters={["module"]}
                    cycleViewDisabled={!currentProjectDetails?.cycle_view}
                    moduleViewDisabled={!currentProjectDetails?.module_view}
                  />
                </FiltersDropdown>
              </div>

              {canUserCreateIssue ? (
                <>
                  <Button
                    className="hidden md:flex"
                    onClick={() => setAnalyticsModal(true)}
                    variant="secondary"
                    size="lg"
                  >
                    <span className="hidden @4xl:flex">{t("common.analytics")}</span>
                    <span className="@4xl:hidden">
                      <ChartNoAxesColumn className="size-3.5" />
                    </span>
                  </Button>
                  <ProjectHubPrimaryAction
                    className="hidden sm:flex shrink-0"
                    onClick={() => {
                      toggleCreateIssueModal(true, EIssuesStoreType.MODULE);
                    }}
                    data-ph-element={WORK_ITEM_TRACKER_ELEMENTS.HEADER_ADD_BUTTON.MODULE}
                  >
                    <span className="sm:hidden">{t("add")}</span>
                    <span className="hidden sm:inline">{t("issue.add.label")}</span>
                  </ProjectHubPrimaryAction>
                </>
              ) : null}
              <IconButton
                variant="tertiary"
                size="lg"
                icon={PanelRight}
                onClick={toggleSidebar}
                className={cn({
                  "bg-accent-subtle text-accent-primary": !isSidebarCollapsed,
                })}
              />
              {moduleId && (
                <ModuleQuickActions
                  parentRef={parentRef}
                  moduleId={moduleId}
                  projectId={projectId.toString()}
                  workspaceSlug={workspaceSlug.toString()}
                  customClassName="flex size-[26px] shrink-0 items-center justify-center rounded-sm"
                />
              )}
            </div>
          </ProjectFeaturePageActions>
        </Header.RightItem>
      </ProjectFeaturePageHeader>
    </>
  );
});
