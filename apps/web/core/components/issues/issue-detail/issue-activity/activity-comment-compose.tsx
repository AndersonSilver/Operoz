import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import type { TCommentsOperations } from "@operoz/types";
import { Avatar } from "@operoz/ui";
import { CommentCreate } from "@/components/comments/comment-create";
import { useUser } from "@/hooks/store/user/user-user";

type Props = {
  workspaceSlug: string;
  entityId: string;
  projectId: string;
  activityOperations: TCommentsOperations;
};

export const ActivityCommentCompose = observer(function ActivityCommentCompose(props: Props) {
  const { workspaceSlug, entityId, projectId, activityOperations } = props;
  const { t } = useTranslation();
  const { data: currentUser } = useUser();

  const displayName =
    currentUser?.display_name ||
    [currentUser?.first_name, currentUser?.last_name].filter(Boolean).join(" ") ||
    currentUser?.email ||
    "";

  return (
    <div className="flex items-start gap-3">
      <Avatar
        src={currentUser?.avatar_url}
        name={displayName}
        size={32}
        className="mt-3 self-start"
        showTooltip={false}
      />
      <div className="min-w-0 flex-1">
        <div className="overflow-hidden rounded-md border border-subtle bg-layer-2">
          <CommentCreate
            workspaceSlug={workspaceSlug}
            entityId={entityId}
            activityOperations={activityOperations}
            projectId={projectId}
            activityLayout
            showQuickReplies
          />
        </div>
        <p className="mt-2 text-11 text-tertiary">
          {t("issue.activity.comment_hint_prefix")}{" "}
          <kbd className="mx-0.5 inline-flex min-w-[18px] items-center justify-center rounded border border-subtle bg-layer-2 px-1 py-px text-10 font-medium text-secondary">
            M
          </kbd>{" "}
          {t("issue.activity.comment_hint_suffix")}
        </p>
      </div>
    </div>
  );
});
