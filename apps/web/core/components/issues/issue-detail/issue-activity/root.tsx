import { useMemo } from "react";
import { observer } from "mobx-react";
// plane package imports
import { E_SORT_ORDER, EUserPermissions } from "@operoz/constants";
import { useLocalStorage } from "@operoz/hooks";
// i18n
import { useTranslation } from "@operoz/i18n";
//types
import type { TFileSignedURLResponse, TIssueComment } from "@operoz/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { useBoardIssueCapabilities } from "@/hooks/use-board-issue-capabilities";
// plane web components
import { IssueActivityWorklogCreateButton } from "@/plane-web/components/issues/worklog/activity/worklog-create-button";
import { ActivityCommentCompose } from "./activity-comment-compose";
import { IssueActivityCommentRoot } from "./activity-comment-root";
import { useWorkItemCommentOperations } from "./helper";
import { ActivitySortRoot } from "./sort-root";
import { ActivityViewTabs } from "./activity-view-tabs";
import { DEFAULT_ACTIVITY_VIEW_TAB, EActivityViewTab } from "./activity-view-tabs.config";

type TIssueActivity = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
  isIntakeIssue?: boolean;
};

export type TActivityOperations = {
  createComment: (data: Partial<TIssueComment>) => Promise<TIssueComment>;
  updateComment: (commentId: string, data: Partial<TIssueComment>) => Promise<void>;
  removeComment: (commentId: string) => Promise<void>;
  uploadCommentAsset: (blockId: string, file: File, commentId?: string) => Promise<TFileSignedURLResponse>;
};

export const IssueActivity = observer(function IssueActivity(props: TIssueActivity) {
  const { workspaceSlug, projectId, issueId, disabled = false, isIntakeIssue = false } = props;
  const { t } = useTranslation();
  const { setValue: setActiveTab, storedValue: activeTab } = useLocalStorage(
    "issue_activity_view_tab",
    DEFAULT_ACTIVITY_VIEW_TAB
  );
  const { setValue: setSortOrder, storedValue: sortOrder } = useLocalStorage("activity_sort_order", E_SORT_ORDER.ASC);
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  const { getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();
  const { getProjectById } = useProject();
  const { data: currentUser } = useUser();
  const issue = issueId ? getIssueById(issueId) : undefined;
  const currentUserProjectRole = getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId);
  const isAdmin = currentUserProjectRole === EUserPermissions.ADMIN;
  const isGuest = currentUserProjectRole === EUserPermissions.GUEST;
  const isAssigned = issue?.assignee_ids && currentUser?.id ? issue?.assignee_ids.includes(currentUser?.id) : false;
  const isWorklogButtonEnabled = !isIntakeIssue && !isGuest && (isAdmin || isAssigned);

  const resolvedTab = (activeTab as EActivityViewTab) || DEFAULT_ACTIVITY_VIEW_TAB;

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === E_SORT_ORDER.ASC ? E_SORT_ORDER.DESC : E_SORT_ORDER.ASC);
  };

  const activityOperations = useWorkItemCommentOperations(workspaceSlug, projectId, issueId);

  const project = getProjectById(projectId);
  const { canCommentAdd } = useBoardIssueCapabilities(projectId, { readOnly: disabled });

  const showCommentCompose = useMemo(
    () => !disabled && canCommentAdd && resolvedTab === EActivityViewTab.COMMENTS,
    [canCommentAdd, disabled, resolvedTab]
  );

  if (!project) return <></>;

  return (
    <section className="space-y-4">
      <h3 className="text-14 font-semibold text-primary">{t("common.activity")}</h3>

      <div className="flex items-center justify-between gap-3">
        <ActivityViewTabs activeTab={resolvedTab} onTabChange={setActiveTab} />
        <div className="flex flex-shrink-0 items-center gap-1">
          {isWorklogButtonEnabled && (
            <IssueActivityWorklogCreateButton
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              disabled={disabled}
            />
          )}
          <ActivitySortRoot sortOrder={sortOrder || E_SORT_ORDER.ASC} toggleSort={toggleSortOrder} />
        </div>
      </div>

      {showCommentCompose && (
        <ActivityCommentCompose
          workspaceSlug={workspaceSlug}
          entityId={issueId}
          projectId={projectId}
          activityOperations={activityOperations}
        />
      )}

      <div className="pt-1">
        <IssueActivityCommentRoot
          projectId={projectId}
          workspaceSlug={workspaceSlug}
          isIntakeIssue={isIntakeIssue}
          issueId={issueId}
          viewTab={resolvedTab}
          activityOperations={activityOperations}
          showAccessSpecifier={!!project.anchor}
          disabled={disabled}
          sortOrder={sortOrder || E_SORT_ORDER.ASC}
        />
      </div>
    </section>
  );
});
