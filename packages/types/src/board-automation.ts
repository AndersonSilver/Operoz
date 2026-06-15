export type TAutomationCatalogItem = {
  key: string;
  label: string;
  description: string;
  icon: string;
  config_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
};

export type TAutomationCatalog = {
  triggers: TAutomationCatalogItem[];
  filters: TAutomationCatalogItem[];
  decisions: TAutomationCatalogItem[];
  parallel: TAutomationCatalogItem[];
  actions: TAutomationCatalogItem[];
};

export type TAutomationDecisionBranch = {
  id: string;
  label: string;
  filter_key: string;
  filter_config: Record<string, unknown>;
};

export type TAutomationGraphNode = {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: {
    kind: "trigger" | "filter" | "decision" | "parallel" | "action";
    catalog_key: string;
    label: string;
    icon?: string;
    config: Record<string, unknown>;
  };
};

export type TAutomationGraphEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

export type TAutomationGraph = {
  nodes: TAutomationGraphNode[];
  edges: TAutomationGraphEdge[];
};

export type TAutomationPublicationStatus = "draft_only" | "published" | "published_with_drafts";

export type IBoardAutomationRule = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  sort_order: number;
  graph: TAutomationGraph;
  graph_version: number;
  published_graph: TAutomationGraph;
  published_version: number;
  dry_run_verified_version: number;
  published_at: string | null;
  has_unpublished_changes: boolean;
  is_published: boolean;
  publication_status: TAutomationPublicationStatus;
  board: string;
  workspace: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type IBoardAutomationRuleRevision = {
  id: string;
  rule: string;
  kind: "draft" | "published";
  graph: TAutomationGraph;
  name: string;
  description: string;
  graph_version: number;
  created_at: string;
  created_by: string | null;
};

