import { observer } from "mobx-react";
import { useTranslation } from "@operis/i18n";
import { ExternalAccountsList } from "@/components/notifications/external-accounts/external-accounts-list";
import type { Route } from "./+types/page";

function ExternalAccountsSettingsPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-14 font-medium text-primary">{t("alert.accounts.title")}</h2>
      <ExternalAccountsList workspaceSlug={workspaceSlug} />
    </div>
  );
}

export default observer(ExternalAccountsSettingsPage);
