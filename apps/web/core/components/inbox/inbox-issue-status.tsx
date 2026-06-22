import React from "react";
import { observer } from "mobx-react";
// constants
// helpers
import { INBOX_STATUS } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { EHubMode, EInboxIssueStatus } from "@operis/types";
import { cn, findHowManyDaysLeft } from "@operis/utils";
// store
import type { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";
import { ICON_PROPERTIES, InboxStatusIcon } from "./inbox-status-icon";

type Props = {
  inboxIssue: IInboxIssueStore;
  iconSize?: number;
  showDescription?: boolean;
  hubMode?: EHubMode;
};

export const InboxIssueStatus = observer(function InboxIssueStatus(props: Props) {
  const { inboxIssue, iconSize = 16, showDescription = false, hubMode } = props;
  //hooks
  const { t } = useTranslation();
  // derived values
  const inboxIssueStatusDetail = INBOX_STATUS.find((s) => s.status === inboxIssue.status);

  const isSnoozedDatePassed = inboxIssue.status === 0 && new Date(inboxIssue.snoozed_till ?? "") < new Date();
  if (!inboxIssueStatusDetail || isSnoozedDatePassed) return <></>;

  const description = t(inboxIssueStatusDetail.i18n_description(), {
    days: findHowManyDaysLeft(new Date(inboxIssue.snoozed_till ?? "")),
  });
  const statusTitle =
    hubMode === EHubMode.SUPPORT && inboxIssue.status === EInboxIssueStatus.PENDING
      ? t("inbox_issue.status_support.pending.title")
      : t(inboxIssueStatusDetail.i18n_title);
  const statusIcon = ICON_PROPERTIES[inboxIssue?.status];

  return (
    <div
      className={cn(
        `relative flex flex-col gap-1 rounded-sm p-1.5 py-0.5 ${statusIcon.textColor(
          isSnoozedDatePassed
        )} ${statusIcon.bgColor(isSnoozedDatePassed)}`
      )}
    >
      <div className={`flex items-center gap-1`}>
        <InboxStatusIcon type={inboxIssue?.status} size={iconSize} className="flex-shrink-0" renderColor={false} />
        <div className="text-11 font-medium whitespace-nowrap">
          {inboxIssue?.status === 0 && inboxIssue?.snoozed_till ? description : statusTitle}
        </div>
      </div>
      {showDescription && <div className="text-13 whitespace-nowrap">{description}</div>}
    </div>
  );
});
