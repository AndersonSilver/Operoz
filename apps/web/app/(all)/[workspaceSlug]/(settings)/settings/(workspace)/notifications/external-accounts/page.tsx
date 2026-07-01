import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import { AlertsSettingsSection } from "@/components/notifications/alerts-settings-section";
import { ExternalAccountsList } from "@/components/notifications/external-accounts/external-accounts-list";
import type { Route } from "./+types/page";

function ExternalAccountsSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { t } = useTranslation();

  return (
    <AlertsSettingsSection title={t("alert.accounts.title")} description={t("alert.accounts.lead")}>
      <ExternalAccountsList workspaceSlug={workspaceSlug} />
    </AlertsSettingsSection>
  );
}

export default observer(ExternalAccountsSettingsPage);
