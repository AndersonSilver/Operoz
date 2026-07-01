import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTranslation } from "@operoz/i18n";
import { PageHead } from "@/components/core/page-title";
import { WorkspacePrdReviewInbox } from "@/components/workspace/prd-review/workspace-prd-review-inbox";
import { useWorkspace } from "@/hooks/store/use-workspace";
import type { Route } from "./+types/page";

function PrdReviewInboxPage(_props: Route.ComponentProps) {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const { currentWorkspace } = useWorkspace();

  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("page_review.inbox_title")}`
    : t("page_review.inbox_title");

  return (
    <>
      <PageHead title={pageTitle} />
      <WorkspacePrdReviewInbox workspaceSlug={workspaceSlug} />
    </>
  );
}

export default observer(PrdReviewInboxPage);
