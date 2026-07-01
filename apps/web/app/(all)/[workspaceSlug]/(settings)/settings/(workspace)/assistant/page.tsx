import { observer } from "mobx-react";
import { EUserPermissions, EUserPermissionsLevel } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { AssistantQualityDashboard } from "@/components/settings/workspace/assistant-quality-dashboard";
import { WorkspaceAssistantSettingsHero } from "@/components/settings/workspace/workspace-assistant-settings-hero";
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
    <SettingsContentWrapper header={<AssistantWorkspaceSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <div className="flex w-full flex-col gap-6">
        <WorkspaceAssistantSettingsHero />
        <AssistantQualityDashboard workspaceSlug={workspaceSlug} />
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(AssistantSettingsPage);
