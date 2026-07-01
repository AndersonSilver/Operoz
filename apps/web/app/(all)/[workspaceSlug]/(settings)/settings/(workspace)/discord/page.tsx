import { useState } from "react";
import { observer } from "mobx-react";
import { EUserPermissions, EUserPermissionsLevel } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { WorkspaceDiscordSlashCommandsPanel } from "@/components/settings/workspace/discord-slash-commands-panel";
import { WorkspaceDiscordSettingsHero } from "@/components/settings/workspace/workspace-discord-settings-hero";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import type { Route } from "./+types/page";
import "@/components/settings/workspace/discord-settings.css";
import { DiscordWorkspaceSettingsHeader } from "./header";

function DiscordWorkspaceSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { currentWorkspace } = useWorkspace();
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { t } = useTranslation();
  const [commandCount, setCommandCount] = useState(0);

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
        <WorkspaceDiscordSettingsHero commandCount={commandCount} />
        <WorkspaceDiscordSlashCommandsPanel workspaceSlug={workspaceSlug} onCommandCountChange={setCommandCount} />
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(DiscordWorkspaceSettingsPage);
