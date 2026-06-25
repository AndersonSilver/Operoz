export type TStatusReportEntregaRow = {
  etapa: string;
  pct?: string;
  mostrar_pct?: boolean;
  data_inicio?: string;
  data_entrega?: string;
  issue_id?: string;
  item_label?: string;
  etapa_atual?: string;
};

export type TStatusReportSprintModuleRow = {
  module_id: string;
  item_label: string;
  data_inicio: string;
  data_entrega_etapa: string;
  etapa_atual: string;
  etapa_color?: string | null;
  pct_total: string;
  sort_order: number;
};

export type TStatusReportObservacoes = {
  em_execucao?: string[];
  pontos_atencao?: string[];
  proximos_passos?: string[];
};

export type TStatusReportKind = "module_single" | "sprint" | "multi_module";

export type TBoardStatusReportContent = {
  schema_version: number;
  report_kind?: TStatusReportKind;
  module_ids?: string[];
  sections: {
    sprint?: { label: string; period_label: string };
    module?: { id?: string; name?: string; start_date?: string; target_date?: string };
    report_row?: {
      produto?: string;
      consultor?: string;
      responsavel_cliente?: string;
      inicio?: string;
      fim?: string;
    };
    progress?: { pct?: number; omitir_global?: boolean };
    entregas?: TStatusReportEntregaRow[];
    entregas_sprint?: TStatusReportSprintModuleRow[];
    observacoes?: TStatusReportObservacoes;
    executive_summary?: { html?: string };
    metrics?: Record<string, unknown>;
    by_project?: Array<Record<string, unknown>>;
    highlights?: Array<Record<string, unknown>>;
    risks?: Record<string, unknown>;
    state_distribution?: Array<{ state_group: string; count: number }>;
  };
};

export interface IBoardStatusReport {
  id: string;
  board: string | null;
  project: string | null;
  module: string | null;
  module_name: string | null;
  project_name: string | null;
  title: string;
  period_start: string;
  period_end: string;
  content: TBoardStatusReportContent;
  published_at: string | null;
  is_published: boolean;
  created_by: string | null;
  created_by_name: string | null;
  created_by_avatar: string | null;
  created_at: string;
  updated_at: string;
}

export type TBoardStatusReportCreateData = {
  period_start: string;
  period_end: string;
  title?: string;
  executive_summary_html?: string;
};

export type TProjectStatusReportCreateData = TBoardStatusReportCreateData & {
  module_ids: string[];
  report_kind?: TStatusReportKind;
};

export type TBoardStatusReportUpdateData = {
  title?: string;
  period_start?: string;
  period_end?: string;
  content?: TBoardStatusReportContent;
  executive_summary_html?: string;
  em_execucao?: string[];
  pontos_atencao?: string[];
  proximos_passos?: string[];
  publish?: boolean;
  unpublish?: boolean;
};

export type TStatusReportExportFormat = "md" | "html" | "pdf";

export type TStatusReportPreviewData = {
  format?: TStatusReportExportFormat;
  executive_summary_html?: string;
  em_execucao?: string[];
  pontos_atencao?: string[];
  proximos_passos?: string[];
};
