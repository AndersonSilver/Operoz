import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@operis/i18n";
// components
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { IntakeSettingsView } from "@/components/intake/forms/intake-settings-view";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import type { Route } from "./+types/page";
import { FeaturesIntakeProjectSettingsHeader } from "./header";

function FeaturesIntakeSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  // store hooks
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentProjectDetails } = useProject();
  // translation
  const { t } = useTranslation();
  // derived values
  const pageTitle = currentProjectDetails?.name
    ? `${currentProjectDetails?.name} settings - ${t("project_settings.features.intake.short_title")}`
    : undefined;
  const canPerformProjectAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT);

  if (workspaceUserInfo && !canPerformProjectAdminActions) {
    return <NotAuthorizedView section="settings" isProjectView className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<FeaturesIntakeProjectSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <IntakeSettingsView
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        boardSlug={currentProjectDetails?.board?.slug ?? undefined}
        intakeEnabled={!!currentProjectDetails?.inbox_view}
      />
    </SettingsContentWrapper>
  );
}

export default observer(FeaturesIntakeSettingsPage);
