import { observer } from "mobx-react";
// operoz imports
import { useTranslation } from "@operoz/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { NotificationsRoot } from "@/components/workspace-notifications";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

function WorkspaceDashboardPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  // operoz hooks
  const { t } = useTranslation();
  // hooks
  const { currentWorkspace } = useWorkspace();
  // derived values
  const pageTitle = currentWorkspace?.name
    ? t("notification.page_label", { workspace: currentWorkspace?.name })
    : undefined;

  return (
    <>
      <PageHead title={pageTitle} />
      <NotificationsRoot workspaceSlug={workspaceSlug} />
    </>
  );
}

export default observer(WorkspaceDashboardPage);
