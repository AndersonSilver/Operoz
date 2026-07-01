import type { TLogoProps } from "../common";

export type TClient360Health = "ok" | "warning" | "critical";

export type TClient360ReportCoverage = "complete" | "partial" | "missing" | "n_a";

export type TClient360Board = {
  id: string;
  slug: string;
  name: string;
};

export type TClient360ProjectLead = {
  id: string;
  display_name: string;
};

export type TClient360HealthDimension = "report" | "overdue" | "support";

export type TClient360HealthBreakdownItem = {
  dimension: TClient360HealthDimension;
  score: number;
  weight: number;
  detail: string;
};

export type TClient360HealthDimensionItem = {
  dimension: TClient360HealthDimension;
  score: number;
  health: TClient360Health;
};

export type TClient360SupportMetricBucket = {
  count: number;
  median_tta_seconds: number | null;
  median_ttr_seconds: number | null;
  median_in_progress_seconds: number | null;
};

export type TClient360SupportAnalyticsCriticality = import("../intake/intake-form").TSupportCriticality | "unknown";

export type TClient360SupportAnalytics = {
  by_criticality: Record<TClient360SupportAnalyticsCriticality, TClient360SupportMetricBucket>;
  by_client: Record<string, Record<TClient360SupportAnalyticsCriticality, TClient360SupportMetricBucket>>;
};

export type TClient360Client = {
  project_id: string;
  name: string;
  identifier: string;
  logo_props: TLogoProps;
  /** Stakeholder do cliente (contacto no lado do cliente). */
  responsible_stakeholder: string;
  /** Responsável Operoz (líder do projeto). */
  project_lead: TClient360ProjectLead | null;
  issues: {
    total: number;
    pending: number;
    overdue: number;
  };
  support: {
    open_count: number;
    overdue_count: number;
  };
  status_report: {
    period_start: string;
    period_end: string;
    coverage: TClient360ReportCoverage;
    modules_total: number;
    modules_published: number;
    modules_draft: number;
    latest_report_id: string | null;
    latest_published_at: string | null;
  };
  health: TClient360Health;
  /** Semáforo MVP original (deprecado — ver ADR health score transition). */
  legacy_health: TClient360Health;
  /** Score numérico 0–100 (Health Engine Fase 1). */
  health_score: number;
  health_breakdown: TClient360HealthBreakdownItem[];
  /** RAG por dimensão (report, overdue, support). */
  health_dimensions: TClient360HealthDimensionItem[];
  /** Score abaixo do limiar configurável (Command Center alertas). */
  health_score_alert: boolean;
  score_alert_threshold: number;
  intake?: TClient360OperationalIntake;
  blockers?: { count: number };
  delivery?: { throughput: number; cycle_time_days_median: number | null };
  support_sla?: { breached: boolean; breach_count: number };
  finops?: TClient360FinopsListFields;
  /** Present when listing across boards (workspace Visão 360). */
  board?: TClient360Board;
  /** Delta vs semana anterior (compare=1). */
  period_compare?: TClient360PeriodCompareClient;
};

export type TClient360Summary = {
  total_clients: number;
  health_critical: number;
  health_warning: number;
  report_missing: number;
  total_overdue: number;
  total_support_open: number;
  health_score_alert: number;
  intake_pending?: number;
  blockers_total?: number;
  support_sla_breach?: number;
};

export type TClient360FinopsUtilization = {
  hours_allocated: number;
  capacity_hours: number;
  pct: number | null;
  over_allocated: boolean;
};

export type TClient360FinopsListFields = {
  utilization: TClient360FinopsUtilization | null;
  harness_cost_mtd: number | null;
  harness_last_sync_at?: string | null;
  budget_planned: number | null;
  budget_actual: number | null;
  budget_variance_pct: number | null;
  revenue_contract: number | null;
  margin_pct: number | null;
  finops_alert: boolean;
};

export type TClient360FinopsForecast = {
  weeks: number | null;
  status: "ok" | "empty" | "indeterminate";
  optimistic_weeks: number | null;
  pessimistic_weeks: number | null;
};

export type TClient360FinopsProfile = {
  project_id: string;
  period_month: string;
  hours_allocated: number;
  capacity_hours: number;
  harness_cost_mtd: number | null;
  harness_project_tag: string;
  harness_last_sync_at: string | null;
  budget_planned: number | null;
  budget_actual: number | null;
  revenue_contract: number | null;
};

