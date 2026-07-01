import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import { AnalyticsIcon } from "@operoz/propel/icons";
// plane imports
import { Breadcrumbs, Header } from "@operoz/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";

export const WorkspaceAnalyticsHeader = observer(function WorkspaceAnalyticsHeader() {
  const { t } = useTranslation();
  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs>
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label={t("workspace_analytics.label")}
                icon={<AnalyticsIcon className="h-4 w-4 text-tertiary" />}
              />
            }
          />
        </Breadcrumbs>
      </Header.LeftItem>
    </Header>
  );
});
