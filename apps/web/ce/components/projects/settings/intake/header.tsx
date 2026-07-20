import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import { Plus, RefreshCcw } from "lucide-react";
import { EProjectFeatureKey, EUserPermissions, EUserPermissionsLevel } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { Header } from "@operoz/ui";
import type { THubMode } from "@operoz/types";
import { EHubMode } from "@operoz/types";
import { ProjectFeaturePageHeader, ProjectFeaturePageTitle } from "@/components/project/project-feature-page-header";
import { InboxIssueCreateModalRoot } from "@/components/inbox/modals/create-modal/modal";
import { useProject } from "@/hooks/store/use-project";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { useUserPermissions } from "@/hooks/store/user";

type Props = {
  hubMode: THubMode;
};

export const ProjectInboxHeader = observer(function ProjectInboxHeader({ hubMode }: Props) {
  const { workspaceSlug, projectId } = useParams();
  const { t } = useTranslation();
  const { currentProjectDetails, loader: currentProjectDetailsLoader } = useProject();
  const { loader } = useProjectInbox();
  const { allowPermissions } = useUserPermissions();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const isIntakeHub = hubMode === EHubMode.INTAKE;
  const isEnabled = isIntakeHub ? currentProjectDetails?.inbox_view : currentProjectDetails?.support_view;
  const canCreate = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug?.toString(),
    projectId?.toString()
  );

  if (!isEnabled || !workspaceSlug || !projectId) {
    return null;
  }

  return (
    <>
      <ProjectFeaturePageHeader>
        <Header.LeftItem>
          <div className="flex min-w-0 items-center gap-3">
            <ProjectFeaturePageTitle
              featureKey={isIntakeHub ? EProjectFeatureKey.INTAKE : EProjectFeatureKey.SUPPORT}
              subtitle={t(isIntakeHub ? "project.intake.subtitle" : "project.support.subtitle")}
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
        {isIntakeHub && canCreate ? (
          <Header.RightItem>
            <Button
              variant="primary"
              size="sm"
              prependIcon={<Plus className="size-3.5" />}
              onClick={() => setCreateModalOpen(true)}
            >
              {t("inbox_issue.actions.create")}
            </Button>
          </Header.RightItem>
        ) : null}
      </ProjectFeaturePageHeader>
      {isIntakeHub && createModalOpen ? (
        <InboxIssueCreateModalRoot
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          modalState={createModalOpen}
          handleModalClose={() => setCreateModalOpen(false)}
          hubMode={hubMode}
        />
      ) : null}
    </>
  );
});
