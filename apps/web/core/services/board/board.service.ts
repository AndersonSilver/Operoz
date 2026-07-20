import { API_BASE_URL } from "@operoz/constants";
import type {
  IBoard,
  IBoardAutomationDeadLetter,
  IBoardAutomationEmailTemplate,
  IBoardAutomationHook,
  IBoardAutomationPolicy,
  IBoardAutomationPublishAudit,
  IBoardAutomationRule,
  IBoardAutomationRuleRevision,
  IBoardAutomationRun,
  IBoardAutomationScript,
  IBoardAutomationSecret,
  IBoardClient360HealthSettings,
  IBoardClient360HealthSettingsUpdate,
  IBoardPlaybook,
  IBoardPlaybookMetadata,
  IBoardMeta,
  IBoardModule,
  IEmailNotificationLog,
  TAutomationCatalog,
  TAutomationDryRunResult,
  TAutomationGraph,
  TAutomationPacksResponse,
  TAutomationTemplate,
  TAutomationTemplateInstallResult,
  TAutomationMetricsResponse,
  TAutomationValidation,
  TBoardFormData,
  TClient360DetailResponse,
  TClient360HealthHistoryResponse,
  TClient360ListResponse,
  TClient360MatrixResponse,
  TIssuesResponse,
} from "@operoz/types";
import { APIService } from "@/services/api.service";

type TBoardListResponse = {
  results: IBoard[];
};

