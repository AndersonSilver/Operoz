import { useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Circle } from "lucide-react";
import {
  EProjectFeatureKey,
  EUserPermissions,
  EUserPermissionsLevel,
  ISSUE_LAYOUTS,
  SPACE_BASE_PATH,
  SPACE_BASE_URL,
  WORK_ITEM_TRACKER_ELEMENTS,
} from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { NewTabIcon } from "@operis/propel/icons";
import { EIssuesStoreType } from "@operis/types";
import { Header } from "@operis/ui";
import { HeaderFilters } from "@/components/issues/filters";
import {
  ProjectFeaturePageHeader,
  ProjectFeaturePageTitle,
} from "@/components/project/project-feature-page-header";
import { ProjectHubPrimaryAction } from "@/components/project/project-hub-toolbar";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";

export const IssuesHeader = observer(function IssuesHeader() {
  const { workspaceSlug, projectId } = useParams();
  const {
    issues: { getGroupIssueCount },
    issuesFilter: { issueFilters },
  } = useIssues(EIssuesStoreType.PROJECT);
  const { t } = useTranslation();
  const { currentProjectDetails, loader } = useProject();
  const { toggleCreateIssueModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();

  const SPACE_APP_URL = (SPACE_BASE_URL.trim() === "" ? window.location.origin : SPACE_BASE_URL) + SPACE_BASE_PATH;
  const publishedURL = `${SPACE_APP_URL}/issues/${currentProjectDetails?.anchor}`;

  const issuesCount = getGroupIssueCount(undefined, undefined, false);
  const canUserCreateIssue = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  const activeLayout = issueFilters?.displayFilters?.layout;
  const layoutTitle = ISSUE_LAYOUTS.find((layout) => layout.key === activeLayout)?.i18n_title;

  const pageSubtitle = useMemo(() => {
    const parts: string[] = [];
    if (issuesCount !== undefined && issuesCount >= 0) {
      parts.push(t("issue.label", { count: issuesCount }));
    }
    if (layoutTitle) {
      parts.push(t(layoutTitle));
    }
    return parts.join(" · ");
  }, [issuesCount, layoutTitle, t]);

  return (
    <ProjectFeaturePageHeader>
      <Header.LeftItem>
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <ProjectFeaturePageTitle
            featureKey={EProjectFeatureKey.WORK_ITEMS}
            subtitle={loader === "init-loader" ? undefined : pageSubtitle}
            isLoading={loader === "init-loader"}
          />
          {currentProjectDetails?.anchor ? (
            <a
              href={publishedURL}
              className="group flex items-center gap-1.5 rounded-md border border-subtle/50 bg-layer-1/55 px-2.5 py-1 text-11 font-medium text-accent-primary shadow-sm backdrop-blur-sm"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Circle className="h-1.5 w-1.5 fill-accent-primary" strokeWidth={2} />
              {t("workspace_projects.network.public.title")}
              <NewTabIcon className="hidden h-3 w-3 group-hover:block" strokeWidth={2} />
            </a>
          ) : null}
        </div>
      </Header.LeftItem>
      <Header.RightItem>
        <div className="hidden md:block">
          <HeaderFilters
            projectId={projectId?.toString() ?? ""}
            currentProjectDetails={currentProjectDetails}
            workspaceSlug={workspaceSlug?.toString() ?? ""}
            canUserCreateIssue={canUserCreateIssue}
            onAddIssue={
              canUserCreateIssue
                ? () => toggleCreateIssueModal(true, EIssuesStoreType.PROJECT)
                : undefined
            }
            addIssueTrackerElement={WORK_ITEM_TRACKER_ELEMENTS.HEADER_ADD_BUTTON.WORK_ITEMS}
          />
        </div>
        {canUserCreateIssue ? (
          <div className="md:hidden">
            <ProjectHubPrimaryAction
              data-ph-element={WORK_ITEM_TRACKER_ELEMENTS.HEADER_ADD_BUTTON.WORK_ITEMS}
              onClick={() => toggleCreateIssueModal(true, EIssuesStoreType.PROJECT)}
            >
              {t("add")}
            </ProjectHubPrimaryAction>
          </div>
        ) : null}
      </Header.RightItem>
    </ProjectFeaturePageHeader>
  );
});
