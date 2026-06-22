import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { EUserPermissionsLevel } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { EUserProjectRoles, EInboxIssueCurrentTab, EHubMode } from "@operis/types";
import darkIntakeAsset from "@/app/assets/empty-state/disabled-feature/intake-dark.webp?url";
import lightIntakeAsset from "@/app/assets/empty-state/disabled-feature/intake-light.webp?url";
import { PageHead } from "@/components/core/page-title";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { InboxIssueRoot } from "@/components/inbox";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import type { Route } from "./+types/page";

function ProjectSupportPage({ params }: Route.ComponentProps) {
  const router = useAppRouter();
  const { workspaceSlug, projectId } = params;
  const searchParams = useSearchParams();
  const navigationTab = searchParams.get("currentTab");
  const inboxIssueId = searchParams.get("inboxIssueId");
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const { currentProjectDetails } = useProject();
  const { allowPermissions } = useUserPermissions();

  const canPerformEmptyStateActions = allowPermissions([EUserProjectRoles.ADMIN], EUserPermissionsLevel.PROJECT);
  const resolvedPath = resolvedTheme === "light" ? lightIntakeAsset : darkIntakeAsset;

  if (currentProjectDetails?.support_view === false) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <DetailedEmptyState
          title={t("disabled_project.empty_state.inbox.title")}
          description={t("disabled_project.empty_state.inbox.description")}
          assetPath={resolvedPath}
          primaryButton={{
            text: t("disabled_project.empty_state.inbox.primary_button.text"),
            onClick: () => {
              router.push(`/${workspaceSlug}/settings/projects/${projectId}/features`);
            },
            disabled: !canPerformEmptyStateActions,
          }}
        />
      </div>
    );
  }

  const pageTitle = currentProjectDetails?.name
    ? t("inbox_issue.page_label_support", { workspace: currentProjectDetails.name })
    : t("inbox_issue.page_label_support", { workspace: "Plane" });

  const currentNavigationTab = navigationTab
    ? navigationTab === "open"
      ? EInboxIssueCurrentTab.OPEN
      : navigationTab === "in_progress"
        ? EInboxIssueCurrentTab.IN_PROGRESS
        : EInboxIssueCurrentTab.CLOSED
    : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageHead title={pageTitle} />
      <div className="h-full min-h-0 w-full overflow-hidden">
        <InboxIssueRoot
          hubMode={EHubMode.SUPPORT}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          inboxIssueId={inboxIssueId || undefined}
          inboxAccessible={currentProjectDetails?.support_view || false}
          navigationTab={currentNavigationTab}
        />
      </div>
    </div>
  );
}

export default observer(ProjectSupportPage);
