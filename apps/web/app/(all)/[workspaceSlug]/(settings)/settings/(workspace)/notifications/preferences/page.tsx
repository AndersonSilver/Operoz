import { observer } from "mobx-react";
import { useTranslation } from "@operis/i18n";
import { NotificationChannelConfig } from "@/components/notifications/preferences/notification-channel-config";
import type { Route } from "./+types/page";

function AlertPreferencesSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-14 font-medium text-primary">{t("alert.prefs.title")}</h2>
      <NotificationChannelConfig workspaceSlug={workspaceSlug} />
    </div>
  );
}

export default observer(AlertPreferencesSettingsPage);
