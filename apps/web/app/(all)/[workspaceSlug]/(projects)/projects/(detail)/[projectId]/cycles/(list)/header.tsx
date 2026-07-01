import { observer } from "mobx-react";
import { CYCLE_TRACKER_ELEMENTS, EProjectFeatureKey, EUserPermissions, EUserPermissionsLevel } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { Header } from "@operoz/ui";
import { CyclesViewHeader } from "@/components/cycles/cycles-view-header";
import { ProjectFeaturePageHeader, ProjectFeaturePageTitle } from "@/components/project/project-feature-page-header";
import { ProjectHubPrimaryAction } from "@/components/project/project-hub-toolbar";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";

export const CyclesListHeader = observer(function CyclesListHeader() {
  const { toggleCreateCycleModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  const { currentProjectDetails, loader } = useProject();
  const { t } = useTranslation();

  const canUserCreateCycle = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <ProjectFeaturePageHeader>
      <Header.LeftItem>
        <ProjectFeaturePageTitle featureKey={EProjectFeatureKey.CYCLES} isLoading={loader === "init-loader"} />
      </Header.LeftItem>
      <Header.RightItem>
        {currentProjectDetails ? (
          <CyclesViewHeader
            projectId={currentProjectDetails.id}
            trailing={
              canUserCreateCycle ? (
                <ProjectHubPrimaryAction
                  data-ph-element={CYCLE_TRACKER_ELEMENTS.RIGHT_HEADER_ADD_BUTTON}
                  onClick={() => toggleCreateCycleModal(true)}
                >
                  <span className="sm:hidden">{t("add")}</span>
                  <span className="hidden sm:inline">{t("project_cycles.add_cycle")}</span>
                </ProjectHubPrimaryAction>
              ) : undefined
            }
          />
        ) : null}
      </Header.RightItem>
    </ProjectFeaturePageHeader>
  );
});
