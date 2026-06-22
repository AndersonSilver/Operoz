import { useMemo } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { TIssue } from "@operis/types";
import { EInboxIssueStatus, EHubMode } from "@operis/types";
import type { THubMode } from "@operis/types";
import { getTextContent } from "@operis/utils";
import { IssueAttachmentRoot } from "@/components/issues/attachment";
import type { TIssueOperations } from "@/components/issues/issue-detail";
import { IssueActivity } from "@/components/issues/issue-detail/issue-activity";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { DeDupeIssuePopoverRoot } from "@/plane-web/components/de-dupe/duplicate-popover";
import { useDebouncedDuplicateIssues } from "@/plane-web/hooks/use-debounced-duplicate-issues";
import type { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";
import { InboxIssueContentProperties } from "./issue-properties";
import { SupportTicketMetadataPanel } from "./support-ticket-metadata-panel";
import { SupportTicketMetricsPanel } from "./support-ticket-metrics-panel";
import { SupportTicketTriagePanel } from "./support-ticket-triage-panel";
import { SupportTicketTrackingPanel } from "./support-ticket-tracking-panel";

type Props = {
  hubMode: THubMode;
  workspaceSlug: string;
  projectId: string;
  inboxIssue: IInboxIssueStore;
  isEditable: boolean;
};

export const InboxIssueMainContent = observer(function InboxIssueMainContent(props: Props) {
  const { hubMode, workspaceSlug, projectId, inboxIssue, isEditable } = props;
  const { t } = useTranslation();
  const { getUserDetails } = useMember();
  const { getProjectById } = useProject();
  const { removeIssue, archiveIssue } = useIssueDetail();

  const meta = inboxIssue.support_ticket;
  const issue = inboxIssue.issue;
  const createdByLabel =
    meta?.source_email ?? (issue.created_by ? getUserDetails(issue.created_by)?.display_name : undefined);

  const projectDetails = issue?.project_id ? getProjectById(issue?.project_id) : undefined;
  const isOpenTicket = [EInboxIssueStatus.PENDING, EInboxIssueStatus.SNOOZED].includes(inboxIssue.status);

  const { duplicateIssues } = useDebouncedDuplicateIssues(
    workspaceSlug,
    projectDetails?.workspace.toString(),
    projectId,
    {
      name: issue?.name,
      description_html: getTextContent(issue?.description_html),
      issueId: issue?.id,
    }
  );

  const issueOperations: TIssueOperations = useMemo(
    () => ({
      fetch: async () => undefined,
      remove: async (_workspaceSlug: string, _projectId: string, _issueId: string) => {
        try {
          await removeIssue(workspaceSlug, projectId, _issueId);
          setToast({
            title: t("common.success"),
            type: TOAST_TYPE.SUCCESS,
            message: t("entity.delete.success", { entity: t("inbox_issue.label") }),
          });
        } catch {
          setToast({
            title: t("common.error.label"),
            type: TOAST_TYPE.ERROR,
            message: t("entity.delete.failed", { entity: t("inbox_issue.label") }),
          });
        }
      },
      update: async (_workspaceSlug: string, _projectId: string, _issueId: string, data: Partial<TIssue>) => {
        try {
          await inboxIssue.updateIssue(data);
        } catch {
          setToast({
            title: t("common.error.label"),
            type: TOAST_TYPE.ERROR,
            message: t("entity.update.failed", { entity: t("inbox_issue.label") }),
          });
        }
      },
      archive: async (ws: string, pid: string, issueId: string) => {
        try {
          await archiveIssue(ws, pid, issueId);
        } catch (error) {
          console.error("Error in archiving issue:", error);
        }
      },
    }),
    [archiveIssue, inboxIssue, projectId, removeIssue, t, workspaceSlug]
  );

  if (!issue?.project_id || !issue?.id) return null;

  const isSupportHub = hubMode === EHubMode.SUPPORT;
  const isIntakeAccepted = inboxIssue.status === EInboxIssueStatus.ACCEPTED;

  return (
    <div className="space-y-5 pb-6">
      {isSupportHub ? (
        <>
          <SupportTicketMetadataPanel
            inboxIssue={inboxIssue}
            createdByLabel={createdByLabel}
            duplicateIssueDetails={inboxIssue.duplicate_issue_detail}
            projectId={projectId}
            workspaceSlug={workspaceSlug}
          />
          <SupportTicketMetricsPanel inboxIssue={inboxIssue} />
          <SupportTicketTriagePanel inboxIssue={inboxIssue} />
        </>
      ) : (
        <section className="space-y-4 px-4 pt-4">
          <h2 className="text-18 font-semibold text-primary">{issue.name}</h2>
          {issue.description_html ? (
            <div
              className="prose-sm max-w-none text-secondary prose"
              dangerouslySetInnerHTML={{ __html: issue.description_html }}
            />
          ) : null}
        </section>
      )}

      {!isSupportHub ? (
        <InboxIssueContentProperties
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issue={issue}
          issueOperations={issueOperations}
          isEditable={isEditable}
          duplicateIssueDetails={inboxIssue.duplicate_issue_detail}
          isIntakeAccepted={isIntakeAccepted}
        />
      ) : null}

      {isOpenTicket && duplicateIssues.length > 0 ? (
        <DeDupeIssuePopoverRoot
          workspaceSlug={workspaceSlug}
          projectId={issue.project_id}
          rootIssueId={issue.id}
          issues={duplicateIssues}
          issueOperations={issueOperations}
          isIntakeIssue
        />
      ) : null}

      <IssueAttachmentRoot
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issue.id}
        disabled={!isEditable}
      />

      {isSupportHub ? (
        <SupportTicketTrackingPanel
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issue.id}
          inboxIssue={inboxIssue}
          disabled={!isEditable}
          requesterLabel={createdByLabel}
        />
      ) : (
        <IssueActivity workspaceSlug={workspaceSlug} projectId={projectId} issueId={issue.id} isIntakeIssue />
      )}
    </div>
  );
});
