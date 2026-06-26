import { observer } from "mobx-react";
import { useTranslation } from "@operis/i18n";
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { AlertRuleFormTrigger, AlertRulesList } from "@/components/notifications/alert-settings/alert-rules-list";
import { useUserPermissions } from "@/hooks/store/user";
import type { Route } from "./+types/page";

function AlertRulesSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { t } = useTranslation();
  const { allowPermissions } = useUserPermissions();
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  if (!isAdmin) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-14 font-medium text-primary">{t("alert.rules.title")}</h2>
        <AlertRuleFormTrigger workspaceSlug={workspaceSlug} />
      </div>
      <AlertRulesList workspaceSlug={workspaceSlug} />
    </div>
  );
}

export default observer(AlertRulesSettingsPage);
