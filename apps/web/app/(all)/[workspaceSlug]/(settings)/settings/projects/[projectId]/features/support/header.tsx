import { observer } from "mobx-react";
// plane imports
import { PROJECT_SETTINGS } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { Breadcrumbs } from "@operoz/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SettingsPageHeader } from "@/components/settings/page-header";
import { PROJECT_SETTINGS_ICONS } from "@/components/settings/project/sidebar/item-icon";

export const FeaturesSupportProjectSettingsHeader = observer(function FeaturesSupportProjectSettingsHeader() {
  const { t } = useTranslation();
  const settingsDetails = PROJECT_SETTINGS.features_support;
  const Icon = PROJECT_SETTINGS_ICONS.features_support;

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
