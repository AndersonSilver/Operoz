export type TStatusReportEntregaRow = {
  etapa: string;
  pct?: string;
  mostrar_pct?: boolean;
  data_inicio?: string;
  data_entrega?: string;
};

export type TStatusReportObservacoes = {
  em_execucao?: string[];
  pontos_atencao?: string[];
};

export type TBoardStatusReportContent = {
  schema_version: number;
  sections: {
    module?: { id?: string; name?: string };
    report_row?: {
      produto?: string;
      consultor?: string;
      responsavel_cliente?: string;
      inicio?: string;
      fim?: string;
    };
    progress?: { pct?: number; omitir_global?: boolean };
    entregas?: TStatusReportEntregaRow[];
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
  module_id: string;
};

export type TBoardStatusReportUpdateData = {
  title?: string;
  period_start?: string;
  period_end?: string;
  content?: TBoardStatusReportContent;
  executive_summary_html?: string;
  em_execucao?: string[];
  pontos_atencao?: string[];
  publish?: boolean;
  unpublish?: boolean;
};

export type TStatusReportExportFormat = "md" | "html" | "pdf";

export type TStatusReportPreviewData = {
  format?: TStatusReportExportFormat;
  executive_summary_html?: string;
  em_execucao?: string[];
  pontos_atencao?: string[];
};
