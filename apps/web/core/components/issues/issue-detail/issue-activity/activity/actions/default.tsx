import { observer } from "mobx-react";
// plane imports
import { WorkItemsIcon } from "@operoz/propel/icons";
import { useTranslation } from "@operoz/i18n";
import { EInboxIssueSource } from "@operoz/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { getInboxSourceLabelKey } from "@/utils/support-ticket";
// local imports
import { IssueActivityBlockComponent } from "./";

type TIssueDefaultActivity = { activityId: string; ends: "top" | "bottom" | undefined };

export const IssueDefaultActivity = observer(function IssueDefaultActivity(props: TIssueDefaultActivity) {
  const { activityId, ends } = props;
  const { t } = useTranslation();
  // hooks
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  const activity = getActivityById(activityId);

  if (!activity) return <></>;
  const source = activity.source_data?.source as EInboxIssueSource | undefined;

  return (
    <IssueActivityBlockComponent
      activityId={activityId}
      icon={<WorkItemsIcon width={14} height={14} className="text-secondary" aria-hidden="true" />}
      ends={ends}
    >
      <>
        {activity.verb === "created" ? (
          source && source !== EInboxIssueSource.IN_APP ? (
            <span>{t("inbox_issue.activity.created_via_source", { source: t(getInboxSourceLabelKey(source)) })}</span>
          ) : (
            <span>{t("inbox_issue.activity.created_in_app")}</span>
          )
        ) : (
          <span>{t("inbox_issue.activity.removed_work_item")}</span>
        )}
      </>
    </IssueActivityBlockComponent>
  );
});
