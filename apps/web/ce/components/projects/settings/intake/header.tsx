import { useState } from "react";
import { observer } from "mobx-react";
import { Link, useParams } from "react-router";
import { FileText, RefreshCcw } from "lucide-react";
// ui
import { EUserPermissions, EUserPermissionsLevel, EProjectFeatureKey } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { Header } from "@operis/ui";
// components
import { InboxIssueCreateModalRoot } from "@/components/inbox/modals/create-modal";
import {
  ProjectFeaturePageActions,
  ProjectFeaturePageHeader,
  ProjectFeaturePageTitle,
} from "@/components/project/project-feature-page-header";
import { ProjectHubPrimaryAction } from "@/components/project/project-hub-toolbar";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { useUserPermissions } from "@/hooks/store/user";

export const ProjectInboxHeader = observer(function ProjectInboxHeader() {
  const [createIssueModal, setCreateIssueModal] = useState(false);
  const { workspaceSlug, projectId } = useParams();
  const { allowPermissions } = useUserPermissions();
  const { t } = useTranslation();
  const { currentProjectDetails, loader: currentProjectDetailsLoader } = useProject();
  const { loader } = useProjectInbox();

  const isAuthorized = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
    EUserPermissionsLevel.PROJECT
  );
  const isProjectAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);
  const formsSettingsHref =
    workspaceSlug && projectId
      ? `/${workspaceSlug}/settings/projects/${projectId}/features/intake/`
      : "#";

  return (
    <ProjectFeaturePageHeader>
      <Header.LeftItem>
        <div className="flex min-w-0 items-center gap-3">
          <ProjectFeaturePageTitle
            featureKey={EProjectFeatureKey.INTAKE}
            subtitle={t("project.intake.subtitle")}
            isLoading={currentProjectDetailsLoader === "init-loader"}
          />
          {loader === "pagination-loading" && (
            <div className="flex shrink-0 items-center gap-1.5 text-tertiary">
              <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
              <p className="text-13">{t("syncing")}...</p>
            </div>
          )}
        </div>
      </Header.LeftItem>
      {currentProjectDetails?.inbox_view && workspaceSlug && projectId && isAuthorized ? (
        <Header.RightItem>
          <ProjectFeaturePageActions>
            {isProjectAdmin ? (
              <Link
                to={formsSettingsHref}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-subtle bg-layer-1 px-3 text-11 font-medium text-secondary hover:bg-layer-1-hover"
              >
                <FileText className="size-3.5" />
                <span className="hidden sm:inline">{t("project_settings.features.intake.forms.manage")}</span>
              </Link>
            ) : null}
            <InboxIssueCreateModalRoot
              workspaceSlug={workspaceSlug.toString()}
              projectId={projectId.toString()}
              modalState={createIssueModal}
              handleModalClose={() => setCreateIssueModal(false)}
            />
            <ProjectHubPrimaryAction onClick={() => setCreateIssueModal(true)}>
              <span className="sm:hidden">{t("add")}</span>
              <span className="hidden sm:inline">{t("add_work_item")}</span>
            </ProjectHubPrimaryAction>
          </ProjectFeaturePageActions>
        </Header.RightItem>
      ) : null}
    </ProjectFeaturePageHeader>
  );
});