export class BoardService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getBoards(workspaceSlug: string, options?: { includeArchived?: boolean }): Promise<IBoard[]> {
    const params: Record<string, string | number> = { per_page: 100 };
    if (options?.includeArchived) params.include_archived = "true";
    return this.get(`/api/workspaces/${workspaceSlug}/boards/`, { params })
      .then((response) => {
        const data = response?.data;
        if (Array.isArray(data)) return data as IBoard[];
        return (data as TBoardListResponse)?.results ?? [];
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getBoard(workspaceSlug: string, boardSlug: string): Promise<IBoard> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createBoard(workspaceSlug: string, data: TBoardFormData & { slug?: string }): Promise<IBoard> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateBoard(workspaceSlug: string, boardSlug: string, data: Partial<TBoardFormData>): Promise<IBoard> {
    return this.patch(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteBoard(workspaceSlug: string, boardSlug: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async archiveBoard(workspaceSlug: string, boardSlug: string): Promise<IBoard> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/archive/`, {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async unarchiveBoard(workspaceSlug: string, boardSlug: string): Promise<IBoard> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/unarchive/`, {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getBoardIssues(
    workspaceSlug: string,
    boardSlug: string,
    params: Record<string, unknown>,
    config: Record<string, unknown> = {}
  ): Promise<TIssuesResponse> {
    const url = `/api/workspaces/${workspaceSlug}/boards/${boardSlug}/issues/`;
    return this.get(url, { params }, config)
      .then((response) => {
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getBoardMeta(workspaceSlug: string, boardSlug: string): Promise<IBoardMeta> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/meta/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getBoardModules(
    workspaceSlug: string,
    boardSlug: string,
    params?: { project_id?: string }
  ): Promise<IBoardModule[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/modules/`, { params })
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getClient360(
    workspaceSlug: string,
    boardSlug: string,
    params?: { period_start?: string; period_end?: string; compare?: boolean }
  ): Promise<TClient360ListResponse> {
    const query = params
      ? {
          ...params,
          ...(params.compare ? { compare: 1 } : {}),
        }
      : undefined;
    if (query && "compare" in query && !params?.compare) {
      delete query.compare;
    }
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/client-360/`, { params: query })
      .then((response) => response?.data)
      .catch((error) => {
        throw {
          status: error?.response?.status,
          ...(error?.response?.data ?? {}),
        };
      });
  }

  async getClient360Detail(
    workspaceSlug: string,
    boardSlug: string,
    projectId: string,
    params?: { period_start?: string; period_end?: string }
  ): Promise<TClient360DetailResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/client-360/${projectId}/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getClient360HealthHistory(
    workspaceSlug: string,
    boardSlug: string,
    projectId: string,
    params?: { weeks?: number }
  ): Promise<TClient360HealthHistoryResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/client-360/${projectId}/health-history/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getClient360Matrix(
    workspaceSlug: string,
    boardSlug: string,
    params?: {
      period_start?: string;
      period_end?: string;
      weeks?: number;
      page?: number;
      page_size?: number;
    }
  ): Promise<TClient360MatrixResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/client-360/matrix/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw {
          status: error?.response?.status,
          ...(error?.response?.data ?? {}),
        };
      });
  }

  async downloadClient360MatrixCsv(
    workspaceSlug: string,
    boardSlug: string,
    params: {
      period_start?: string;
      period_end?: string;
      weeks?: number;
      export: "csv";
      delimiter?: "semicolon";
    }
  ): Promise<{ data: Blob; headers: Record<string, string | undefined> }> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/boards/${boardSlug}/client-360/matrix/`,
      { params },
      { responseType: "blob" }
    )
      .then((response) => ({
        data: response.data as Blob,
        headers: response.headers as Record<string, string | undefined>,
      }))
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async downloadSupportAnalyticsCsv(
    workspaceSlug: string,
    boardSlug: string,
    params: {
      period_start?: string;
      period_end?: string;
      export: "support_csv";
      delimiter?: "semicolon";
    }
  ): Promise<{ data: Blob; headers: Record<string, string | undefined> }> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/boards/${boardSlug}/client-360/`,
      { params },
      { responseType: "blob" }
    )
      .then((response) => ({
        data: response.data as Blob,
        headers: response.headers as Record<string, string | undefined>,
      }))
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getClient360ReminderLogs(
    workspaceSlug: string,
    boardSlug: string
  ): Promise<import("@operoz/types").TClient360ReminderLog[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/client-360/reminder-logs/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async downloadClient360QbrPortfolio(
    workspaceSlug: string,
    boardSlug: string,
    params: {
      period_start?: string;
      period_end?: string;
      weeks?: number;
      export_format: "md" | "pdf";
      compare?: boolean;
    }
  ): Promise<{ data: Blob; headers: Record<string, string | undefined> }> {
    const query: Record<string, string | number | undefined> = {
      period_start: params.period_start,
      period_end: params.period_end,
      weeks: params.weeks,
      export_format: params.export_format,
    };
    if (params.compare) query.compare = 1;
    return this.get(
      `/api/workspaces/${workspaceSlug}/boards/${boardSlug}/client-360/qbr/`,
      { params: query },
      { responseType: "blob" }
    )
      .then((response) => ({
        data: response.data as Blob,
        headers: response.headers as Record<string, string | undefined>,
      }))
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async downloadClient360QbrClient(
    workspaceSlug: string,
    boardSlug: string,
    projectId: string,
    params: {
      period_start?: string;
      period_end?: string;
      weeks?: number;
      export_format: "md" | "pdf";
      compare?: boolean;
    }
  ): Promise<{ data: Blob; headers: Record<string, string | undefined> }> {
    const query: Record<string, string | number | undefined> = {
      period_start: params.period_start,
      period_end: params.period_end,
      weeks: params.weeks,
      export_format: params.export_format,
    };
    if (params.compare) query.compare = 1;
    return this.get(
      `/api/workspaces/${workspaceSlug}/boards/${boardSlug}/client-360/${projectId}/qbr/`,
      { params: query },
      { responseType: "blob" }
    )
      .then((response) => ({
        data: response.data as Blob,
        headers: response.headers as Record<string, string | undefined>,
      }))
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getEmailNotificationLogs(workspaceSlug: string, boardSlug: string): Promise<IEmailNotificationLog[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/email-notification-logs/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getAutomationCatalog(workspaceSlug: string, boardSlug: string): Promise<TAutomationCatalog> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/catalog/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getAutomationRules(workspaceSlug: string, boardSlug: string): Promise<IBoardAutomationRule[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/rules/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createAutomationRule(
    workspaceSlug: string,
    boardSlug: string,
    data: Partial<IBoardAutomationRule>
  ): Promise<IBoardAutomationRule> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/rules/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateAutomationRule(
    workspaceSlug: string,
    boardSlug: string,
    ruleId: string,
    data: Partial<IBoardAutomationRule>
  ): Promise<IBoardAutomationRule> {
    return this.patch(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/rules/${ruleId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async publishAutomationRule(workspaceSlug: string, boardSlug: string, ruleId: string): Promise<IBoardAutomationRule> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/rules/${ruleId}/publish/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getAutomationRuleRevisions(
    workspaceSlug: string,
    boardSlug: string,
    ruleId: string,
    kind?: "draft" | "published"
  ): Promise<IBoardAutomationRuleRevision[]> {
    const query = kind ? `?kind=${kind}` : "";
    return this.get(
      `/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/rules/${ruleId}/revisions/${query}`
    )
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async restoreAutomationRuleRevision(
    workspaceSlug: string,
    boardSlug: string,
    ruleId: string,
    revisionId: string
  ): Promise<IBoardAutomationRule> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/rules/${ruleId}/revisions/${revisionId}/restore/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteAutomationRule(workspaceSlug: string, boardSlug: string, ruleId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/rules/${ruleId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async validateAutomationGraph(
    workspaceSlug: string,
    boardSlug: string,
    graph: TAutomationGraph
  ): Promise<TAutomationValidation> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/validate/`, { graph })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async dryRunAutomationRule(
    workspaceSlug: string,
    boardSlug: string,
    ruleId: string,
    event: Record<string, unknown>,
    graph?: TAutomationGraph,
    live = true
  ): Promise<TAutomationDryRunResult> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/rules/${ruleId}/dry-run/`, {
      event,
      graph,
      live,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getAutomationRuns(workspaceSlug: string, boardSlug: string, ruleId?: string): Promise<IBoardAutomationRun[]> {
    const params = ruleId ? { rule_id: ruleId } : undefined;
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/runs/`, { params })
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getAutomationScripts(workspaceSlug: string, boardSlug: string): Promise<IBoardAutomationScript[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/scripts/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createAutomationScript(
    workspaceSlug: string,
    boardSlug: string,
    data: Partial<IBoardAutomationScript>
  ): Promise<IBoardAutomationScript> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/scripts/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateAutomationScript(
    workspaceSlug: string,
    boardSlug: string,
    scriptId: string,
    data: Partial<IBoardAutomationScript>
  ): Promise<IBoardAutomationScript> {
    return this.patch(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/scripts/${scriptId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteAutomationScript(workspaceSlug: string, boardSlug: string, scriptId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/scripts/${scriptId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getAutomationEmailTemplates(
    workspaceSlug: string,
    boardSlug: string
  ): Promise<IBoardAutomationEmailTemplate[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/email-templates/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createAutomationEmailTemplate(
    workspaceSlug: string,
    boardSlug: string,
    data: Partial<IBoardAutomationEmailTemplate>
  ): Promise<IBoardAutomationEmailTemplate> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/email-templates/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateAutomationEmailTemplate(
    workspaceSlug: string,
    boardSlug: string,
    templateId: string,
    data: Partial<IBoardAutomationEmailTemplate>
  ): Promise<IBoardAutomationEmailTemplate> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/email-templates/${templateId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteAutomationEmailTemplate(workspaceSlug: string, boardSlug: string, templateId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/email-templates/${templateId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getAutomationMetrics(workspaceSlug: string, boardSlug: string): Promise<TAutomationMetricsResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/metrics/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getAutomationDeadLetters(workspaceSlug: string, boardSlug: string): Promise<IBoardAutomationDeadLetter[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/dead-letters/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getAutomationPolicy(workspaceSlug: string, boardSlug: string): Promise<IBoardAutomationPolicy> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/policy/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateAutomationPolicy(
    workspaceSlug: string,
    boardSlug: string,
    data: Partial<IBoardAutomationPolicy>
  ): Promise<IBoardAutomationPolicy> {
    return this.patch(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/policy/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getClient360HealthSettings(workspaceSlug: string, boardSlug: string): Promise<IBoardClient360HealthSettings> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/client-360/health-settings/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateClient360HealthSettings(
    workspaceSlug: string,
    boardSlug: string,
    data: IBoardClient360HealthSettingsUpdate
  ): Promise<IBoardClient360HealthSettings> {
    return this.patch(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/client-360/health-settings/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async resetClient360HealthSettings(workspaceSlug: string, boardSlug: string): Promise<IBoardClient360HealthSettings> {
    return this.delete(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/client-360/health-settings/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getClient360IntakeTypes(
    workspaceSlug: string,
    boardSlug: string
  ): Promise<import("@operoz/types").TClient360IntakeType[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/client-360/intake-types/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createClient360IntakeType(
    workspaceSlug: string,
    boardSlug: string,
    data: { name: string; slug?: string; type_name_pattern?: string; sort_order?: number }
  ): Promise<import("@operoz/types").TClient360IntakeType> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/client-360/intake-types/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteClient360IntakeType(workspaceSlug: string, boardSlug: string, intakeTypeId: string): Promise<void> {
    await this.delete(
      `/api/workspaces/${workspaceSlug}/boards/${boardSlug}/client-360/intake-types/${intakeTypeId}/`
    ).catch((error) => {
      throw error?.response?.data;
    });
  }

  async getAutomationPublishAudits(
    workspaceSlug: string,
    boardSlug: string,
    ruleId?: string
  ): Promise<IBoardAutomationPublishAudit[]> {
    const params = ruleId ? { rule_id: ruleId } : undefined;
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/publish-audits/`, {
      params,
    })
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getAutomationHooks(workspaceSlug: string, boardSlug: string): Promise<IBoardAutomationHook[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/hooks/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createAutomationHook(
    workspaceSlug: string,
    boardSlug: string,
    data: {
      name: string;
      enabled?: boolean;
      event: string;
      matcher?: string;
      handler_type: string;
      config?: Record<string, unknown>;
      sort_order?: number;
    }
  ): Promise<IBoardAutomationHook> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/hooks/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getAutomationPacks(workspaceSlug: string, boardSlug: string): Promise<TAutomationPacksResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/packs/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async installAutomationPack(
    workspaceSlug: string,
    boardSlug: string,
    packName: string,
    data: { config?: Record<string, unknown>; create_rules?: boolean; publish?: boolean } = {}
  ) {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/packs/${packName}/install/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async uninstallAutomationPack(workspaceSlug: string, boardSlug: string, packName: string) {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/packs/${packName}/uninstall/`, {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getAutomationTemplates(workspaceSlug: string, boardSlug: string): Promise<TAutomationTemplate[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/templates/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async installAutomationTemplate(
    workspaceSlug: string,
    boardSlug: string,
    templateId: string,
    data: {
      parameters?: Record<string, unknown>;
      name?: string;
      description?: string;
      dry_run?: boolean;
      publish?: boolean;
      live?: boolean;
    }
  ): Promise<TAutomationTemplateInstallResult> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/templates/${templateId}/install/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getPlaybooks(workspaceSlug: string, boardSlug: string): Promise<IBoardPlaybook[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/playbooks/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createPlaybook(
    workspaceSlug: string,
    boardSlug: string,
    data: {
      title: string;
      description?: string;
      draft_markdown?: string;
      metadata?: IBoardPlaybookMetadata;
    }
  ): Promise<IBoardPlaybook> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/playbooks/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updatePlaybook(
    workspaceSlug: string,
    boardSlug: string,
    playbookId: string,
    data: Partial<{
      title: string;
      description: string;
      draft_markdown: string;
      is_active: boolean;
      metadata: IBoardPlaybookMetadata;
    }>
  ): Promise<IBoardPlaybook> {
    return this.patch(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/playbooks/${playbookId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async publishPlaybook(workspaceSlug: string, boardSlug: string, playbookId: string): Promise<IBoardPlaybook> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/playbooks/${playbookId}/publish/`, {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deletePlaybook(workspaceSlug: string, boardSlug: string, playbookId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/playbooks/${playbookId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteAutomationHook(workspaceSlug: string, boardSlug: string, hookId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/hooks/${hookId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getAutomationSecrets(workspaceSlug: string, boardSlug: string): Promise<IBoardAutomationSecret[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/secrets/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createAutomationSecret(
    workspaceSlug: string,
    boardSlug: string,
    data: { key: string; value: string; description?: string }
  ): Promise<IBoardAutomationSecret> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/secrets/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateAutomationSecret(
    workspaceSlug: string,
    boardSlug: string,
    secretId: string,
    data: { key?: string; value?: string; description?: string }
  ): Promise<IBoardAutomationSecret> {
    return this.patch(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/secrets/${secretId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteAutomationSecret(workspaceSlug: string, boardSlug: string, secretId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/secrets/${secretId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
