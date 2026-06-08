import { API_BASE_URL } from "@operis/constants";
import type {
  IBoard,
  IBoardAutomationDeadLetter,
  IBoardAutomationEmailTemplate,
  IBoardAutomationRule,
  IBoardAutomationRuleRevision,
  IBoardAutomationRun,
  IBoardAutomationScript,
  IBoardAutomationSecret,
  IBoardMeta,
  IBoardModule,
  IEmailNotificationLog,
  TAutomationCatalog,
  TAutomationDryRunResult,
  TAutomationGraph,
  TAutomationMetricsResponse,
  TAutomationValidation,
  TBoardFormData,
  TClient360DetailResponse,
  TClient360ListResponse,
  TIssuesResponse,
} from "@operis/types";
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

  async updateBoard(
    workspaceSlug: string,
    boardSlug: string,
    data: Partial<TBoardFormData>
  ): Promise<IBoard> {
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
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/issues/`, { params }, config)
      .then((response) => response?.data)
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
    params?: { period_start?: string; period_end?: string }
  ): Promise<TClient360ListResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/client-360/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getClient360Detail(
    workspaceSlug: string,
    boardSlug: string,
    projectId: string,
    params?: { period_start?: string; period_end?: string }
  ): Promise<TClient360DetailResponse> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/boards/${boardSlug}/client-360/${projectId}/`,
      { params }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getEmailNotificationLogs(
    workspaceSlug: string,
    boardSlug: string
  ): Promise<IEmailNotificationLog[]> {
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
    return this.patch(
      `/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/rules/${ruleId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async publishAutomationRule(
    workspaceSlug: string,
    boardSlug: string,
    ruleId: string
  ): Promise<IBoardAutomationRule> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/rules/${ruleId}/publish/`
    )
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
    return this.post(
      `/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/rules/${ruleId}/dry-run/`,
      { event, graph, live }
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getAutomationRuns(
    workspaceSlug: string,
    boardSlug: string,
    ruleId?: string
  ): Promise<IBoardAutomationRun[]> {
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
    return this.patch(
      `/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/scripts/${scriptId}/`,
      data
    )
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

  async deleteAutomationEmailTemplate(
    workspaceSlug: string,
    boardSlug: string,
    templateId: string
  ): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/email-templates/${templateId}/`
    )
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

  async getAutomationDeadLetters(
    workspaceSlug: string,
    boardSlug: string
  ): Promise<IBoardAutomationDeadLetter[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/dead-letters/`)
      .then((response) => response?.data ?? [])
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
    return this.patch(
      `/api/workspaces/${workspaceSlug}/boards/${boardSlug}/automation/secrets/${secretId}/`,
      data
    )
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
