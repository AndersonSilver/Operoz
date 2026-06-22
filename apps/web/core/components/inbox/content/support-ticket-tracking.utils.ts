import { EInboxIssueStatus } from "@operis/types";
import type { TSupportTicketSubmissionField } from "@operis/types";
import type { TIssueActivity } from "@operis/types";
import { renderFormattedDate } from "@operis/utils";

export type SupportTrackingEventKind =
  | "opened"
  | "accepted"
  | "closed"
  | "declined"
  | "snoozed"
  | "duplicate"
  | "reopened"
  | "comment"
  | "criticality_changed"
  | "sla_changed"
  | "ticket_number_changed";

export type SupportMilestoneState = "done" | "pending" | "active" | "cancelled";

export type SupportMilestoneId = "opened" | "accepted" | "resolved";

export type SupportMilestone = {
  id: SupportMilestoneId;
  state: SupportMilestoneState;
  at?: string;
  actorLabel?: string;
  detail?: string;
  durationSeconds?: number;
};

export type SupportTrackingEvent = {
  id: string;
  kind: SupportTrackingEventKind;
  at: string;
  titleKey: string;
  subtitleKey?: string;
  subtitleParams?: Record<string, string>;
  durationSeconds?: number;
  actorLabel?: string;
  fields?: TSupportTicketSubmissionField[];
  body?: string;
};

const VISIBLE_UPDATES_DEFAULT = 4;

export function formatTrackingDateTime(iso: string | undefined | null): string | undefined {
  if (!iso) return undefined;
  return renderFormattedDate(iso, "dd MMM yyyy · HH:mm");
}

