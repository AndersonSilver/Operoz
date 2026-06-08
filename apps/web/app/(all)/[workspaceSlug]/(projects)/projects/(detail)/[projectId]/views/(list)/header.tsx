import { observer } from "mobx-react";
// ui
import { EProjectFeatureKey, PROJECT_VIEW_TRACKER_ELEMENTS } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { Header } from "@operis/ui";
// components
import { ViewListHeader } from "@/components/views/view-list-header";
import {
  ProjectFeaturePageActions,
  ProjectFeaturePageHeader,
  ProjectFeaturePageTitle,
} from "@/components/project/project-feature-page-header";
import { ProjectHubPrimaryAction } from "@/components/project/project-hub-toolbar";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";

export const ProjectViewsHeader = observer(function ProjectViewsHeader() {
  const { toggleCreateViewModal } = useCommandPalette();
  const { loader } = useProject();
  const { t } = useTranslation();

  return (
    <ProjectFeaturePageHeader>
      <Header.LeftItem>
        <ProjectFeaturePageTitle featureKey={EProjectFeatureKey.VIEWS} isLoading={loader === "init-loader"} />
      </Header.LeftItem>
      <Header.RightItem>
        <ProjectFeaturePageActions>
          <ViewListHeader />
          <ProjectHubPrimaryAction
            data-ph-element={PROJECT_VIEW_TRACKER_ELEMENTS.RIGHT_HEADER_ADD_BUTTON}
            onClick={() => toggleCreateViewModal(true)}
          >
            {t("workspace_views.add_view")}
          </ProjectHubPrimaryAction>
        </ProjectFeaturePageActions>
      </Header.RightItem>
    </ProjectFeaturePageHeader>
  );
});