export type TClient360FinopsProfileWrite = {
  hours_allocated?: number;
  capacity_hours?: number;
  harness_project_tag?: string;
  harness_cost_mtd?: number | null;
  budget_planned?: number | null;
  budget_actual?: number | null;
  revenue_contract?: number | null;
};

export type TClient360FinopsPayload = TClient360FinopsListFields & {
  harness_cost_breakdown: Array<{ pipeline_id: string; cost_usd: number; tags?: Record<string, unknown> }>;
  harness_project_tag: string;
  burn_rate: number;
  backlog_points: number;
  forecast: TClient360FinopsForecast;
  forward_capacity: {
    horizon_weeks: number;
    weekly_capacity_hours: number;
    backlog_points: number;
    burn_rate: number;
    weeks_to_clear: number | null;
    overload: boolean;
    capacity_points: number;
  };
  delivery_cost: number | null;
  throughput_week: number;
};

export type TClient360FinopsSummary = {
  total_cost_mtd: number | null;
  avg_margin_pct: number | null;
  finops_alerts: number;
  clients_with_cost: number;
  top_variance: Array<{
    project_id: string;
    name: string;
    identifier: string;
    variance_pct: number;
  }>;
  settings: {
    variance_alert_pct: number;
    margin_alert_pct: number;
    squad_weekly_capacity_hours: number;
    is_custom?: boolean;
  };
};

export type TClient360ConsultantHeatmap = {
  period_month: string;
  consultants: Array<{ id: string; display_name: string }>;
  projects: Array<{ id: string; name: string; identifier: string }>;
  cells: Record<string, Record<string, number>>;
};

export type TClient360OperationalIntake = {
  pending: number;
};

export type TClient360OperationalBlockers = {
  count: number;
  items?: Array<{
    id: string;
    name: string;
    sequence_id: number;
    blocked_by_name: string;
    aging_days: number;
    state__name?: string | null;
  }>;
};

export type TClient360OperationalDelivery = {
  throughput: number;
  cycle_time_days_median: number | null;
  history?: Array<{ period_start: string; period_end: string; throughput: number }>;
};

export type TClient360OperationalRaidItem = {
  id: string;
  name: string;
  sequence_id: number;
  priority: string;
  state__name?: string | null;
  age_days: number;
  category: string;
};

export type TClient360OperationalPayload = {
  intake: TClient360OperationalIntake;
  blockers: TClient360OperationalBlockers;
  delivery: TClient360OperationalDelivery;
  raid: {
    risk: TClient360OperationalRaidItem[];
    assumption: TClient360OperationalRaidItem[];
    issue: TClient360OperationalRaidItem[];
    dependency: TClient360OperationalRaidItem[];
  };
  milestones: Array<{
    id: string;
    kind: "module" | "issue";
    name: string;
    sequence_id?: number;
    target_date: string;
    status: "done" | "pending" | "overdue";
  }>;
  module_heatmap: Array<{
    module_id: string | null;
    module_name: string | null;
    cells: { report: string; overdue: number; intake: number };
  }>;
  support_sla: { breached: boolean; breach_count: number; sla_days: number };
};

export type TClient360IntakeType = {
  id: string;
  board_id: string;
  name: string;
  slug: string;
  type_name_pattern: string;
  is_active: boolean;
  sort_order: number;
};

export type TClient360SharedView = {
  id: string;
  name: string;
  payload: Record<string, unknown>;
  is_shared: boolean;
  created_by_name?: string | null;
};

export type TClient360SummaryDelta = {
  health_critical: number;
  health_warning: number;
  report_missing: number;
  total_overdue: number;
  total_support_open: number;
  health_score_alert: number;
};

export type TClient360PeriodCompareClient = {
  available: boolean;
  overdue_delta?: number;
  health_score_delta?: number;
  report_coverage_delta?: number;
  support_open_delta?: number;
  previous_report_coverage?: TClient360ReportCoverage;
};

export type TClient360PeriodCompare = {
  available: boolean;
  previous_period_start?: string;
  previous_period_end?: string;
  summary_delta?: TClient360SummaryDelta;
};

export type TClient360DisplayOptions = {
  health_score_enabled: boolean;
};

