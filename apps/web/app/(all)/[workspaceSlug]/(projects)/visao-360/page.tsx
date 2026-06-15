import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTranslation } from "@operis/i18n";
import { PageHead } from "@/components/core/page-title";
import { WorkspaceClient360List } from "@/components/workspace/client-360/workspace-client-360-list";
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

function Visao360Page(_props: Route.ComponentProps) {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const { currentWorkspace } = useWorkspace();

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("boards.client_360.title")}`
    : t("boards.client_360.title");

  return (
    <>
      <PageHead title={pageTitle} />
      <WorkspaceClient360List workspaceSlug={workspaceSlug} />
    </>
  );
}

export default observer(Visao360Page);
