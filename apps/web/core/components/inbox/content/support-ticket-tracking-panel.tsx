"use client";

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Check, ChevronDown, Circle, Clock, MessageSquare, Minus, UserRound } from "lucide-react";
import { E_SORT_ORDER } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { cn } from "@operis/utils";
import { CommentCreate } from "@/components/comments/comment-create";
import { useWorkItemCommentOperations } from "@/components/issues/issue-detail/issue-activity/helper";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useBoardIssueCapabilities } from "@/hooks/use-board-issue-capabilities";
import type { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";
import {
  buildSupportFieldTrackingEvent,
  buildSupportMilestones,
  buildSupportTrackingEvents,
  formatTrackingDateTime,
  formatTrackingDuration,
  sliceTrackingEvents,
  type SupportMilestone,
  type SupportMilestoneState,
  type SupportTrackingEvent,
} from "./support-ticket-tracking.utils";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  inboxIssue: IInboxIssueStore;
  disabled?: boolean;
  requesterLabel?: string;
};

const MILESTONE_LABEL: Record<SupportMilestone["id"], string> = {
  opened: "inbox_issue.support_tracking.milestone_opened",
  accepted: "inbox_issue.support_tracking.milestone_accepted",
  resolved: "inbox_issue.support_tracking.milestone_resolved",
};

const STATE_LABEL: Record<SupportMilestoneState, string> = {
  done: "inbox_issue.support_tracking.state_done",
  pending: "inbox_issue.support_tracking.state_pending",
  active: "inbox_issue.support_tracking.state_active",
  cancelled: "inbox_issue.support_tracking.state_cancelled",
};

function MilestoneIcon({ state }: { state: SupportMilestoneState }) {
  if (state === "done") {
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-success-subtle text-success-primary ring-2 ring-success-subtle">
        <Check className="size-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  if (state === "active") {
    return (
      <span className="ring-accent-primary/30 flex size-7 items-center justify-center rounded-full bg-accent-primary/15 text-accent-primary ring-2">
        <Clock className="size-3.5" strokeWidth={2} />
      </span>
    );
  }
  if (state === "cancelled") {
    return (
      <span className="flex size-7 items-center justify-center rounded-full bg-layer-2 text-tertiary ring-2 ring-subtle">
        <Minus className="size-3.5" strokeWidth={2} />
      </span>
    );
  }
  return (
    <span className="flex size-7 items-center justify-center rounded-full border-2 border-dashed border-subtle bg-layer-1 text-tertiary">
      <Circle className="size-2.5 fill-current" />
    </span>
  );
}