export type TClient360EnterpriseSettings = {
  phase_flags: Record<string, boolean>;
  list_grouping_mode: "project" | "customer";
  crm_enabled: boolean;
  crm_provider: string;
  crm_stale: boolean;
  crm_last_sync_at: string | null;
  retention_weeks: number;
  data_region: string;
  bi_export_enabled: boolean;
  guest_sso_enabled: boolean;
  guest_magic_link_fallback: boolean;
  is_custom: boolean;
};

export type TClient360CustomerGroup = {
  customer_id: string | null;
  customer_name: string;
  projects: TClient360Client[];
  rollup: {
    health_critical: number;
    health_warning: number;
    total_overdue: number;
    total_support_open: number;
  } | null;
};

export type TClient360ListResponse = {
  period_start: string;
  period_end: string;
  display: TClient360DisplayOptions;
  enterprise?: TClient360EnterpriseSettings;
  summary: TClient360Summary;
  finops_summary?: TClient360FinopsSummary;
  clients: TClient360Client[];
  customer_groups?: TClient360CustomerGroup[];
  period_compare?: TClient360PeriodCompare;
  support_analytics?: TClient360SupportAnalytics;
};

export type TClient360ModuleRow = {
  module_id: string | null;
  module_name: string | null;
  status: "published" | "draft" | "missing";
  report_id: string | null;
  published_at: string | null;
};

export type TClient360IssueSnippet = {
  id: string;
  name: string;
  sequence_id: number;
  target_date: string | null;
  priority: string;
  state__name?: string;
  state__group?: string;
  type__name?: string;
};

export type TClient360Narrative = {
  wins_md: string;
  risks_md: string;
  next_steps_md: string;
  updated_at: string | null;
};

export type TClient360DetailResponse = TClient360Client & {
  display?: TClient360DisplayOptions;
  narrative?: TClient360Narrative;
  operational?: TClient360OperationalPayload;
  finops?: TClient360FinopsPayload;
  modules: TClient360ModuleRow[];
  overdue_issues: TClient360IssueSnippet[];
  support_issues: TClient360IssueSnippet[];
};

export type TClient360HealthHistorySource = "snapshot" | "live";

export type TClient360HealthHistoryItem = {
  period_start: string;
  period_end: string;
  health_score: number;
  health: TClient360Health;
  source: TClient360HealthHistorySource;
};

export type TClient360HealthHistoryResponse = {
  schema_version: number;
  project_id: string;
  weeks_requested: number;
  source: "snapshots" | "snapshots_with_live";
  limitation: string | null;
  history: TClient360HealthHistoryItem[];
};

export type TClient360MatrixModuleBreakdownItem = {
  module_id: string;
  module_name: string;
  status: "published" | "draft" | "missing";
};

export type TClient360MatrixCell = {
  period_start: string;
  period_end: string;
  coverage: TClient360ReportCoverage;
  modules_total: number;
  modules_published: number;
  modules_draft: number;
  module_breakdown: TClient360MatrixModuleBreakdownItem[] | null;
};

export type TClient360MatrixClient = {
  project_id: string;
  name: string;
  identifier: string;
  board?: TClient360Board;
  cells: TClient360MatrixCell[];
};

export type TClient360MatrixResponse = {
  schema_version: number;
  weeks_requested: number;
  anchor_period_start: string;
  anchor_period_end: string;
  weeks: Array<{ period_start: string; period_end: string }>;
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
  clients: TClient360MatrixClient[];
};

export type TClient360WeeklyBriefing = {
  content_md: string;
  status: string;
  requires_review: boolean;
  generated_at: string | null;
  cached?: boolean;
};

export type TClient360SuggestedAction = {
  key: string;
  title: string;
  reason: string;
  priority: number;
  href: string | null;
  action_type: string;
};

export type TClient360ScenarioPlaybook = {
  scenario_key: string;
  playbook_code: string;
  title: string;
  markdown: string;
  version: number;
  locale: string;
};

export type TClient360SuggestedActionsResponse = {
  actions: TClient360SuggestedAction[];
  scenarios: string[];
  playbooks: TClient360ScenarioPlaybook[];
};

export type TClient360HealthExplainer = {
  tone: string;
  explanation_md: string;
  static_fallback_md: string;
  disclaimer: string;
};

export type TClient360QbrDraft = {
  quarter_key?: string;
  content_md: string;
  human_edited_md: string;
  effective_md?: string;
  status: string;
  generated_at: string | null;
};
