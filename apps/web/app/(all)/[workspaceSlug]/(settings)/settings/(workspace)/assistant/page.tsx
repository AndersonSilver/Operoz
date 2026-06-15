import { observer } from "mobx-react";
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { AssistantQualityDashboard } from "@/components/settings/workspace/assistant-quality-dashboard";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import type { Route } from "./+types/page";
import { AssistantWorkspaceSettingsHeader } from "./header";

function AssistantSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();

  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.assistant.title")}`
    : undefined;

  if (workspaceUserInfo && !isAdmin) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<AssistantWorkspaceSettingsHeader />}>
      <PageHead title={pageTitle} />
      <div className="space-y-2 px-6 py-4">
        <p className="text-sm text-secondary">{t("workspace_settings.settings.assistant.description")}</p>
        <AssistantQualityDashboard workspaceSlug={workspaceSlug} />
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(AssistantSettingsPage);
