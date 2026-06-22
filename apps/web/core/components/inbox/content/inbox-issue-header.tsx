import { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Clock, FileStack, MoreHorizontal, MoveRight } from "lucide-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { IconButton, getIconButtonStyling } from "@operis/propel/icon-button";
import {
  LinkIcon,
  CopyIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleFilledIcon,
  CloseCircleFilledIcon,
} from "@operis/propel/icons";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { TNameDescriptionLoader, THubMode } from "@operis/types";
import { EInboxIssueStatus, EInboxIssueCurrentTab, EHubMode } from "@operis/types";
import { getInboxHubIssueUrl } from "@/utils/inbox-hub";
import { CustomMenu, Row } from "@operis/ui";
import { copyUrlToClipboard, findHowManyDaysLeft } from "@operis/utils";
// components
import { NameDescriptionUpdateStatus } from "@/components/issues/issue-update-status";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { useUserPermissions } from "@/hooks/store/user";
import { useSupportTicketCapabilities } from "@/hooks/use-support-ticket-capabilities";
import { useAppRouter } from "@/hooks/use-app-router";
import { shouldShowSlaBadge } from "@/utils/support-ticket";
// store
import type { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";
// local imports
import { InboxIssueStatus } from "../inbox-issue-status";
import { AcceptIntakeModal } from "../modals/accept-intake-modal";
import { AcceptSupportTicketModal } from "../modals/accept-support-ticket-modal";
import { CloseSupportTicketModal } from "../modals/close-support-ticket-modal";
import { DeclineIssueModal } from "../modals/decline-issue-modal";
import { DeleteInboxIssueModal } from "../modals/delete-issue-modal";
import { SelectDuplicateInboxIssueModal } from "../modals/select-duplicate";
import { InboxIssueSnoozeModal } from "../modals/snooze-issue-modal";
import { InboxIssueActionsMobileHeader } from "./inbox-issue-mobile-header";

type TInboxIssueActionsHeader = {
  hubMode: THubMode;
  workspaceSlug: string;
  projectId: string;
  inboxIssue: IInboxIssueStore | undefined;
  isSubmitting: TNameDescriptionLoader;
  isMobileSidebar: boolean;
  setIsMobileSidebar: (value: boolean) => void;
  isNotificationEmbed: boolean;
  embedRemoveCurrentNotification?: () => void;
};

export const InboxIssueActionsHeader = observer(function InboxIssueActionsHeader(props: TInboxIssueActionsHeader) {
  const {
    hubMode,
    workspaceSlug,
    projectId,
    inboxIssue,
    isSubmitting,
    isMobileSidebar,
    setIsMobileSidebar,
    isNotificationEmbed = false,
    embedRemoveCurrentNotification,
  } = props;
  // states
  const [isSnoozeDateModalOpen, setIsSnoozeDateModalOpen] = useState(false);
  const [selectDuplicateIssue, setSelectDuplicateIssue] = useState(false);
  const [acceptIssueModal, setAcceptIssueModal] = useState(false);
  const [closeIssueModal, setCloseIssueModal] = useState(false);
  const [declineIssueModal, setDeclineIssueModal] = useState(false);
  const [deleteIssueModal, setDeleteIssueModal] = useState(false);
  // store
  const { currentTab, deleteInboxIssue, filteredInboxIssueIds, handleCurrentTab } = useProjectInbox();
  const { allowPermissions } = useUserPermissions();
  const { canDeleteSupportTicket } = useSupportTicketCapabilities(projectId);
  const { getPartialProjectById } = useProject();
  const currentProjectDetails = getPartialProjectById(projectId);
  const { t } = useTranslation();

  const isSupportHub = hubMode === EHubMode.SUPPORT;
  const hubIssueUrl = (params?: { currentTab?: string; inboxIssueId?: string }) =>
    getInboxHubIssueUrl(workspaceSlug, projectId, hubMode, params);
  const router = useAppRouter();
  const { getProjectById } = useProject();

  const issue = inboxIssue?.issue;
  // derived values
  const isAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );
  const canMarkAsDuplicate = isAllowed && (inboxIssue?.status === 0 || inboxIssue?.status === -2);
  const canMarkAsAccepted = isAllowed && (inboxIssue?.status === 0 || inboxIssue?.status === -2);
  const canMarkAsDeclined = isAllowed && (inboxIssue?.status === 0 || inboxIssue?.status === -2);
  const canDelete = canDeleteSupportTicket;
  const isDeclined = inboxIssue?.status === EInboxIssueStatus.DECLINED;
  const canCloseSupportTicket = isSupportHub && isAllowed && inboxIssue?.status === EInboxIssueStatus.ACCEPTED;
  const canReopen = isAllowed && (isDeclined || (isSupportHub && inboxIssue?.status === EInboxIssueStatus.CLOSED));
  const showSlaBadge = isSupportHub && shouldShowSlaBadge(inboxIssue?.support_ticket, inboxIssue?.status);
  const isClosed = inboxIssue?.status
    ? isSupportHub
      ? [-1, 2, 3].includes(inboxIssue.status)
      : [EInboxIssueStatus.ACCEPTED, EInboxIssueStatus.DECLINED, EInboxIssueStatus.DUPLICATE].includes(
          inboxIssue.status
        )
    : false;
  // days left for snooze
  const numberOfDaysLeft = findHowManyDaysLeft(inboxIssue?.snoozed_till);

  const currentInboxIssueId = inboxIssue?.issue?.id;

  const redirectIssue = (): string | undefined => {
    let nextOrPreviousIssueId: string | undefined = undefined;
    const currentIssueIndex = filteredInboxIssueIds.findIndex((id) => id === currentInboxIssueId);
    if (filteredInboxIssueIds[currentIssueIndex + 1])
      nextOrPreviousIssueId = filteredInboxIssueIds[currentIssueIndex + 1];
    else if (filteredInboxIssueIds[currentIssueIndex - 1])
      nextOrPreviousIssueId = filteredInboxIssueIds[currentIssueIndex - 1];
    else nextOrPreviousIssueId = undefined;
    return nextOrPreviousIssueId;
  };

  const handleRedirection = (nextOrPreviousIssueId: string | undefined) => {
    if (!isNotificationEmbed) {
      if (nextOrPreviousIssueId) router.push(hubIssueUrl({ currentTab, inboxIssueId: nextOrPreviousIssueId }));
      else router.push(hubIssueUrl({ currentTab }));
    }
  };

  const handleInboxIssueAcceptSupport = async (queueId: string) => {
    if (!inboxIssue?.issue?.id) return;
    await inboxIssue.acceptInboxIssue(queueId);
    setAcceptIssueModal(false);
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: t("common.success"),
      message: t("inbox_issue.modals.accept.success"),
    });
    handleCurrentTab(workspaceSlug, projectId, EInboxIssueCurrentTab.IN_PROGRESS);
    if (!isNotificationEmbed) {
      router.push(
        hubIssueUrl({
          currentTab: EInboxIssueCurrentTab.IN_PROGRESS,
          inboxIssueId: inboxIssue.issue.id,
        })
      );
    }
  };

  const handleInboxIssueAcceptIntake = async () => {
    if (!inboxIssue?.issue?.id) return;
    await inboxIssue.acceptInboxIssue();
    setAcceptIssueModal(false);
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: t("common.success"),
      message: t("inbox_issue.modals.accept.intake_success"),
    });
    handleCurrentTab(workspaceSlug, projectId, EInboxIssueCurrentTab.CLOSED);
    if (!isNotificationEmbed) {
      router.push(
        hubIssueUrl({
          currentTab: EInboxIssueCurrentTab.CLOSED,
          inboxIssueId: inboxIssue.issue.id,
        })
      );
    }
  };

  const handleInboxIssueClose = async (resolutionNote: string) => {
    if (!inboxIssue?.issue?.id) return;
    const nextOrPreviousIssueId = redirectIssue();
    await inboxIssue.closeInboxIssue(resolutionNote);
    setCloseIssueModal(false);
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: t("common.success"),
      message: t("inbox_issue.modals.close.success"),
    });
    handleCurrentTab(workspaceSlug, projectId, EInboxIssueCurrentTab.CLOSED);
    handleRedirection(nextOrPreviousIssueId);
  };

  const handleInboxIssueDecline = async (payload: {
    decline_category: import("@operis/types").TInboxIssueDeclineCategory;
    decline_reason: string;
  }) => {
    const nextOrPreviousIssueId = redirectIssue();
    await inboxIssue?.declineInboxIssue(payload.decline_category, payload.decline_reason);
    setDeclineIssueModal(false);
    handleRedirection(nextOrPreviousIssueId);
  };

  const handleInboxIssueReopen = async () => {
    const nextOrPreviousIssueId = redirectIssue();
    await inboxIssue?.reopenInboxIssue();
    handleRedirection(nextOrPreviousIssueId);
  };

  const handleInboxIssueSnooze = async (date: Date, snoozeReason?: string) => {
    const nextOrPreviousIssueId = redirectIssue();
    await inboxIssue?.updateInboxIssueSnoozeTill(date, snoozeReason);
    setIsSnoozeDateModalOpen(false);
    handleRedirection(nextOrPreviousIssueId);
  };

  const handleInboxIssueDuplicate = async (issueId: string) => {
    await inboxIssue?.updateInboxIssueDuplicateTo(issueId);
  };

  const handleInboxIssueDelete = async (deleteReason: string) => {
    if (!inboxIssue || !currentInboxIssueId) return;
    await deleteInboxIssue(workspaceSlug, projectId, currentInboxIssueId, deleteReason).then(() => {
      if (!isNotificationEmbed) router.push(hubIssueUrl());
    });
  };

  const handleIssueSnoozeAction = async () => {
    if (inboxIssue?.snoozed_till && numberOfDaysLeft && numberOfDaysLeft > 0) {
      const nextOrPreviousIssueId = redirectIssue();
      await inboxIssue?.updateInboxIssueSnoozeTill(undefined);
      handleRedirection(nextOrPreviousIssueId);
    } else {
      setIsSnoozeDateModalOpen(true);
    }
  };

  const handleCopyIssueLink = (path: string) =>
    copyUrlToClipboard(path).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.link_copied"),
        message: t("common.copied_to_clipboard"),
      })
    );

  const currentIssueIndex = filteredInboxIssueIds.findIndex((issueId) => issueId === currentInboxIssueId) ?? 0;

  const handleInboxIssueNavigation = useCallback(
    (direction: "next" | "prev") => {
      if (!filteredInboxIssueIds || !currentInboxIssueId) return;
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && (activeElement.classList.contains("tiptap") || activeElement.id === "title-input")) return;
      const nextIssueIndex =
        direction === "next"
          ? (currentIssueIndex + 1) % filteredInboxIssueIds.length
          : (currentIssueIndex - 1 + filteredInboxIssueIds.length) % filteredInboxIssueIds.length;
      const nextIssueId = filteredInboxIssueIds[nextIssueIndex];
      if (!nextIssueId) return;
      router.push(hubIssueUrl({ inboxIssueId: nextIssueId }));
    },
    [currentInboxIssueId, currentIssueIndex, filteredInboxIssueIds, projectId, router, workspaceSlug]
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.classList?.contains("tiptap") || target?.id === "title-input" || target.tagName === "TEXTAREA") {
        return;
      }
      if (e.key === "ArrowUp") {
        handleInboxIssueNavigation("prev");
      } else if (e.key === "ArrowDown") {
        handleInboxIssueNavigation("next");
      } else if ((e.key === "a" || e.key === "A") && canMarkAsAccepted) {
        setAcceptIssueModal(true);
      } else if ((e.key === "r" || e.key === "R") && canMarkAsDeclined) {
        setDeclineIssueModal(true);
      }
    },
    [canMarkAsAccepted, canMarkAsDeclined, handleInboxIssueNavigation]
  );

  useEffect(() => {
    if (isSubmitting === "submitting") return;
    if (!isNotificationEmbed) document.addEventListener("keydown", onKeyDown);
    return () => {
      if (!isNotificationEmbed) document.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown, isNotificationEmbed, isSubmitting]);

  if (!inboxIssue) return null;

  const issueLink = hubIssueUrl({ currentTab, inboxIssueId: currentInboxIssueId });

  return (
    <>
      <>
        <SelectDuplicateInboxIssueModal
          isOpen={selectDuplicateIssue}
          onClose={() => setSelectDuplicateIssue(false)}
          value={inboxIssue?.duplicate_to}
          onSubmit={handleInboxIssueDuplicate}
        />
        {isSupportHub ? (
          <AcceptSupportTicketModal
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            data={inboxIssue?.issue || {}}
            isOpen={acceptIssueModal}
            onClose={() => setAcceptIssueModal(false)}
            onSubmit={handleInboxIssueAcceptSupport}
          />
        ) : (
          <AcceptIntakeModal
            data={inboxIssue?.issue || {}}
            isOpen={acceptIssueModal}
            onClose={() => setAcceptIssueModal(false)}
            onSubmit={handleInboxIssueAcceptIntake}
          />
        )}
        {isSupportHub && (
          <CloseSupportTicketModal
            data={inboxIssue?.issue || {}}
            isOpen={closeIssueModal}
            onClose={() => setCloseIssueModal(false)}
            onSubmit={handleInboxIssueClose}
          />
        )}
        <DeclineIssueModal
          data={inboxIssue?.issue || {}}
          isOpen={declineIssueModal}
          onClose={() => setDeclineIssueModal(false)}
          onSubmit={handleInboxIssueDecline}
        />
        <DeleteInboxIssueModal
          data={inboxIssue?.issue}
          isOpen={deleteIssueModal}
          onClose={() => setDeleteIssueModal(false)}
          onSubmit={handleInboxIssueDelete}
        />
        <InboxIssueSnoozeModal
          isOpen={isSnoozeDateModalOpen}
          handleClose={() => setIsSnoozeDateModalOpen(false)}
          value={inboxIssue?.snoozed_till}
          onConfirm={handleInboxIssueSnooze}
        />
      </>

      <Row className="relative z-15 hidden h-full w-full items-center justify-between gap-2 border-b border-subtle bg-surface-1 lg:flex">
        <div className="flex items-center gap-4">
          {isNotificationEmbed && (
            <button onClick={embedRemoveCurrentNotification}>
              <MoveRight className="h-4 w-4 text-tertiary hover:text-secondary" />
            </button>
          )}
          {issue?.project_id && issue.sequence_id && (
            <h3 className="flex-shrink-0 text-14 font-medium text-tertiary">
              {getProjectById(issue.project_id)?.identifier}-{issue.sequence_id}
            </h3>
          )}
          <InboxIssueStatus inboxIssue={inboxIssue} iconSize={12} hubMode={hubMode} />
          {showSlaBadge && (
            <span className="rounded-md border border-danger-subtle bg-danger-subtle px-2 py-0.5 text-11 font-medium text-danger-primary">
              {t("inbox_issue.support_ticket.sla_breached")}
            </span>
          )}
          <div className="flex w-full items-center justify-end">
            <NameDescriptionUpdateStatus isSubmitting={isSubmitting} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNotificationEmbed && (
            <div className="flex items-center gap-x-2">
              <IconButton
                variant="secondary"
                size="lg"
                icon={ChevronUpIcon}
                aria-label="Previous work item"
                onClick={() => handleInboxIssueNavigation("prev")}
              />
              <IconButton
                variant="secondary"
                size="lg"
                icon={ChevronDownIcon}
                aria-label="Next work item"
                onClick={() => handleInboxIssueNavigation("next")}
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {canMarkAsAccepted && (
              <Button variant="secondary" size="lg" onClick={() => setAcceptIssueModal(true)}>
                <CheckCircleFilledIcon className="size-4 shrink-0 text-success-secondary" />
                {t("inbox_issue.actions.accept")}
              </Button>
            )}

            {canCloseSupportTicket && (
              <Button variant="primary" size="lg" onClick={() => setCloseIssueModal(true)}>
                {t("inbox_issue.actions.close")}
              </Button>
            )}

            {canMarkAsDeclined && (
              <Button variant="secondary" size="lg" onClick={() => setDeclineIssueModal(true)}>
                <CloseCircleFilledIcon className="size-4 shrink-0 text-danger-secondary" />
                {t("inbox_issue.actions.decline")}
              </Button>
            )}

            {canReopen && (
              <Button variant="secondary" size="lg" onClick={handleInboxIssueReopen}>
                {t("inbox_issue.actions.reopen")}
              </Button>
            )}

            {isClosed ? (
              <Button
                variant="secondary"
                size="lg"
                prependIcon={<LinkIcon className="h-2.5 w-2.5" />}
                onClick={() => handleCopyIssueLink(issueLink)}
              >
                {t("inbox_issue.actions.copy")}
              </Button>
            ) : (
              <>
                {isAllowed && (
                  <CustomMenu
                    customButton={<MoreHorizontal className="size-4" />}
                    customButtonClassName={getIconButtonStyling("secondary", "lg")}
                    placement="bottom-start"
                  >
                    {canMarkAsAccepted && (
                      <CustomMenu.MenuItem onClick={handleIssueSnoozeAction}>
                        <div className="flex items-center gap-2">
                          <Clock size={14} strokeWidth={2} />
                          {inboxIssue?.snoozed_till && numberOfDaysLeft && numberOfDaysLeft > 0
                            ? t("inbox_issue.actions.unsnooze")
                            : t("inbox_issue.actions.snooze")}
                        </div>
                      </CustomMenu.MenuItem>
                    )}
                    {canMarkAsDuplicate && (
                      <CustomMenu.MenuItem onClick={() => setSelectDuplicateIssue(true)}>
                        <div className="flex items-center gap-2">
                          <FileStack size={14} strokeWidth={2} />
                          {t("inbox_issue.actions.mark_as_duplicate")}
                        </div>
                      </CustomMenu.MenuItem>
                    )}
                    <CustomMenu.MenuItem onClick={() => handleCopyIssueLink(issueLink)}>
                      <div className="flex items-center gap-2">
                        <CopyIcon width={14} height={14} strokeWidth={2} />
                        {t("inbox_issue.actions.copy")}
                      </div>
                    </CustomMenu.MenuItem>
                    {canDelete && (
                      <CustomMenu.MenuItem onClick={() => setDeleteIssueModal(true)}>
                        <div className="flex items-center gap-2">
                          <TrashIcon width={14} height={14} strokeWidth={2} />
                          {t("inbox_issue.actions.delete")}
                        </div>
                      </CustomMenu.MenuItem>
                    )}
                  </CustomMenu>
                )}
              </>
            )}
          </div>
        </div>
      </Row>

      <div className="lg:hidden">
        <InboxIssueActionsMobileHeader
          hubMode={hubMode}
          inboxIssue={inboxIssue}
          isSubmitting={isSubmitting}
          handleCopyIssueLink={() => handleCopyIssueLink(issueLink)}
          setAcceptIssueModal={setAcceptIssueModal}
          setDeclineIssueModal={setDeclineIssueModal}
          handleIssueSnoozeAction={handleIssueSnoozeAction}
          setSelectDuplicateIssue={setSelectDuplicateIssue}
          setDeleteIssueModal={setDeleteIssueModal}
          canMarkAsAccepted={canMarkAsAccepted}
          canMarkAsDeclined={canMarkAsDeclined}
          canMarkAsDuplicate={canMarkAsDuplicate}
          canDelete={canDelete}
          canReopen={canReopen}
          handleInboxIssueReopen={handleInboxIssueReopen}
          isClosed={isClosed}
          handleInboxIssueNavigation={handleInboxIssueNavigation}
          workspaceSlug={workspaceSlug}
          isMobileSidebar={isMobileSidebar}
          setIsMobileSidebar={setIsMobileSidebar}
          isNotificationEmbed={isNotificationEmbed}
          embedRemoveCurrentNotification={embedRemoveCurrentNotification}
        />
      </div>
    </>
  );
});
