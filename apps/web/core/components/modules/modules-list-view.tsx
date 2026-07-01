import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
import { EUserPermissionsLevel, MODULE_TRACKER_ELEMENTS } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { EmptyStateDetailed } from "@operoz/propel/empty-state";
import { EUserProjectRoles } from "@operoz/types";
import { ContentWrapper, Row, ERowVariant } from "@operoz/ui";
import { cn } from "@operoz/utils";
import { BOARD_HUB_MODULE_CARD, BOARD_HUB_MODULE_LIST_PANEL } from "@/components/board/board-hub-background";
import { ListLayout } from "@/components/core/list";
import {
  ModuleCardItem,
  ModuleListHeader,
  ModuleListItem,
  ModulePeekOverview,
  ModulesListGanttChartView,
} from "@/components/modules";
import { CycleModuleBoardLayoutLoader } from "@/components/ui/loader/cycle-module-board-loader";
import { CycleModuleListLayoutLoader } from "@/components/ui/loader/cycle-module-list-loader";
import { GanttLayoutLoader } from "@/components/ui/loader/layouts/gantt-layout-loader";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useModule } from "@/hooks/store/use-module";
import { useModuleFilter } from "@/hooks/store/use-module-filter";
import { useUserPermissions } from "@/hooks/store/user";

const MODULE_EMPTY_WRAP = "flex min-h-[20rem] flex-1 items-center justify-center p-6";

function ModuleEmptyState({ children }: { children: ReactNode }) {
  return <div className={MODULE_EMPTY_WRAP}>{children}</div>;
}

export const ModulesListView = observer(function ModulesListView() {
  const { workspaceSlug, projectId } = useParams();
  const searchParams = useSearchParams();
  const peekModule = searchParams.get("peekModule");
  const { t } = useTranslation();
  const { toggleCreateModuleModal } = useCommandPalette();
  const { getProjectModuleIds, getFilteredModuleIds, loader } = useModule();
  const { currentProjectDisplayFilters: displayFilters } = useModuleFilter();
  const { allowPermissions } = useUserPermissions();

  const projectModuleIds = projectId ? getProjectModuleIds(projectId.toString()) : undefined;
  const filteredModuleIds = projectId ? getFilteredModuleIds(projectId.toString()) : undefined;
  const canPerformEmptyStateActions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  if (loader || !projectModuleIds || !filteredModuleIds) {
    return (
      <div className="min-h-0 flex-1 overflow-y-auto">
        {displayFilters?.layout === "list" && <CycleModuleListLayoutLoader />}
        {displayFilters?.layout === "board" && <CycleModuleBoardLayoutLoader />}
        {displayFilters?.layout === "gantt" && <GanttLayoutLoader />}
      </div>
    );
  }

  if (projectModuleIds.length === 0) {
    return (
      <ModuleEmptyState>
        <EmptyStateDetailed
          assetKey="module"
          title={t("project_empty_state.modules.title")}
          description={t("project_empty_state.modules.description")}
          actions={[
            {
              label: t("project_empty_state.modules.cta_primary"),
              onClick: () => toggleCreateModuleModal(true),
              disabled: !canPerformEmptyStateActions,
              variant: "primary",
              "data-ph-element": MODULE_TRACKER_ELEMENTS.EMPTY_STATE_ADD_BUTTON,
            },
          ]}
        />
      </ModuleEmptyState>
    );
  }

  if (filteredModuleIds.length === 0) {
    return (
      <ModuleEmptyState>
        <EmptyStateDetailed
          assetKey="search"
          title={t("common_empty_state.search.title")}
          description={t("common_empty_state.search.description")}
        />
      </ModuleEmptyState>
    );
  }

  return (
    <ContentWrapper variant={ERowVariant.HUGGING} className="min-h-0 flex-1">
      <div className="flex size-full min-h-0 justify-between">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          {displayFilters?.layout === "list" && (
            <ListLayout>
              <div className={BOARD_HUB_MODULE_LIST_PANEL}>
                <ModuleListHeader />
                {filteredModuleIds.map((moduleId) => (
                  <ModuleListItem key={moduleId} moduleId={moduleId} />
                ))}
              </div>
            </ListLayout>
          )}
          {displayFilters?.layout === "board" && (
            <Row
              className={cn(
                "vertical-scrollbar grid scrollbar-lg auto-rows-max grid-cols-1 gap-4 p-4 transition-all",
                peekModule
                  ? "3xl:grid-cols-3 lg:grid-cols-1 xl:grid-cols-2"
                  : "3xl:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3"
              )}
            >
              {filteredModuleIds.map((moduleId) => (
                <ModuleCardItem key={moduleId} moduleId={moduleId} />
              ))}
            </Row>
          )}
          {displayFilters?.layout === "gantt" && (
            <div className="min-h-0 flex-1 overflow-hidden p-3 md:p-4">
              <ModulesListGanttChartView />
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          <ModulePeekOverview projectId={projectId?.toString() ?? ""} workspaceSlug={workspaceSlug?.toString() ?? ""} />
        </div>
      </div>
    </ContentWrapper>
  );
});
