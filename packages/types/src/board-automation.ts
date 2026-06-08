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
    kind: "trigger" | "filter" | "decision" | "action";
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

export type TAutomationMetricsResponse = {
  metrics: Record<string, number>;
  queue: string;
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
