import { observer } from "mobx-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@operoz/constants";
// components
import { PageHead } from "@/components/core/page-title";
import { ProjectDetailsForm } from "@/components/project/form";
import { ProjectDetailsFormLoader } from "@/components/project/form-loader";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import type { Route } from "./+types/page";
import { GeneralProjectSettingsHeader } from "./header";
import { GeneralProjectSettingsControlSection } from "@/components/project/settings/control-section";

function ProjectSettingsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, projectId } = params;
  // store hooks
  const { getProjectById } = useProject();
  const projectDetails = getProjectById(projectId);
  const { allowPermissions } = useUserPermissions();
  // derived values
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);

  const pageTitle = projectDetails?.name ? `${projectDetails.name} - General Settings` : undefined;

  return (
    <SettingsContentWrapper header={<GeneralProjectSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <div className={`mx-auto w-full max-w-[75rem] ${isAdmin ? "" : "opacity-60"}`}>
        {projectDetails ? (
          <ProjectDetailsForm
            project={projectDetails}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            isAdmin={isAdmin}
          />
        ) : (
          <ProjectDetailsFormLoader />
        )}
        {isAdmin && <GeneralProjectSettingsControlSection projectId={projectId} />}
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(ProjectSettingsPage);
