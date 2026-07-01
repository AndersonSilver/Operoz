import { useState } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
// constants
import { EPageAccess, EProjectFeatureKey } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
// plane types
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { TPage } from "@operoz/types";
// plane ui
import { Header } from "@operoz/ui";
// hooks
import { useProject } from "@/hooks/store/use-project";
import {
  ProjectFeaturePageActions,
  ProjectFeaturePageHeader,
  ProjectFeaturePageTitle,
} from "@/components/project/project-feature-page-header";
import { ProjectHubPrimaryAction } from "@/components/project/project-hub-toolbar";
// plane web imports
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

export const PagesListHeader = observer(function PagesListHeader() {
  const { t } = useTranslation();
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const router = useRouter();
  const { workspaceSlug, projectId } = useParams();
  const searchParams = useSearchParams();
  const pageType = searchParams.get("type");
  const { currentProjectDetails, loader } = useProject();
  const { canCurrentUserCreatePage, createPage } = usePageStore(EPageStoreType.PROJECT);

  const handleCreatePage = async () => {
    setIsCreatingPage(true);

    const payload: Partial<TPage> = {
      access: pageType === "private" ? EPageAccess.PRIVATE : EPageAccess.PUBLIC,
    };

    await createPage(payload)
      .then((res) => {
        const pageId = `/${workspaceSlug}/projects/${currentProjectDetails?.id}/pages/${res?.id}`;
        router.push(pageId);
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("project_page.header.create_error_title"),
          message: err?.data?.error || t("project_page.header.create_error_message"),
        });
      })
      .finally(() => setIsCreatingPage(false));
  };

  return (
    <ProjectFeaturePageHeader>
      <Header.LeftItem>
        <ProjectFeaturePageTitle featureKey={EProjectFeatureKey.PAGES} isLoading={loader === "init-loader"} />
      </Header.LeftItem>
      {canCurrentUserCreatePage ? (
        <Header.RightItem>
          <ProjectFeaturePageActions>
            <ProjectHubPrimaryAction onClick={handleCreatePage} loading={isCreatingPage}>
              {isCreatingPage ? t("adding") : t("project_page.header.add_button")}
            </ProjectHubPrimaryAction>
          </ProjectFeaturePageActions>
        </Header.RightItem>
      ) : null}
    </ProjectFeaturePageHeader>
  );
});
