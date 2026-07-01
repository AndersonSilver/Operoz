import { observer } from "mobx-react";
import {
  EProjectFeatureKey,
  EUserPermissions,
  EUserPermissionsLevel,
  MODULE_TRACKER_ELEMENTS,
} from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { Header } from "@operoz/ui";
import { ModuleViewHeader } from "@/components/modules";
import { ProjectFeaturePageHeader, ProjectFeaturePageTitle } from "@/components/project/project-feature-page-header";
import { ProjectHubPrimaryAction } from "@/components/project/project-hub-toolbar";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";

export const ModulesListHeader = observer(function ModulesListHeader() {
  const { toggleCreateModuleModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  const { loader } = useProject();
  const { t } = useTranslation();

  const canUserCreateModule = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return (
    <ProjectFeaturePageHeader>
      <Header.LeftItem>
        <ProjectFeaturePageTitle featureKey={EProjectFeatureKey.MODULES} isLoading={loader === "init-loader"} />
      </Header.LeftItem>
      <Header.RightItem>
        <ModuleViewHeader
          trailing={
            canUserCreateModule ? (
              <ProjectHubPrimaryAction
                data-ph-element={MODULE_TRACKER_ELEMENTS.RIGHT_HEADER_ADD_BUTTON}
                onClick={() => toggleCreateModuleModal(true)}
              >
                <span className="sm:hidden">{t("add")}</span>
                <span className="hidden sm:inline">{t("project_module.add_module")}</span>
              </ProjectHubPrimaryAction>
            ) : undefined
          }
        />
      </Header.RightItem>
    </ProjectFeaturePageHeader>
  );
});
