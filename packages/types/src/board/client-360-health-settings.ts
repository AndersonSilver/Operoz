export type IHealthScoreWeights = {
  report: number;
  overdue: number;
  support: number;
};

export type IHealthScoreThresholds = {
  ok_min: number;
  warning_min: number;
};

export type IBoardClient360HealthSettings = {
  id?: string;
  board?: string;
  workspace?: string;
  is_custom: boolean;
  weights: IHealthScoreWeights;
  thresholds: IHealthScoreThresholds;
  score_alert_threshold: number;
  status_report_reminder_enabled: boolean;
  status_report_reminder_email: boolean;
  support_sla_days: number;
  created_at?: string;
  updated_at?: string;
};

export type IBoardClient360HealthSettingsUpdate = {
  weights?: IHealthScoreWeights;
  thresholds?: IHealthScoreThresholds;
  score_alert_threshold?: number;
  status_report_reminder_enabled?: boolean;
  status_report_reminder_email?: boolean;
  support_sla_days?: number;
};

export type TClient360ReminderLog = {
  id: string;
  period_start: string;
  period_end: string;
  notified_count: number;
  skipped_count: number;
  details: Array<Record<string, unknown>>;
  created_at: string | null;
};
