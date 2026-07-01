import { observer } from "mobx-react";
import { useParams } from "react-router";
import { useTranslation } from "@operoz/i18n";
import { PageHead } from "@/components/core/page-title";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { WorkspaceClient360Detail } from "@/components/workspace/client-360/workspace-client-360-detail";
import type { Route } from "./+types/page";

function Visao360DetailPage(_props: Route.ComponentProps) {
  const { t } = useTranslation();
  const { workspaceSlug, projectId = "" } = useParams();

  if (!workspaceSlug || !projectId) {
    return (
      <>
        <PageHead title={t("boards.client_360.title")} />
        <div className="flex h-full items-center justify-center">
          <LogoSpinner />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead title={t("boards.client_360.title")} />
      <WorkspaceClient360Detail workspaceSlug={workspaceSlug} projectId={projectId} />
    </>
  );
}

export default observer(Visao360DetailPage);