export function formatTrackingDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${Math.max(totalSeconds, 1)}s`;
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  if (hours < 48) return remMin > 0 ? `${hours}h ${remMin}min` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return remHours > 0 ? `${days}d ${remHours}h` : `${days}d`;
}

function diffSeconds(fromIso: string, toIso: string): number {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.max(0, Math.floor((to - from) / 1000));
}

type BuildMilestonesParams = {
  status: EInboxIssueStatus;
  createdAt?: string | null;
  acceptedAt?: string | null;
  closedAt?: string | null;
  declinedAt?: string | null;
  queueName?: string | null;
  resolutionNote?: string | null;
  declineReason?: string | null;
  declineCategory?: string | null;
  openedByLabel?: string | null;
  acceptedByLabel?: string | null;
  closedByLabel?: string | null;
  declinedByLabel?: string | null;
};

export function buildSupportMilestones(params: BuildMilestonesParams): SupportMilestone[] {
  const openedAt = params.createdAt;
  if (!openedAt) return [];

  const isDeclined = params.status === EInboxIssueStatus.DECLINED;
  const isDuplicate = params.status === EInboxIssueStatus.DUPLICATE;
  const isClosed = params.status === EInboxIssueStatus.CLOSED;
  const isAccepted = params.status === EInboxIssueStatus.ACCEPTED;
  const isPending = params.status === EInboxIssueStatus.PENDING;
  const isSnoozed = params.status === EInboxIssueStatus.SNOOZED;

  const opened: SupportMilestone = {
    id: "opened",
    state: "done",
    at: openedAt,
    actorLabel: params.openedByLabel ?? undefined,
  };

  let acceptedState: SupportMilestoneState = "pending";
  if (params.acceptedAt || isAccepted || isClosed) acceptedState = "done";
  else if (isPending || isSnoozed) acceptedState = "active";
  else if (isDeclined || isDuplicate) acceptedState = "cancelled";

  const accepted: SupportMilestone = {
    id: "accepted",
    state: acceptedState,
    at: params.acceptedAt ?? undefined,
    actorLabel: params.acceptedByLabel ?? undefined,
    detail: params.queueName ?? undefined,
    durationSeconds: params.acceptedAt ? diffSeconds(openedAt, params.acceptedAt) : undefined,
  };

  let resolvedState: SupportMilestoneState = "pending";
  let resolvedAt: string | undefined;
  let resolvedActor: string | undefined;
  let resolvedDetail: string | undefined;

  if (isClosed && params.closedAt) {
    resolvedState = "done";
    resolvedAt = params.closedAt;
    resolvedActor = params.closedByLabel ?? undefined;
    resolvedDetail = params.resolutionNote ?? undefined;
  } else if (isDeclined) {
    resolvedState = "done";
    resolvedAt = params.declinedAt ?? params.closedAt ?? undefined;
    resolvedActor = params.declinedByLabel ?? undefined;
    resolvedDetail = params.declineReason ?? undefined;
  } else if (isDuplicate) {
    resolvedState = "done";
    resolvedAt = params.acceptedAt ?? openedAt;
    resolvedDetail = "duplicate";
  } else if (isAccepted) {
    resolvedState = "active";
  }

  const resolved: SupportMilestone = {
    id: "resolved",
    state: resolvedState,
    at: resolvedAt,
    actorLabel: resolvedActor,
    detail: resolvedDetail,
    durationSeconds:
      resolvedAt && params.acceptedAt
        ? diffSeconds(params.acceptedAt, resolvedAt)
        : resolvedAt
          ? diffSeconds(openedAt, resolvedAt)
          : undefined,
  };

  return [opened, accepted, resolved];
}

type BuildParams = {
  status: EInboxIssueStatus;
  createdAt?: string | null;
  acceptedAt?: string | null;
  closedAt?: string | null;
  declineReason?: string | null;
  declineCategory?: string | null;
  snoozeReason?: string | null;
  resolutionNote?: string | null;
  queueName?: string | null;
  submissionFields?: TSupportTicketSubmissionField[];
  requesterLabel?: string | null;
  reopenedAt?: string | null;
  declinedAt?: string | null;
};

export function buildSupportTrackingEvents(params: BuildParams): SupportTrackingEvent[] {
  const events: SupportTrackingEvent[] = [];
  const openedAt = params.createdAt;
  if (!openedAt) return events;

  if (params.status === EInboxIssueStatus.SNOOZED && params.snoozeReason) {
    events.push({
      id: "snoozed",
      kind: "snoozed",
      at: openedAt,
      titleKey: "inbox_issue.support_tracking.snoozed_title",
      body: params.snoozeReason,
    });
  }

  if (params.reopenedAt) {
    events.push({
      id: "reopened",
      kind: "reopened",
      at: params.reopenedAt,
      titleKey: "inbox_issue.support_tracking.reopened_title",
      subtitleKey: "inbox_issue.support_tracking.status_changed",
    });
  }

  return events.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

export function sliceTrackingEvents(
  events: SupportTrackingEvent[],
  expanded: boolean,
  visibleCount = VISIBLE_UPDATES_DEFAULT
): { visible: SupportTrackingEvent[]; hiddenCount: number } {
  if (expanded || events.length <= visibleCount) {
    return { visible: events, hiddenCount: 0 };
  }
  const hiddenCount = events.length - visibleCount;
  return { visible: events.slice(hiddenCount), hiddenCount };
}

const TRACKED_ACTIVITY_FIELDS: Record<string, SupportTrackingEventKind> = {
  support_criticality: "criticality_changed",
  criticality: "criticality_changed",
  support_sla_due_at: "sla_changed",
  sla_due_at: "sla_changed",
  support_ticket_number: "ticket_number_changed",
  ticket_number: "ticket_number_changed",
};

const TRACKED_TITLES: Record<SupportTrackingEventKind, string> = {
  opened: "inbox_issue.support_tracking.opened_title",
  accepted: "inbox_issue.support_tracking.accepted_title",
  closed: "inbox_issue.support_tracking.closed_title",
  declined: "inbox_issue.support_tracking.declined_title",
  snoozed: "inbox_issue.support_tracking.snoozed_title",
  duplicate: "inbox_issue.support_tracking.duplicate_title",
  reopened: "inbox_issue.support_tracking.reopened_title",
  comment: "inbox_issue.support_tracking.comment_title",
  criticality_changed: "inbox_issue.support_tracking.criticality_changed",
  sla_changed: "inbox_issue.support_tracking.sla_changed",
  ticket_number_changed: "inbox_issue.support_tracking.ticket_number_changed",
};

export function buildSupportFieldTrackingEvent(activity: TIssueActivity): SupportTrackingEvent | null {
  const field = (activity.field ?? "").trim();
  const kind = TRACKED_ACTIVITY_FIELDS[field];
  if (!kind) return null;

  const oldValue = (activity.old_value ?? "").trim();
  const newValue = (activity.new_value ?? "").trim();
  const subtitleParams =
    oldValue || newValue
      ? {
          from: oldValue || "—",
          to: newValue || "—",
        }
      : undefined;

  return {
    id: `activity-${activity.id}`,
    kind,
    at: activity.created_at,
    titleKey: TRACKED_TITLES[kind],
    subtitleKey: subtitleParams ? "inbox_issue.support_tracking.field_changed" : undefined,
    subtitleParams,
    actorLabel: activity.actor_detail?.display_name ?? undefined,
  };
}
