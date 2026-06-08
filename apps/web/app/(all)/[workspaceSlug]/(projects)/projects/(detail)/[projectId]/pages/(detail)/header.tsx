import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@operis/i18n";
import { PageIcon } from "@operis/propel/icons";
import type { ICustomSearchSelectOption } from "@operis/types";
import { Header } from "@operis/ui";
import { getPageName } from "@operis/utils";
// components
import { PageAccessIcon } from "@/components/common/page-access-icon";
import { SwitcherIcon, SwitcherLabel } from "@/components/common/switcher-label";
import { PageHeaderActions } from "@/components/pages/header/actions";
import { PageSyncingBadge } from "@/components/pages/header/syncing-badge";
import {
  ProjectFeaturePageActions,
  ProjectFeaturePageHeader,
  ProjectFeaturePageTitle,
} from "@/components/project/project-feature-page-header";
import { ProjectHubEntitySwitcher } from "@/components/project/project-hub-entity-switcher";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { PageDetailsHeaderExtraActions } from "@/plane-web/components/pages";
import { EPageStoreType, usePage, usePageStore } from "@/plane-web/hooks/store";

export interface IPagesHeaderProps {
  showButton?: boolean;
}

const storeType = EPageStoreType.PROJECT;

export const PageDetailsHeader = observer(function PageDetailsHeader() {
  const { t } = useTranslation();
  const router = useAppRouter();
  const { workspaceSlug, pageId, projectId } = useParams();
  const { loader } = useProject();
  const { getPageById, getCurrentProjectPageIds } = usePageStore(storeType);
  const page = usePage({
    pageId: pageId?.toString() ?? "",
    storeType,
  });

  const projectPageIds = getCurrentProjectPageIds(projectId?.toString());

  const switcherOptions = projectPageIds
    .map((id) => {
      const _page = id === pageId ? page : getPageById(id);
      if (!_page) return;
      return {
        value: _page.id,
        query: _page.name,
        content: (
          <div className="flex items-center justify-between gap-2">
            <SwitcherLabel logo_props={_page.logo_props} name={getPageName(_page.name)} LabelIcon={PageIcon} />
            <PageAccessIcon {..._page} />
          </div>
        ),
      };
    })
    .filter((option) => option !== undefined) as ICustomSearchSelectOption[];

  if (!page) return null;

  const pageIcon = (
    <SwitcherIcon logo_props={page.logo_props} LabelIcon={PageIcon} size={16} />
  );

  return (
    <ProjectFeaturePageHeader>
      <Header.LeftItem>
        <ProjectFeaturePageTitle
          title={getPageName(page.name)}
          subtitle={t("project_page.detail.subtitle")}
          icon={pageIcon}
          isLoading={loader === "init-loader"}
          trailing={
            switcherOptions.length > 1 ? (
              <ProjectHubEntitySwitcher
                value={pageId?.toString() ?? ""}
                options={switcherOptions}
                tooltip={t("project_page.detail.switch_page")}
                onChange={(value: string) => {
                  router.push(`/${workspaceSlug}/projects/${projectId}/pages/${value}`);
                }}
              />
            ) : null
          }
        />
      </Header.LeftItem>
      <Header.RightItem>
        <ProjectFeaturePageActions>
          <PageSyncingBadge syncStatus={page.isSyncingWithServer} />
          <PageDetailsHeaderExtraActions page={page} storeType={storeType} />
          <PageHeaderActions page={page} storeType={storeType} />
        </ProjectFeaturePageActions>
      </Header.RightItem>
    </ProjectFeaturePageHeader>
  );
});
