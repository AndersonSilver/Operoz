import { observer } from "mobx-react";
import { WORKSPACE_SETTINGS } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { Breadcrumbs } from "@operoz/ui";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SettingsPageHeader } from "@/components/settings/page-header";
import { WORKSPACE_SETTINGS_ICONS } from "@/components/settings/workspace/sidebar/item-icon";

export const DiscordWorkspaceSettingsHeader = observer(function DiscordWorkspaceSettingsHeader() {
  const { t } = useTranslation();
  const settingsDetails = WORKSPACE_SETTINGS.discord;
  const Icon = WORKSPACE_SETTINGS_ICONS.discord;

  return (
    <SettingsPageHeader
      leftItem={
        <div className="flex items-center gap-2">
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink
                  label={t(settingsDetails.i18n_label)}
                  icon={<Icon className="size-4 text-tertiary" />}
                />
              }
            />
          </Breadcrumbs>
        </div>
      }
    />
  );
});