export type IBoardAutomationRun = {
  id: string;
  rule: string;
  rule_name: string;
  board: string;
  event_id: string;
  event_type: string;
  status: "pending" | "running" | "success" | "failed" | "skipped";
  dry_run: boolean;
  context_snapshot: Record<string, unknown>;
  step_logs: Record<string, unknown>[];
  error_message: string;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export type TAutomationValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type IBoardAutomationScript = {
  id: string;
  name: string;
  description: string;
  source_code: string;
  is_active: boolean;
  board: string;
  workspace: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type IBoardAutomationEmailTemplate = {
  id: string;
  name: string;
  description: string;
  subject: string;
  html_body: string;
  is_active: boolean;
  board: string;
  workspace: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type TAutomationDryRunResult = {
  matched: boolean;
  passed_filters?: boolean;
  steps: Record<string, unknown>[];
  dry_run?: boolean;
  live?: boolean;
  test_issue_id?: string;
  test_issue_name?: string;
  message?: string;
  error?: string;
};

export type TAutomationAnalyticsSummary = {
  total_runs: number;
  success_count: number;
  failed_count: number;
  skipped_count: number;
  success_rate: number | null;
  avg_duration_ms: number | null;
  p95_duration_ms: number | null;
  runs_last_24h: number;
};

export type TAutomationAnalyticsTimelinePoint = {
  date: string;
  success: number;
  failed: number;
  skipped: number;
  pending: number;
  running: number;
  total: number;
};

export type TAutomationAnalyticsRuleBreakdown = {
  rule_id: string;
  rule_name: string;
  total: number;
  success: number;
  failed: number;
  skipped: number;
};

export type TAutomationAnalyticsStatusBreakdown = {
  status: string;
  count: number;
};

export type TAutomationAnalyticsEventTypeBreakdown = {
  event_type: string;
  count: number;
};

export type TAutomationAnalyticsFailure = {
  id: string;
  rule_id: string;
  rule_name: string;
  event_type: string;
  error_message: string;
  created_at: string | null;
};

export type TAutomationAnalytics = {
  period_days: number;
  summary: TAutomationAnalyticsSummary;
  timeline: TAutomationAnalyticsTimelinePoint[];
  by_rule: TAutomationAnalyticsRuleBreakdown[];
  by_status: TAutomationAnalyticsStatusBreakdown[];
  by_event_type: TAutomationAnalyticsEventTypeBreakdown[];
  recent_failures: TAutomationAnalyticsFailure[];
};

export type TAutomationMetricsResponse = {
  metrics: Record<string, number>;
  queue: string;
  analytics?: TAutomationAnalytics;
};

export type IBoardAutomationDeadLetter = {
  id: string;
  rule_id: string | null;
  event_id: string;
  error_message: string;
  retry_count: number;
  celery_task_id: string;
  created_at: string;
};

export type IBoardAutomationSecret = {
  id: string;
  key: string;
  description: string;
  workspace: string;
  created_at: string;
  updated_at: string;
};

export type TAutomationHookEvent = "pre_dispatch" | "pre_action" | "post_action" | "on_failure" | "on_complete";

export type TAutomationHookHandler = "block_catalog_key" | "webhook_domain_allowlist" | "record_metric";

export type IBoardAutomationPolicy = {
  id: string;
  board: string;
  workspace: string;
  webhook_allowlist_enabled: boolean;
  webhook_allowed_domains: string[];
  script_timeout_seconds: number;
  script_max_memory_mb: number;
  script_block_dangerous_imports: boolean;
  require_dry_run_before_enable: boolean;
  created_at: string;
  updated_at: string;
};

export type IBoardAutomationPublishAudit = {
  id: string;
  rule: string;
  rule_name: string;
  board: string;
  workspace: string;
  published_version: number;
  graph_diff: Record<string, unknown>;
  published_by: string | null;
  published_by_name: string;
  published_at: string;
  created_at: string;
};

export type TAutomationTemplateParameter = {
  key: string;
  type: string;
  label: string;
  default?: unknown;
  required?: boolean;
};

export type TAutomationTemplatePreview = {
  node_count: number;
  trigger_key: string | null;
  action_keys: (string | null)[];
  filter_count: number;
};

export type TAutomationTemplate = {
  id: string;
  version: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  parameters: TAutomationTemplateParameter[];
  preview: TAutomationTemplatePreview;
};

export type TAutomationTemplateInstallResult = {
  rule: IBoardAutomationRule;
  template_id: string;
  dry_run?: TAutomationDryRunResult | { ok: boolean; code?: string; message?: string };
};

export type IBoardPlaybookMetadata = {
  intents?: string[];
  tags?: string[];
};

export type IBoardPlaybook = {
  id: string;
  title: string;
  slug: string;
  description: string;
  draft_markdown: string;
  published_markdown: string;
  published_version: number;
  published_at: string | null;
  is_active: boolean;
  metadata: IBoardPlaybookMetadata;
  sort_order: number;
  has_unpublished_changes: boolean;
  board: string;
  workspace: string;
  created_at: string;
  updated_at: string;
};

export type TAssistantAutomationProposal = {
  name?: string;
  description?: string;
  graph?: TAutomationGraph;
  board_slug?: string;
  validation?: { valid: boolean; errors?: string[]; warnings?: string[] };
  dry_run?: Record<string, unknown> & { ok?: boolean; status?: string };
};

export type TAssistantActionProposal = {
  action_type: "issue_comment" | "issue_state_change";
  issue_id?: string;
  comment?: string;
  state_id?: string;
  state_name?: string;
  work_item?: string;
  issue_name?: string;
  summary?: string;
};

export type TAssistantPackInstallProposal = {
  pack_name: string;
  board_slug?: string;
  name?: string;
  version?: string;
  description?: string;
  rules_count?: number;
  has_hooks?: boolean;
};

export type TAutomationPackSummary = {
  name: string;
  version: string;
  description: string;
  permissions: string[];
  rules_count: number;
  catalog_count: number;
  has_hooks: boolean;
};

export type TAutomationPacksResponse = {
  available: TAutomationPackSummary[];
  installed: Array<{
    id: string;
    pack_name: string;
    pack_version: string;
    installed_at: string;
    rule_ids: string[];
    hook_ids: string[];
  }>;
  catalog: TAutomationCatalog;
};

export type IBoardAutomationHook = {
  id: string;
  name: string;
  enabled: boolean;
  event: TAutomationHookEvent;
  matcher: string;
  handler_type: TAutomationHookHandler;
  config: Record<string, unknown>;
  sort_order: number;
  board: string;
  workspace: string;
  created_at: string;
  updated_at: string;
};
