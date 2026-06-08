import { useCallback } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
import { EUserPermissionsLevel } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import type { TModuleFilters } from "@operis/types";
import { EUserProjectRoles } from "@operis/types";
import { calculateTotalFilters, cn } from "@operis/utils";
import darkModulesAsset from "@/app/assets/empty-state/disabled-feature/modules-dark.webp?url";
import lightModulesAsset from "@/app/assets/empty-state/disabled-feature/modules-light.webp?url";
import { BOARD_HUB_PROJECT_WORK_SURFACE_INNER } from "@/components/board/board-hub-background";
import { PageHead } from "@/components/core/page-title";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { ModuleAppliedFiltersList, ModulesListView } from "@/components/modules";
import { useModuleFilter } from "@/hooks/store/use-module-filter";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import type { Route } from "./+types/page";

function ProjectModulesPage({ params }: Route.ComponentProps) {
  const router = useAppRouter();
  const { workspaceSlug, projectId } = params;
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const { getProjectById, currentProjectDetails } = useProject();
  const {
    currentProjectFilters = {},
    currentProjectDisplayFilters,
    clearAllFilters,
    updateFilters,
    updateDisplayFilters,
  } = useModuleFilter();
  const { allowPermissions } = useUserPermissions();

  const project = getProjectById(projectId);
  const pageTitle = project?.name ? `${project?.name} - Modules` : undefined;
  const canPerformEmptyStateActions = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);
  const resolvedPath = resolvedTheme === "light" ? lightModulesAsset : darkModulesAsset;

  const handleRemoveFilter = useCallback(
    (key: keyof TModuleFilters, value: string | null) => {
      let newValues = currentProjectFilters[key] ?? [];

      if (!value) newValues = [];
      else newValues = newValues.filter((val) => val !== value);

      updateFilters(projectId, { [key]: newValues });
    },
    [currentProjectFilters, projectId, updateFilters]
  );

  const hasAppliedFilters =
    calculateTotalFilters(currentProjectFilters) !== 0 || currentProjectDisplayFilters?.favorites;

  if (currentProjectDetails?.module_view === false)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <DetailedEmptyState
          title={t("disabled_project.empty_state.module.title")}
          description={t("disabled_project.empty_state.module.description")}
          assetPath={resolvedPath}
          primaryButton={{
            text: t("disabled_project.empty_state.module.primary_button.text"),
            onClick: () => {
              router.push(`/${workspaceSlug}/settings/projects/${projectId}/features`);
            },
            disabled: !canPerformEmptyStateActions,
          }}
        />
      </div>
    );

  return (
    <>
      <PageHead title={pageTitle} />
      <div className={cn("flex h-full min-h-0 flex-col", BOARD_HUB_PROJECT_WORK_SURFACE_INNER)}>
        {hasAppliedFilters ? (
          <ModuleAppliedFiltersList
            appearance="embedded"
            appliedFilters={currentProjectFilters}
            isFavoriteFilterApplied={currentProjectDisplayFilters?.favorites ?? false}
            handleClearAllFilters={() => clearAllFilters(projectId)}
            handleRemoveFilter={handleRemoveFilter}
            handleDisplayFiltersUpdate={(val) => updateDisplayFilters(projectId, val)}
            alwaysAllowEditing
          />
        ) : null}
        <ModulesListView />
      </div>
    </>
  );
}

export default observer(ProjectModulesPage);
