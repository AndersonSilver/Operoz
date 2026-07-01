import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import type { TInboxIssueDeclineCategory } from "@operoz/types";
// hooks
import { IntakeIcon } from "@operoz/propel/icons";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// components
import { IssueActivityBlockComponent } from "./";

type TIssueInboxActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueInboxActivity = observer(function IssueInboxActivity(props: TIssueInboxActivity) {
  const { activityId, ends } = props;
  const { t } = useTranslation();
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  const getInboxActivityMessage = () => {
    const comment = activity?.comment?.trim();

    if (comment?.startsWith("declined support ticket")) {
      const match = comment.match(/^declined support ticket \(([^)]+)\): (.+)$/);
      if (match) {
        const categoryKey = match[1] as TInboxIssueDeclineCategory;
        return t("inbox_issue.activity.declined_with_details", {
          category: t(`inbox_issue.decline_categories.${categoryKey}`),
          reason: match[2],
        });
      }
    }

    if (comment?.startsWith("snoozed support ticket:")) {
      return t("inbox_issue.activity.snoozed_with_reason", {
        reason: comment.replace("snoozed support ticket:", "").trim(),
      });
    }

    if (comment === "reopened support ticket") {
      return t("inbox_issue.activity.reopened");
    }

    if (comment?.startsWith("permanently deleted support ticket:")) {
      return t("inbox_issue.activity.deleted_with_reason", {
        reason: comment.replace("permanently deleted support ticket:", "").trim(),
      });
    }

    switch (activity?.verb) {
      case "-1":
        return t("inbox_issue.activity.declined");
      case "0":
        return t("inbox_issue.activity.snoozed");
      case "1":
        return t("inbox_issue.activity.accepted");
      case "2":
        return t("inbox_issue.activity.duplicate");
      case "3":
        return t("inbox_issue.activity.closed");
      case "deleted":
        return t("inbox_issue.activity.deleted");
      default:
        return t("inbox_issue.activity.status_updated");
    }
  };

  if (!activity) return <></>;
  return (
    <IssueActivityBlockComponent
      icon={<IntakeIcon className="h-4 w-4 flex-shrink-0 text-secondary" />}
      activityId={activityId}
      ends={ends}
    >
      <>{getInboxActivityMessage()}</>
    </IssueActivityBlockComponent>
  );
});
