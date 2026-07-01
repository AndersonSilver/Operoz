import { observer } from "mobx-react";
import { WORKSPACE_SETTINGS } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { Breadcrumbs } from "@operoz/ui";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SettingsPageHeader } from "@/components/settings/page-header";
import { WORKSPACE_SETTINGS_ICONS } from "@/components/settings/workspace/sidebar/item-icon";

type Props = {
  schemeName?: string;
};

export const WorkflowSchemeEditorSettingsHeader = observer(function WorkflowSchemeEditorSettingsHeader(props: Props) {
  const { schemeName } = props;
  const { t } = useTranslation();
  const settingsDetails = WORKSPACE_SETTINGS.workflow;
  const Icon = WORKSPACE_SETTINGS_ICONS.workflow;

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
            <Breadcrumbs.Item
              component={
                <BreadcrumbLink label={t("workspace_settings.settings.workflow.schemes.title")} href="schemes" />
              }
            />
            {schemeName ? <Breadcrumbs.Item component={<BreadcrumbLink label={schemeName} isLast />} /> : null}
          </Breadcrumbs>
        </div>
      }
    />
  );
});
