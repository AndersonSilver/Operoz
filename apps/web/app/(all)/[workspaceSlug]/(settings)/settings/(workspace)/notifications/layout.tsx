import { Outlet, useParams } from "react-router";
import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import { AlertsSettingsHero } from "@/components/notifications/alerts-settings-hero";
import { AlertsSettingsTabs } from "@/components/notifications/alerts-settings-tabs";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { useWorkspace } from "@/hooks/store/use-workspace";
import "@/components/notifications/alerts-settings.css";
import { NotificationsWorkspaceSettingsHeader } from "./header";

function NotificationsSettingsLayout() {
  const { workspaceSlug = "" } = useParams();
  const { currentWorkspace } = useWorkspace();
  const { t } = useTranslation();

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.notifications.title")}`
    : undefined;

  return (
    <SettingsContentWrapper hugging header={<NotificationsWorkspaceSettingsHeader />}>
      <PageHead title={pageTitle} />
      <div className="flex w-full flex-col gap-6">
        <AlertsSettingsHero />
        <AlertsSettingsTabs workspaceSlug={workspaceSlug} />
        <Outlet />
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(NotificationsSettingsLayout);
