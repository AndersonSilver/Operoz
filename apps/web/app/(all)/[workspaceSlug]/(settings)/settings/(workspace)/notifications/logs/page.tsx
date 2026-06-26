import { observer } from "mobx-react";
import { useTranslation } from "@operis/i18n";
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { AlertLogList } from "@/components/notifications/alert-log/alert-log-list";
import { useUserPermissions } from "@/hooks/store/user";
import type { Route } from "./+types/page";

function AlertLogsSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { t } = useTranslation();
  const { allowPermissions } = useUserPermissions();
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  if (!isAdmin) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-14 font-medium text-primary">{t("alert.logs.title")}</h2>
      <AlertLogList workspaceSlug={workspaceSlug} />
    </div>
  );
}

export default observer(AlertLogsSettingsPage);
