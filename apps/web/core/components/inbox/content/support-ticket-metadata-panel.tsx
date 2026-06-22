import { observer } from "mobx-react";
import { Clock, ExternalLink, Mail, UserRound } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslation } from "@operis/i18n";
import { Tooltip } from "@operis/propel/tooltip";
import type { TInboxDuplicateIssueDetails } from "@operis/types";
import { cn, renderFormattedDate, generateWorkItemLink } from "@operis/utils";
import { ControlLink } from "@operis/ui";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import type { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";
import { formatClientProjectLabel, getSupportTicketThemeClass } from "@/utils/support-ticket";

type Props = {
  inboxIssue: IInboxIssueStore;
  createdByLabel?: string;
  duplicateIssueDetails?: TInboxDuplicateIssueDetails;
  projectId: string;
  workspaceSlug: string;
};

export const SupportTicketMetadataPanel = observer(function SupportTicketMetadataPanel({
  inboxIssue,
  createdByLabel,
  duplicateIssueDetails,
  projectId,
  workspaceSlug,
}: Props) {
  const { t } = useTranslation();
  const params = useParams();
  const router = useAppRouter();
  const { getProjectById, currentProjectDetails } = useProject();
  const meta = inboxIssue.support_ticket;
  const issue = inboxIssue.issue;
  const project = issue.project_id ? getProjectById(issue.project_id) : undefined;

  const resolvedWorkspaceSlug = workspaceSlug || params.workspaceSlug?.toString() || "";
  const boardSlug = project?.board?.slug;
  const client360Href =
    resolvedWorkspaceSlug && boardSlug && project?.id
      ? `/${resolvedWorkspaceSlug}/boards/${boardSlug}/client-360?project=${project.id}`
      : null;

  const contactEmail = meta?.source_email;
  const theme = meta?.form_theme ?? "support";

  const duplicateWorkItemLink = duplicateIssueDetails
    ? generateWorkItemLink({
        workspaceSlug: resolvedWorkspaceSlug,
        projectId,
        issueId: duplicateIssueDetails.id,
        projectIdentifier: currentProjectDetails?.identifier ?? project?.identifier,
        sequenceId: duplicateIssueDetails.sequence_id,
      })
    : null;

  return (
    <section className={cn("rounded-lg border p-4", getSupportTicketThemeClass(theme))}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <p className="text-11 font-semibold tracking-wide uppercase opacity-80">
          {t("inbox_issue.support_ticket.panel_title")}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-11">
          {meta?.queue_age_label ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-subtle/60 bg-layer-1/70 px-2 py-0.5">
              <Clock className="size-3" />
              {t("inbox_issue.support_ticket.queue_age", { value: meta.queue_age_label })}
            </span>
          ) : null}
          {meta?.sla_breached ? (
            <span className="rounded-md border border-danger-subtle bg-danger-subtle px-2 py-0.5 font-medium text-danger-primary">
              {t("inbox_issue.support_ticket.sla_breached")}
            </span>
          ) : null}
        </div>
      </div>

      <dl className="grid gap-3 text-13 sm:grid-cols-2">
        {meta?.client_project_name ? (
          <div>
            <dt className="text-11 text-tertiary">{t("inbox_issue.support_ticket.client")}</dt>
            <dd className="font-medium">
              {formatClientProjectLabel(meta.client_project_identifier, meta.client_project_name)}
            </dd>
          </div>
        ) : null}
        {createdByLabel ? (
          <div>
            <dt className="text-11 text-tertiary">{t("inbox_issue.support_ticket.requester")}</dt>
            <dd className="inline-flex items-center gap-1 font-medium">
              <UserRound className="size-3.5" />
              {createdByLabel}
            </dd>
          </div>
        ) : null}
        {contactEmail ? (
          <div>
            <dt className="text-11 text-tertiary">{t("inbox_issue.support_ticket.contact_email")}</dt>
            <dd className="inline-flex items-center gap-1 font-medium">
              <Mail className="size-3.5" />
              {contactEmail}
            </dd>
          </div>
        ) : null}
        {issue.created_at ? (
          <div>
            <dt className="text-11 text-tertiary">{t("inbox_issue.support_ticket.opened_at")}</dt>
            <dd className="font-medium">{renderFormattedDate(issue.created_at)}</dd>
          </div>
        ) : null}
        {meta?.queue?.name ? (
          <div>
            <dt className="text-11 text-tertiary">{t("inbox_issue.support_ticket.queue")}</dt>
            <dd className="inline-flex items-center gap-1.5 font-medium">
              <span className="size-2.5 rounded-full" style={{ backgroundColor: meta.queue.color }} />
              {meta.queue.name}
            </dd>
          </div>
        ) : null}
        {meta?.accepted_at ? (
          <div>
            <dt className="text-11 text-tertiary">{t("inbox_issue.support_ticket.accepted_at")}</dt>
            <dd className="font-medium">{renderFormattedDate(meta.accepted_at)}</dd>
          </div>
        ) : null}
        {meta?.closed_at ? (
          <div>
            <dt className="text-11 text-tertiary">{t("inbox_issue.support_ticket.closed_at")}</dt>
            <dd className="font-medium">{renderFormattedDate(meta.closed_at)}</dd>
          </div>
        ) : null}
        {meta?.resolution_note ? (
          <div className="sm:col-span-2">
            <dt className="text-11 text-tertiary">{t("inbox_issue.support_ticket.resolution_note")}</dt>
            <dd>{meta.resolution_note}</dd>
          </div>
        ) : null}
        {meta?.decline_reason ? (
          <div className="sm:col-span-2">
            <dt className="text-11 text-tertiary">{t("inbox_issue.support_ticket.decline_reason")}</dt>
            <dd>
              {meta.decline_category ? t(`inbox_issue.decline_categories.${meta.decline_category}`) : null}
              {meta.decline_category ? " — " : ""}
              {meta.decline_reason}
            </dd>
          </div>
        ) : null}
      </dl>

      {duplicateIssueDetails && duplicateWorkItemLink ? (
        <div className="mt-4 border-t border-subtle/60 pt-3">
          <p className="mb-2 text-11 text-tertiary">{t("issue.relation.duplicate")}</p>
          <ControlLink href={duplicateWorkItemLink} onClick={() => router.push(duplicateWorkItemLink)} target="_self">
            <Tooltip tooltipContent={duplicateIssueDetails.name}>
              <span className="inline-flex cursor-pointer items-center gap-1 rounded-sm bg-layer-2 px-2 py-1 text-11 font-medium text-secondary">
                {`${currentProjectDetails?.identifier ?? project?.identifier}-${duplicateIssueDetails.sequence_id}`}
              </span>
            </Tooltip>
          </ControlLink>
        </div>
      ) : null}

      {client360Href ? (
        <a
          href={client360Href}
          className="mt-4 inline-flex items-center gap-1 text-12 font-medium text-accent-primary hover:underline"
        >
          {t("inbox_issue.support_ticket.open_client_360")}
          <ExternalLink className="size-3.5" />
        </a>
      ) : null}
    </section>
  );
});
