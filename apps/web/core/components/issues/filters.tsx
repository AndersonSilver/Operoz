import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import { ChartNoAxesColumn, SlidersHorizontal } from "lucide-react";
// plane imports
import { EIssueFilterType, ISSUE_STORE_TO_FILTERS_MAP } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties } from "@operoz/types";
import { EIssueLayoutTypes, EIssuesStoreType } from "@operoz/types";
import { cn } from "@operoz/utils";
import {
  ProjectHubPrimaryAction,
  ProjectHubToolbar,
  ProjectHubToolbarDivider,
  ProjectHubToolbarSegment,
  PROJECT_HUB_GHOST_BUTTON_CLASS,
} from "@/components/project/project-hub-toolbar";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
// plane web imports
import type { TProject } from "@/plane-web/types";
// local imports
import { WorkItemsModal } from "../analytics/work-items/modal";
import { WorkItemFiltersToggle } from "../work-item-filters/filters-toggle";
import {
  DisplayFiltersSelection,
  FiltersDropdown,
  LayoutSelection,
  MobileLayoutSelection,
} from "./issue-layouts/filters";

type Props = {
  currentProjectDetails: TProject | undefined;
  projectId: string;
  workspaceSlug: string;
  canUserCreateIssue: boolean | undefined;
  storeType?: EIssuesStoreType.PROJECT | EIssuesStoreType.EPIC;
  onAddIssue?: () => void;
  addIssueTrackerElement?: string;
};

const LAYOUTS = [
  EIssueLayoutTypes.LIST,
  EIssueLayoutTypes.KANBAN,
  EIssueLayoutTypes.CALENDAR,
  EIssueLayoutTypes.SPREADSHEET,
  EIssueLayoutTypes.GANTT,
];

export const HeaderFilters = observer(function HeaderFilters(props: Props) {
  const {
    currentProjectDetails,
    projectId,
    workspaceSlug,
    canUserCreateIssue,
    storeType = EIssuesStoreType.PROJECT,
    onAddIssue,
    addIssueTrackerElement,
  } = props;
  const { t } = useTranslation();
  const [analyticsModal, setAnalyticsModal] = useState(false);
  const {
    issuesFilter: { issueFilters, updateFilters },
  } = useIssues(storeType);
  const activeLayout = issueFilters?.displayFilters?.layout;
  const layoutDisplayFiltersOptions = ISSUE_STORE_TO_FILTERS_MAP[storeType]?.layoutOptions[activeLayout];

  const handleLayoutChange = useCallback(
    (layout: EIssueLayoutTypes) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, { layout });
    },
    [workspaceSlug, projectId, updateFilters]
  );

  const handleDisplayFilters = useCallback(
    (updatedDisplayFilter: Partial<IIssueDisplayFilterOptions>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_FILTERS, updatedDisplayFilter);
    },
    [workspaceSlug, projectId, updateFilters]
  );

  const handleDisplayProperties = useCallback(
    (property: Partial<IIssueDisplayProperties>) => {
      if (!workspaceSlug || !projectId) return;
      updateFilters(workspaceSlug, projectId, EIssueFilterType.DISPLAY_PROPERTIES, property);
    },
    [workspaceSlug, projectId, updateFilters]
  );

  return (
    <>
      <WorkItemsModal
        isOpen={analyticsModal}
        onClose={() => setAnalyticsModal(false)}
        projectDetails={currentProjectDetails ?? undefined}
        isEpic={storeType === EIssuesStoreType.EPIC}
      />
      <ProjectHubToolbar>
        <ProjectHubToolbarSegment className="hidden @4xl:flex">
          <LayoutSelection
            layouts={LAYOUTS}
            onChange={(layout) => handleLayoutChange(layout)}
            selectedLayout={activeLayout}
          />
        </ProjectHubToolbarSegment>

        <div className="flex @4xl:hidden">
          <ProjectHubToolbarSegment>
            <MobileLayoutSelection
              layouts={LAYOUTS}
              onChange={(layout) => handleLayoutChange(layout)}
              activeLayout={activeLayout}
            />
          </ProjectHubToolbarSegment>
        </div>

        <ProjectHubToolbarDivider />

        <ProjectHubToolbarSegment>
          <WorkItemFiltersToggle entityType={storeType} entityId={projectId} appearance="hub" />
          <FiltersDropdown
            miniIcon={<SlidersHorizontal className="size-3.5" strokeWidth={1.75} />}
            title={t("common.display")}
            placement="bottom-end"
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
              isEpic={storeType === EIssuesStoreType.EPIC}
            />
          </FiltersDropdown>
        </ProjectHubToolbarSegment>

        {(canUserCreateIssue || onAddIssue) && (
          <>
            <ProjectHubToolbarDivider />
            <ProjectHubToolbarSegment>
              {canUserCreateIssue ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(PROJECT_HUB_GHOST_BUTTON_CLASS, "hidden md:inline-flex")}
                  onClick={() => setAnalyticsModal(true)}
                  prependIcon={<ChartNoAxesColumn className="size-3.5" aria-hidden />}
                >
                  <span className="hidden @5xl:inline">{t("common.analytics")}</span>
                </Button>
              ) : null}
              {onAddIssue ? (
                <ProjectHubPrimaryAction onClick={onAddIssue} data-ph-element={addIssueTrackerElement}>
                  <span className="sm:hidden">{t("add")}</span>
                  <span className="hidden sm:inline">{t("issue.add.label")}</span>
                </ProjectHubPrimaryAction>
              ) : null}
            </ProjectHubToolbarSegment>
          </>
        )}
      </ProjectHubToolbar>
    </>
  );
});
