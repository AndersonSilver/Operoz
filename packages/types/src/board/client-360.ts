export type TClient360Health = "ok" | "warning" | "critical";

export type TClient360ReportCoverage = "complete" | "partial" | "missing" | "n_a";

export type TClient360ProjectLead = {
  id: string;
  display_name: string;
};

export type TClient360Client = {
  project_id: string;
  name: string;
  identifier: string;
  logo_props: Record<string, unknown>;
  /** Stakeholder do cliente (contacto no lado do cliente). */
  responsible_stakeholder: string;
  /** Responsável Operis (líder do projeto). */
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
};

export type TClient360Summary = {
  total_clients: number;
  health_critical: number;
  health_warning: number;
  report_missing: number;
  total_overdue: number;
  total_support_open: number;
};

export type TClient360ListResponse = {
  period_start: string;
  period_end: string;
  summary: TClient360Summary;
  clients: TClient360Client[];
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

export type TClient360DetailResponse = TClient360Client & {
  modules: TClient360ModuleRow[];
  overdue_issues: TClient360IssueSnippet[];
  support_issues: TClient360IssueSnippet[];
};
