import { useCallback, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import {
  EIssueFilterType,
  ISSUE_DISPLAY_FILTERS_BY_PAGE,
  EUserPermissions,
  EUserPermissionsLevel,
  WORK_ITEM_TRACKER_ELEMENTS,
} from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { LockIcon, ViewsIcon } from "@operis/propel/icons";
import { Tooltip } from "@operis/propel/tooltip";
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties, IModule } from "@operis/types";
import { EIssuesStoreType, EViewAccess, EIssueLayoutTypes } from "@operis/types";
import { Header } from "@operis/ui";
import { cn } from "@operis/utils";
import { BOARD_HUB_TOOLBAR_CLUSTER } from "@/components/board/board-hub-background";
import { CountChip } from "@/components/common/count-chip";
import { SwitcherIcon } from "@/components/common/switcher-label";
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
import { ViewQuickActions } from "@/components/views/quick-actions";
import { WorkItemFiltersToggle } from "@/components/work-item-filters/filters-toggle";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useProjectView } from "@/hooks/store/use-project-view";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { usePlatformOS } from "@/hooks/use-platform-os";

export const ProjectViewIssuesHeader = observer(function ProjectViewIssuesHeader() {
  const parentRef = useRef<HTMLDivElement>(null);
  const router = useAppRouter();
  const { workspaceSlug, projectId, viewId: routerViewId } = useParams();
  const viewId = routerViewId ? routerViewId.toString() : undefined;
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();
  const {
    issuesFilter,
    issues: { getGroupIssueCount },
  } = useIssues(EIssuesStoreType.PROJECT_VIEW);
  const { updateFilters } = useIssuesActions(EIssuesStoreType.PROJECT_VIEW);
  const { toggleCreateIssueModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  const { currentProjectDetails, loader } = useProject();
  const { projectViewIds, getViewById } = useProjectView();

  const issueFilters = viewId ? issuesFilter?.getIssueFilters(viewId) : undefined;
  const activeLayout = issueFilters?.displayFilters?.layout ?? EIssueLayoutTypes.LIST;
  const layoutDisplayFiltersOptions =
    ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.layoutOptions[activeLayout] ??
    ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.layoutOptions[EIssueLayoutTypes.LIST];
  const viewDetails = viewId ? getViewById(viewId) : undefined;
  const workItemsCount = getGroupIssueCount(undefined, undefined, false);

  const canUserCreateIssue = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
      if (!workspaceSlug || !projectId || !viewId) return;
      updateFilters(projectId.toString(), EIssueFilterType.DISPLAY_FILTERS, { layout });
    },
    [workspaceSlug, projectId, viewId, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId || !viewId) return;
      updateFilters(projectId.toString(), EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter);
    },
    [workspaceSlug, projectId, viewId, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !projectId || !viewId) return;
      updateFilters(projectId.toString(), EIssueFilterType.DISPLAY_PROPERTIES, property);
    },
    [workspaceSlug, projectId, viewId, updateFilters]
  );

  const showViewSearch = Boolean(projectViewIds && projectViewIds.length > 1 && viewId);

  if (!viewDetails || !workspaceSlug || !projectId || !viewId) return null;

  const viewIcon = (
    <SwitcherIcon logo_props={viewDetails.logo_props} LabelIcon={ViewsIcon} size={16} />
  );

  return (
    <ProjectFeaturePageHeader>
      <Header.LeftItem className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2.5">
          <ProjectFeaturePageTitle
            title={viewDetails.name}
            icon={viewIcon}
            isLoading={loader === "init-loader"}
            trailing={
              viewDetails.access === EViewAccess.PRIVATE ? (
                <Tooltip tooltipContent="Privada" position="bottom">
                  <span className="text-tertiary">
                    <LockIcon className="size-4" />
                  </span>
                </Tooltip>
              ) : null
            }
          />
          {workItemsCount && workItemsCount > 0 ? (
            <Tooltip
              isMobile={isMobile}
              tooltipContent={t("project_views.detail.work_items_count_tooltip", { count: workItemsCount })}
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
              {showViewSearch ? (
                <>
                  <ProjectHubModuleSearchSelect
                    variant="toolbar"
                    multiple={false}
                    labelIcon={ViewsIcon}
                    moduleIds={projectViewIds ?? []}
                    getModuleById={(id) => {
                      const view = getViewById(id);
                      if (!view) return null;
                      return { id: view.id, name: view.name } as IModule;
                    }}
                    value={viewId}
                    searchPlaceholder={t("project_views.detail.view_search_placeholder")}
                    onChange={(next) => {
                      const id = Array.isArray(next) ? next[0] : next;
                      if (id && id !== viewId) {
                        router.push(`/${workspaceSlug}/projects/${projectId}/views/${id}`);
                      }
                    }}
                    disabled={loader === "init-loader" || viewDetails.is_locked}
                  />
                  <ProjectHubToolbarDivider />
                </>
              ) : null}
              {!viewDetails.is_locked ? (
                <>
                  <div className="hidden @4xl:flex">
                    <LayoutSelection
                      layouts={[
                        EIssueLayoutTypes.LIST,
                        EIssueLayoutTypes.KANBAN,
                        EIssueLayoutTypes.CALENDAR,
                        EIssueLayoutTypes.SPREADSHEET,
                        EIssueLayoutTypes.GANTT,
                      ]}
                      onChange={handleLayoutChange}
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
                      onChange={handleLayoutChange}
                      activeLayout={activeLayout}
                    />
                  </div>
                </>
              ) : null}
              <WorkItemFiltersToggle entityType={EIssuesStoreType.PROJECT_VIEW} entityId={viewId} />
              {!viewDetails.is_locked ? (
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
                    cycleViewDisabled={!currentProjectDetails?.cycle_view}
                    moduleViewDisabled={!currentProjectDetails?.module_view}
                  />
                </FiltersDropdown>
              ) : null}
            </div>
            {canUserCreateIssue && !viewDetails.is_locked ? (
              <ProjectHubPrimaryAction
                className="hidden sm:flex shrink-0"
                onClick={() => toggleCreateIssueModal(true, EIssuesStoreType.PROJECT_VIEW)}
                data-ph-element={WORK_ITEM_TRACKER_ELEMENTS.HEADER_ADD_BUTTON.PROJECT_VIEW}
              >
                <span className="sm:hidden">{t("add")}</span>
                <span className="hidden sm:inline">{t("issue.add.label")}</span>
              </ProjectHubPrimaryAction>
            ) : null}
            <ViewQuickActions
              parentRef={parentRef}
              customClassName="flex size-[26px] shrink-0 items-center justify-center rounded-sm"
              projectId={projectId.toString()}
              view={viewDetails}
              workspaceSlug={workspaceSlug.toString()}
            />
          </div>
        </ProjectFeaturePageActions>
      </Header.RightItem>
    </ProjectFeaturePageHeader>
  );
});
