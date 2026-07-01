import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import { AlertsSettingsSection } from "@/components/notifications/alerts-settings-section";
import { NotificationChannelConfig } from "@/components/notifications/preferences/notification-channel-config";
import type { Route } from "./+types/page";

function AlertPreferencesSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { t } = useTranslation();

  return (
    <AlertsSettingsSection title={t("alert.prefs.title")} description={t("alert.prefs.lead")}>
      <NotificationChannelConfig workspaceSlug={workspaceSlug} />
    </AlertsSettingsSection>
  );
}

export default observer(AlertPreferencesSettingsPage);
