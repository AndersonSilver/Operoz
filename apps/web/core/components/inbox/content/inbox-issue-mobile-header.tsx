import { observer } from "mobx-react";
import { Clock, FileStack, MoreHorizontal, PanelLeft, MoveRight } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { IconButton, getIconButtonStyling } from "@operis/propel/icon-button";
import {
  LinkIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleFilledIcon,
  CloseCircleFilledIcon,
} from "@operis/propel/icons";
import type { TNameDescriptionLoader } from "@operis/types";
import { EHubMode } from "@operis/types";

import { Header, CustomMenu, EHeaderVariant } from "@operis/ui";
import { cn, findHowManyDaysLeft } from "@operis/utils";
// components
import { NameDescriptionUpdateStatus } from "@/components/issues/issue-update-status";
// store types
import type { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";

// local imports
import { InboxIssueStatus } from "../inbox-issue-status";

type Props = {
  hubMode: EHubMode;
  workspaceSlug: string;
  inboxIssue: IInboxIssueStore | undefined;
  isSubmitting: TNameDescriptionLoader;
  handleInboxIssueNavigation: (direction: "next" | "prev") => void;
  canMarkAsAccepted: boolean;
  canMarkAsDeclined: boolean;
  isClosed: boolean;
  canMarkAsDuplicate: boolean;
  canDelete: boolean;
  setAcceptIssueModal: (value: boolean) => void;
  setDeclineIssueModal: (value: boolean) => void;
  setDeleteIssueModal: (value: boolean) => void;
  handleInboxIssueReopen?: () => Promise<void>;
  canReopen?: boolean;
  handleIssueSnoozeAction: () => Promise<void>;
  setSelectDuplicateIssue: (value: boolean) => void;
  handleCopyIssueLink: () => void;
  isMobileSidebar: boolean;
  setIsMobileSidebar: (value: boolean) => void;
  isNotificationEmbed: boolean;
  embedRemoveCurrentNotification?: () => void;
};

export const InboxIssueActionsMobileHeader = observer(function InboxIssueActionsMobileHeader(props: Props) {
  const {
    inboxIssue,
    isSubmitting,
    handleInboxIssueNavigation,
    canMarkAsAccepted,
    canMarkAsDeclined,
    canDelete,
    canMarkAsDuplicate,
    isClosed,
    workspaceSlug,
    hubMode,
    setAcceptIssueModal,
    setDeclineIssueModal,
    setDeleteIssueModal,
    handleInboxIssueReopen,
    canReopen,
    handleIssueSnoozeAction,
    setSelectDuplicateIssue,
    handleCopyIssueLink,
    isMobileSidebar,
    setIsMobileSidebar,
    isNotificationEmbed,
    embedRemoveCurrentNotification,
  } = props;
  const { t } = useTranslation();

  const issue = inboxIssue?.issue;
  const currentInboxIssueId = issue?.id;
  // days left for snooze
  const numberOfDaysLeft = findHowManyDaysLeft(inboxIssue?.snoozed_till);

  if (!issue || !inboxIssue) return null;

  return (
    <Header variant={EHeaderVariant.SECONDARY} className="justify-start">
      {isNotificationEmbed && (
        <button onClick={embedRemoveCurrentNotification}>
          <MoveRight className="mr-2 h-4 w-4 text-tertiary hover:text-secondary" />
        </button>
      )}
      <PanelLeft
        onClick={() => setIsMobileSidebar(!isMobileSidebar)}
        className={cn("my-auto mr-2 h-4 w-4 flex-shrink-0", isMobileSidebar ? "text-accent-primary" : "text-secondary")}
      />
      <div className="z-[15] flex w-full items-center gap-2 bg-surface-1">
        <div className="flex items-center gap-x-2">
          <IconButton
            variant="secondary"
            size="lg"
            icon={ChevronUpIcon}
            aria-label="Previous support ticket"
            onClick={() => handleInboxIssueNavigation("prev")}
          />
          <IconButton
            variant="secondary"
            size="lg"
            icon={ChevronDownIcon}
            aria-label="Next support ticket"
            onClick={() => handleInboxIssueNavigation("next")}
          />
        </div>
        <div className="flex items-center gap-4">
          <InboxIssueStatus inboxIssue={inboxIssue} iconSize={12} hubMode={hubMode} />
          <div className="flex w-full items-center justify-end">
            <NameDescriptionUpdateStatus isSubmitting={isSubmitting} />
          </div>
        </div>
        <div className="ml-auto">
          <CustomMenu
            customButton={<MoreHorizontal className="size-4" />}
            customButtonClassName={getIconButtonStyling("secondary", "lg")}
            placement="bottom-start"
          >
            {isClosed && (
              <CustomMenu.MenuItem onClick={handleCopyIssueLink}>
                <div className="flex items-center gap-2">
                  <LinkIcon width={14} height={14} strokeWidth={2} />
                  {t("inbox_issue.actions.copy")}
                </div>
              </CustomMenu.MenuItem>
            )}
            {canMarkAsAccepted && !isClosed && (
              <CustomMenu.MenuItem onClick={handleIssueSnoozeAction}>
                <div className="flex items-center gap-2">
                  <Clock size={14} strokeWidth={2} />
                  {inboxIssue?.snoozed_till && numberOfDaysLeft && numberOfDaysLeft > 0
                    ? t("inbox_issue.actions.unsnooze")
                    : t("inbox_issue.actions.snooze")}
                </div>
              </CustomMenu.MenuItem>
            )}
            {canMarkAsDuplicate && !isClosed && (
              <CustomMenu.MenuItem onClick={() => setSelectDuplicateIssue(true)}>
                <div className="flex items-center gap-2">
                  <FileStack size={14} strokeWidth={2} />
                  {t("inbox_issue.actions.mark_as_duplicate")}
                </div>
              </CustomMenu.MenuItem>
            )}
            {canMarkAsAccepted && (
              <CustomMenu.MenuItem onClick={() => setAcceptIssueModal(true)}>
                <div className="flex items-center gap-2 text-success-secondary">
                  <CheckCircleFilledIcon width={14} height={14} />
                  {t("inbox_issue.actions.accept")}
                </div>
              </CustomMenu.MenuItem>
            )}
            {canMarkAsDeclined && (
              <CustomMenu.MenuItem onClick={() => setDeclineIssueModal(true)}>
                <div className="flex items-center gap-2 text-danger-secondary">
                  <CloseCircleFilledIcon width={14} height={14} />
                  {t("inbox_issue.actions.decline")}
                </div>
              </CustomMenu.MenuItem>
            )}
            {canReopen && handleInboxIssueReopen && (
              <CustomMenu.MenuItem onClick={handleInboxIssueReopen}>
                <div className="flex items-center gap-2">{t("inbox_issue.actions.reopen")}</div>
              </CustomMenu.MenuItem>
            )}
            {canDelete && !isClosed && (
              <CustomMenu.MenuItem onClick={() => setDeleteIssueModal(true)}>
                <div className="flex items-center gap-2 text-danger-primary">
                  <TrashIcon height={14} width={14} strokeWidth={2} />
                  {t("inbox_issue.actions.delete")}
                </div>
              </CustomMenu.MenuItem>
            )}
          </CustomMenu>
        </div>
      </div>
    </Header>
  );
});
