import { observer } from "mobx-react";
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { WorkspaceDiscordSlashCommandsPanel } from "@/components/settings/workspace/discord-slash-commands-panel";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import type { Route } from "./+types/page";
import { DiscordWorkspaceSettingsHeader } from "./header";

function DiscordWorkspaceSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { currentWorkspace } = useWorkspace();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { t } = useTranslation();

  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.discord.title")}`
    : undefined;

  if (workspaceUserInfo && !isAdmin) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<DiscordWorkspaceSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <div className="flex w-full flex-col gap-6">
        <div>
          <h2 className="text-16 font-semibold text-primary">{t("workspace_settings.settings.discord.heading")}</h2>
          <p className="mt-1 text-13 text-secondary">{t("workspace_settings.settings.discord.description")}</p>
        </div>
        <WorkspaceDiscordSlashCommandsPanel workspaceSlug={workspaceSlug} />
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(DiscordWorkspaceSettingsPage);
