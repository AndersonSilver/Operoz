// plane types
import type { TPaginationInfo } from "./common";
import type { TIssuePriorities } from "./issues";
import type { TIssue } from "./issues/issue";
import type { TSupportCriticality } from "./intake/intake-form";

export enum EInboxIssueCurrentTab {
  OPEN = "open",
  IN_PROGRESS = "in_progress",
  CLOSED = "closed",
}

export enum EHubMode {
  INTAKE = "intake",
  SUPPORT = "support",
}

export type THubMode = EHubMode;

export type TInboxIssueCurrentTab = EInboxIssueCurrentTab;

export enum EInboxIssueStatus {
  PENDING = -2,
  DECLINED = -1,
  SNOOZED = 0,
  ACCEPTED = 1,
  DUPLICATE = 2,
  CLOSED = 3,
}

export enum EInboxIssueSource {
  IN_APP = "IN_APP",
  FORMS = "FORMS",
  PUBLIC_FORM = "PUBLIC_FORM",
  EMAIL = "EMAIL",
}

export type TInboxIssueStatus = EInboxIssueStatus;
export type TSupportTicketSubmissionField = {
  label: string;
  value: string;
};

export type TSupportTicketQueue = {
  id: string;
  name: string;
  slug: string;
  color: string;
};

export type TSupportTicketMetadata = {
  form_name?: string | null;
  form_theme?: string | null;
  source_email?: string | null;
  submission_fields?: TSupportTicketSubmissionField[];
  queue_age_label?: string;
  queue?: TSupportTicketQueue | null;
  accepted_at?: string | null;
  closed_at?: string | null;
  declined_at?: string | null;
  resolution_note?: string | null;
  decline_reason?: string | null;
  decline_category?: string | null;
  snooze_reason?: string | null;
  client_project_name?: string | null;
  client_project_identifier?: string | null;
  sla_days?: number;
  sla_breached?: boolean;
  sla_due_at?: string | null;
  sla_due_at_overridden?: boolean;
  criticality?: TSupportCriticality | null;
  criticality_label?: string | null;
  problem_started_at?: string | null;
  ticket_number?: string | null;
  metrics?: {
    time_to_accept_seconds?: number | null;
    time_to_resolve_seconds?: number | null;
    time_in_progress_seconds?: number | null;
  };
  opened_by_label?: string | null;
  accepted_by_label?: string | null;
  closed_by_label?: string | null;
  declined_by_label?: string | null;
  reopened_by_label?: string | null;
};

export type TInboxIssueSupportUpdatePayload = {
  support_criticality?: TSupportCriticality | "";
  support_sla_due_at?: string | "";
  reset_sla_from_criticality?: boolean;
  support_ticket_number?: string;
};

export type TInboxIssueDeclineCategory = "out_of_scope" | "duplicate" | "insufficient_info" | "spam" | "other";

export type TInboxIssue = {
  id: string;
  status: TInboxIssueStatus;
  ticket_kind?: THubMode;
  snoozed_till: Date | null;
  duplicate_to: string | undefined;
  source: EInboxIssueSource | undefined;
  source_email?: string | null;
  extra?: Record<string, unknown>;
  support_ticket?: TSupportTicketMetadata;
  issue: TIssue;
  created_by: string;
  duplicate_issue_detail: TInboxDuplicateIssueDetails | undefined;
  decline_reason?: string;
  decline_category?: TInboxIssueDeclineCategory;
  snooze_reason?: string;
  reopen?: boolean;
  delete_reason?: string;
  queue_id?: string;
  resolution_note?: string;
  support_criticality?: TSupportCriticality | "";
  support_sla_due_at?: string | "";
  reset_sla_from_criticality?: boolean;
  support_ticket_number?: string;
};

// filters
export type TInboxIssueFilterMemberKeys = "assignees" | "created_by";

export type TInboxIssueFilterDateKeys = "created_at" | "updated_at";

export type TInboxIssueFilterSupportKeys = "source" | "sla_breached" | "has_attachment" | "queue_id";

export type TInboxIssueFilter = {
  [key in TInboxIssueFilterMemberKeys]: string[] | undefined;
} & {
  [key in TInboxIssueFilterDateKeys]: string[] | undefined;
} & {
  [key in TInboxIssueFilterSupportKeys]: string[] | undefined;
} & {
  state: string[] | undefined;
  status: TInboxIssueStatus[] | undefined;
  priority: TIssuePriorities[] | undefined;
  labels: string[] | undefined;
};

// sorting filters
export type TInboxIssueSortingKeys = "order_by" | "sort_by";

export type TInboxIssueSortingOrderByKeys = "issue__created_at" | "issue__updated_at" | "issue__sequence_id";

export type TInboxIssueSortingSortByKeys = "asc" | "desc";

export type TInboxIssueSorting = {
  order_by: TInboxIssueSortingOrderByKeys | undefined;
  sort_by: TInboxIssueSortingSortByKeys | undefined;
};

// filtering and sorting types for query params
export type TInboxIssueSortingOrderByQueryParamKeys =
  | "issue__created_at"
  | "-issue__created_at"
  | "issue__updated_at"
  | "-issue__updated_at"
  | "issue__sequence_id"
  | "-issue__sequence_id";

export type TInboxIssueSortingOrderByQueryParam = {
  order_by: TInboxIssueSortingOrderByQueryParamKeys;
};

export type TInboxIssuesQueryParams = {
  [key in keyof TInboxIssueFilter]: string;
} & TInboxIssueSortingOrderByQueryParam & {
    per_page: number;
    cursor: string;
    sla_breached?: string;
    has_attachment?: string;
    queue_id?: string;
  };

// inbox issue types

export type TInboxDuplicateIssueDetails = {
  id: string;
  sequence_id: string;
  name: string;
};

export type TInboxIssuePaginationInfo = TPaginationInfo & {
  total_results: number;
};

export type TInboxIssueWithPagination = TInboxIssuePaginationInfo & {
  results: TInboxIssue[];
};

export type TAnchors = { [key: string]: string };

export type TInboxForm = {
  anchors: TAnchors;
  id: string;
  is_in_app_enabled: boolean;
  is_form_enabled: boolean;
};

export type TInboxIssueForm = {
  name: string;
  description: string;
  username: string;
  email: string;
};
