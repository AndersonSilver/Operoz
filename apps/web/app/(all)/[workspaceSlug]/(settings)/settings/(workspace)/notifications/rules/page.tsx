import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import { EUserPermissions, EUserPermissionsLevel } from "@operoz/constants";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { AlertsSettingsSection } from "@/components/notifications/alerts-settings-section";
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
    <AlertsSettingsSection
      title={t("alert.rules.title")}
      description={t("alert.rules.lead")}
      action={<AlertRuleFormTrigger workspaceSlug={workspaceSlug} />}
    >
      <AlertRulesList workspaceSlug={workspaceSlug} />
    </AlertsSettingsSection>
  );
}

export default observer(AlertRulesSettingsPage);