function MilestoneRow({ milestone, isLast, status }: { milestone: SupportMilestone; isLast: boolean; status: number }) {
  const { t } = useTranslation();
  const dateLabel = formatTrackingDateTime(milestone.at);
  const durationLabel =
    milestone.durationSeconds != null && milestone.durationSeconds > 0
      ? formatTrackingDuration(milestone.durationSeconds)
      : null;

  const resolvedTitle =
    milestone.id === "resolved" && milestone.detail === "duplicate"
      ? t("inbox_issue.support_tracking.duplicate_title")
      : milestone.id === "resolved" && status === -1
        ? t("inbox_issue.support_tracking.declined_title")
        : t(MILESTONE_LABEL[milestone.id]);

  const actorKey =
    milestone.id === "opened"
      ? "inbox_issue.support_tracking.actor_opened"
      : milestone.id === "accepted"
        ? "inbox_issue.support_tracking.actor_accepted"
        : milestone.id === "resolved" && status === -1
          ? "inbox_issue.support_tracking.actor_declined"
          : "inbox_issue.support_tracking.actor_closed";

  return (
    <li className="relative flex gap-3 pb-0">
      {!isLast ? (
        <span
          className={cn(
            "absolute top-7 bottom-0 left-[13px] w-0.5",
            milestone.state === "done" ? "bg-success-subtle" : "bg-subtle"
          )}
          aria-hidden
        />
      ) : null}
      <div className="relative z-[1] shrink-0 pt-0.5">
        <MilestoneIcon state={milestone.state} />
      </div>
      <div className={cn("min-w-0 flex-1", !isLast && "pb-6")}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-13 font-semibold text-primary">{resolvedTitle}</p>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-10 font-semibold tracking-wide uppercase",
              milestone.state === "done" && "bg-success-subtle text-success-primary",
              milestone.state === "active" && "bg-accent-primary/10 text-accent-primary",
              milestone.state === "pending" && "bg-layer-2 text-tertiary",
              milestone.state === "cancelled" && "bg-layer-2 text-tertiary"
            )}
          >
            {t(STATE_LABEL[milestone.state])}
          </span>
          {durationLabel && milestone.state === "done" ? (
            <span className="text-11 text-tertiary">· {durationLabel}</span>
          ) : null}
        </div>

        {milestone.actorLabel ? (
          <p className="mt-1 inline-flex items-center gap-1.5 text-12 text-secondary">
            <UserRound className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />
            {t(actorKey, { name: milestone.actorLabel })}
          </p>
        ) : milestone.state === "pending" ? (
          <p className="mt-1 text-12 text-tertiary">{t("inbox_issue.support_tracking.awaiting_step")}</p>
        ) : null}

        {dateLabel ? <p className="mt-0.5 text-11 text-tertiary tabular-nums">{dateLabel}</p> : null}

        {milestone.id === "accepted" && milestone.detail ? (
          <p className="mt-1.5 text-12 text-secondary">
            {t("inbox_issue.support_tracking.accepted_queue", { queue: milestone.detail })}
          </p>
        ) : null}

        {milestone.id === "resolved" && milestone.detail && milestone.detail !== "duplicate" ? (
          <p className="mt-1.5 line-clamp-3 rounded-md border border-subtle/70 bg-layer-2/40 px-2.5 py-2 text-12 text-secondary">
            {milestone.detail}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function UpdateRow({ event }: { event: SupportTrackingEvent }) {
  const { t } = useTranslation();
  const dateLabel = formatTrackingDateTime(event.at);

  return (
    <li className="flex gap-2.5 border-t border-subtle/60 py-2.5 first:border-t-0 first:pt-0">
      <div className="bg-tertiary mt-0.5 size-1.5 shrink-0 rounded-full" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="text-12 font-medium text-primary">{t(event.titleKey)}</p>
          {dateLabel ? <time className="text-11 text-tertiary tabular-nums">{dateLabel}</time> : null}
        </div>
        {event.actorLabel ? (
          <p className="mt-0.5 text-11 text-tertiary">
            {t("inbox_issue.support_tracking.actor_updated", { name: event.actorLabel })}
          </p>
        ) : null}
        {event.subtitleKey ? (
          <p className="mt-0.5 text-12 text-secondary">{t(event.subtitleKey, event.subtitleParams ?? {})}</p>
        ) : null}
        {event.body ? <p className="mt-1 line-clamp-2 text-12 text-secondary">{event.body}</p> : null}
      </div>
    </li>
  );
}

export const SupportTicketTrackingPanel = observer(function SupportTicketTrackingPanel(props: Props) {
  const { workspaceSlug, projectId, issueId, inboxIssue, disabled = false, requesterLabel } = props;
  const { t } = useTranslation();
  const [expandedUpdates, setExpandedUpdates] = useState(false);
  const [showSubmission, setShowSubmission] = useState(false);
  const meta = inboxIssue.support_ticket;
  const issue = inboxIssue.issue;

  const activityOperations = useWorkItemCommentOperations(workspaceSlug, projectId, issueId);
  const { getProjectById } = useProject();
  const project = getProjectById(projectId);
  const { canCommentAdd } = useBoardIssueCapabilities(projectId, { readOnly: disabled });

  const {
    comment: { getCommentById },
    activity: { getActivityAndCommentsByIssueId, getActivityById },
  } = useIssueDetail();

  const milestones = useMemo(
    () =>
      buildSupportMilestones({
        status: inboxIssue.status,
        createdAt: issue?.created_at,
        acceptedAt: meta?.accepted_at,
        closedAt: meta?.closed_at,
        declinedAt: meta?.declined_at ?? undefined,
        queueName: meta?.queue?.name,
        resolutionNote: meta?.resolution_note,
        declineReason: meta?.decline_reason,
        declineCategory: meta?.decline_category,
        openedByLabel: meta?.opened_by_label ?? requesterLabel,
        acceptedByLabel: meta?.accepted_by_label,
        closedByLabel: meta?.closed_by_label,
        declinedByLabel: meta?.declined_by_label,
      }),
    [inboxIssue.status, issue?.created_at, meta, requesterLabel]
  );

  const auxiliaryEvents = useMemo(
    () =>
      buildSupportTrackingEvents({
        status: inboxIssue.status,
        createdAt: issue?.created_at,
        acceptedAt: meta?.accepted_at,
        closedAt: meta?.closed_at,
        snoozeReason: meta?.snooze_reason,
        reopenedAt: undefined,
      }),
    [inboxIssue.status, issue?.created_at, meta]
  );

  const commentEvents = useMemo(() => {
    const items = getActivityAndCommentsByIssueId(issueId, E_SORT_ORDER.ASC) ?? [];
    return items
      .map((item) => {
        if (item.activity_type !== "COMMENT") {
          const activity = getActivityById(item.id);
          if (!activity) return null;
          return buildSupportFieldTrackingEvent(activity);
        }
        const comment = getCommentById(item.id);
        if (!comment?.created_at) return null;
        return {
          id: `comment-${item.id}`,
          kind: "comment" as const,
          at: comment.created_at,
          titleKey: "inbox_issue.support_tracking.comment_title",
          body: comment.comment_stripped ?? undefined,
          actorLabel: comment.actor_detail?.display_name ?? undefined,
        };
      })
      .filter((event): event is SupportTrackingEvent => event != null);
  }, [getActivityAndCommentsByIssueId, getActivityById, getCommentById, issueId]);

  const updates = useMemo(
    () => [...auxiliaryEvents, ...commentEvents].sort((a, b) => Date.parse(a.at) - Date.parse(b.at)),
    [auxiliaryEvents, commentEvents]
  );

  const { visible: visibleUpdates, hiddenCount } = sliceTrackingEvents(updates, expandedUpdates);
  const submissionFields = meta?.submission_fields ?? [];

  if (!project) return null;

  return (
    <section className="space-y-4 px-4">
      <h3 className="text-h5-medium text-primary">{t("inbox_issue.support_tracking.title")}</h3>

      {milestones.length > 0 ? (
        <ol className="list-none rounded-xl border border-subtle bg-layer-1/50 p-4">
          {milestones.map((milestone, index) => (
            <MilestoneRow
              key={milestone.id}
              milestone={milestone}
              isLast={index === milestones.length - 1}
              status={inboxIssue.status}
            />
          ))}
        </ol>
      ) : (
        <p className="text-13 text-tertiary">{t("inbox_issue.support_tracking.empty")}</p>
      )}

      {submissionFields.length > 0 ? (
        <div className="rounded-xl border border-subtle bg-layer-1/30">
          <button
            type="button"
            onClick={() => setShowSubmission((current) => !current)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
          >
            <span className="text-12 font-medium text-secondary">
              {t("inbox_issue.support_tracking.view_submission")}
            </span>
            <ChevronDown className={cn("size-4 text-tertiary transition-transform", showSubmission && "rotate-180")} />
          </button>
          {showSubmission ? (
            <dl className="space-y-2 border-t border-subtle px-3 py-2.5">
              {submissionFields.map((field) => (
                <div key={`${field.label}-${field.value}`} className="grid gap-0.5 sm:grid-cols-[minmax(0,34%)_1fr]">
                  <dt className="text-11 text-tertiary">{field.label}</dt>
                  <dd className="text-12 font-medium text-primary">{field.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
      ) : null}

      {updates.length > 0 ? (
        <div>
          <p className="mb-2 text-11 font-semibold tracking-wide text-tertiary uppercase">
            {t("inbox_issue.support_tracking.updates_section")}
          </p>
          <ul className="rounded-xl border border-subtle bg-layer-1/30 px-3 py-1">
            {visibleUpdates.map((event) => (
              <UpdateRow key={event.id} event={event} />
            ))}
          </ul>
          {hiddenCount > 0 ? (
            <button
              type="button"
              onClick={() => setExpandedUpdates(true)}
              className="mt-2 inline-flex items-center gap-1 text-12 font-medium text-accent-primary hover:underline"
            >
              <ChevronDown className="size-3.5" />
              {t("inbox_issue.support_tracking.show_more", { count: hiddenCount })}
            </button>
          ) : null}
          {expandedUpdates && updates.length > 4 ? (
            <button
              type="button"
              onClick={() => setExpandedUpdates(false)}
              className="mt-2 text-12 font-medium text-tertiary hover:text-secondary"
            >
              {t("inbox_issue.support_tracking.show_less")}
            </button>
          ) : null}
        </div>
      ) : null}

      {canCommentAdd ? (
        <div className="rounded-xl border border-subtle bg-layer-1/50 p-3">
          <div className="mb-2 flex items-center gap-2">
            <MessageSquare className="size-4 text-secondary" strokeWidth={1.75} />
            <p className="text-13 font-medium text-primary">{t("inbox_issue.support_tracking.new_comment")}</p>
          </div>
          <CommentCreate
            workspaceSlug={workspaceSlug}
            entityId={issueId}
            activityOperations={activityOperations}
            showToolbarInitially
            projectId={projectId}
          />
        </div>
      ) : null}
    </section>
  );
});
