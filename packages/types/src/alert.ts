export type TEmailFrequency = "immediate" | "digest_daily" | "digest_weekly";

export type TAlertChannelConfig = {
  enabled?: boolean;
  frequency?: TEmailFrequency;
  auto_create_events?: boolean;
};

export type TAlertChannelPreferences = Partial<Record<TAlertChannel, TAlertChannelConfig>>;

export type TAlertRuleConfig = {
  thresholds_days?: number[];
  grace_period_days?: number;
  thresholds_minutes?: number[];
  notify_assignees?: boolean;
  notify_creator?: boolean;
  notify_project_lead?: boolean;
  notify_support_team?: boolean;
};

export type TAlertType =
  | "issue_created"
  | "due_date_approaching"
  | "due_date_overdue"
  | "missing_due_date"
  | "state_change"
  | "assignee_change"
  | "intake_created"
  | "support_ticket_created"
  | "support_ticket_accepted"
  | "support_sla_approaching"
  | "support_sla_breached"
  | "support_ticket_closed"
  | "support_no_team_response"
  | "issue_no_activity"
  | "in_progress_too_long";

export type TAlertChannel = "email" | "discord_dm" | "google_calendar" | "in_app";

export type TEscalationStep = {
  days_before: number;
  channels: TAlertChannel[];
};

export type TAlertRule = {
  id: string;
  workspace: string;
  project: string | null;
  alert_type: TAlertType;
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
  channels: TAlertChannel[];
  escalation_schedule: TEscalationStep[];
  created_at: string;
  updated_at: string;
};

export type TUserExternalAccount = {
  id: string;
  provider: "discord" | "google_calendar";
  external_id: string;
  is_active: boolean;
  last_synced_at: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
};

export type TAlertPreferenceItem = {
  alert_type: TAlertType;
  channel_type: TAlertChannel;
  enabled: boolean;
};

export type TUserAlertPreferences = {
  preferences: TAlertPreferenceItem[];
  channels?: TAlertChannelPreferences;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  quiet_hours_timezone: string;
};

export type TGoogleCalendarOAuthStart = {
  redirect_url: string;
};

export type TDiscordOAuthStart = {
  redirect_url: string;
};

export type TAlertLogStatus = "sent" | "failed" | "throttled" | "skipped";

export type TAlertLog = {
  id: string;
  alert_type: TAlertType;
  channel: TAlertChannel;
  status: TAlertLogStatus;
  issue: {
    id: string;
    sequence_id: number;
    name: string;
    identifier: string;
  };
  receiver: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  sent_at: string | null;
  error: string;
  created_at: string;
};

export type TAlertLogFilters = {
  alert_type?: TAlertType;
  channel?: TAlertChannel;
  status?: TAlertLogStatus;
  cursor?: string;
};

export type TConnectAccountPayload = {
  provider: "discord" | "google_calendar";
  external_id: string;
};

export type TAlertRulesPayload = Partial<
  Pick<TAlertRule, "alert_type" | "name" | "enabled" | "project" | "config" | "channels" | "escalation_schedule">
>;

export type TAlertLogPaginated = {
  results: TAlertLog[];
  next_cursor?: string;
  prev_cursor?: string;
};
