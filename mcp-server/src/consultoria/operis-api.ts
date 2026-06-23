import type { OperisClient } from "../client.js";
import { OperisApiError } from "../client.js";
import { asList, RequestBudget, retryDelayMs, sleep, type Paginated } from "./api-utils.js";

const LIST_PAGE_SIZE = 250;
const MAX_RETRIES = 12;
/** Intervalo mínimo entre escritas em operações bulk (create_module, bulk_create_tasks). */
const BULK_WRITE_INTERVAL_MS = 100;

type ApiRecord = Record<string, unknown>;

/** Wrapper fino para as chamadas à API do Operis usadas pela consultoria. */
export class ConsultoriaApi {
  private readonly budget = new RequestBudget();
  private bulkDepth = 0;
  private lastWriteAt = 0;

  constructor(
    public client: OperisClient,
    public wsSlug: string
  ) {}

  /** Marca operação longa (create_module) — aplica intervalo extra entre escritas. */
  async runBulk<T>(fn: () => Promise<T>): Promise<T> {
    this.bulkDepth++;
    try {
      return await fn();
    } finally {
      this.bulkDepth--;
    }
  }

  get isBulkMode(): boolean {
    return this.bulkDepth > 0;
  }

  private async beforeRequest(method: string): Promise<void> {
    await this.budget.acquire();

    if (this.bulkDepth > 0 && method !== "GET") {
      const elapsed = Date.now() - this.lastWriteAt;
      const wait = BULK_WRITE_INTERVAL_MS - elapsed;
      if (wait > 0) await sleep(wait);
      this.lastWriteAt = Date.now();
    }
  }

  private async v1<T>(
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
    path: string,
    body?: unknown,
    query?: Record<string, string | number | boolean | undefined>,
    attempt = 0
  ): Promise<T> {
    await this.beforeRequest(method);

    try {
      return await this.client.request<T>({ surface: "v1", method, path, body, query });
    } catch (error) {
      if (error instanceof OperisApiError && error.status === 429 && attempt < MAX_RETRIES) {
        await sleep(retryDelayMs(error, attempt));
        return this.v1(method, path, body, query, attempt + 1);
      }
      throw error;
    }
  }

  private listPath(path: string): Promise<ApiRecord[]> {
    return this.v1<Paginated<ApiRecord>>("GET", path, undefined, { per_page: LIST_PAGE_SIZE }).then(asList);
  }

  // Projects
  listProjects(): Promise<ApiRecord[]> {
    return this.listPath(`/workspaces/${this.wsSlug}/projects/`);
  }
  getProject(projectId: string) {
    return this.v1<ApiRecord>("GET", `/workspaces/${this.wsSlug}/projects/${projectId}/`);
  }
  createProject(body: unknown) {
    return this.v1<ApiRecord>("POST", `/workspaces/${this.wsSlug}/projects/`, body);
  }
  updateProject(projectId: string, body: unknown) {
    return this.v1<ApiRecord>("PATCH", `/workspaces/${this.wsSlug}/projects/${projectId}/`, body);
  }
  archiveProject(projectId: string) {
    return this.v1<ApiRecord>("POST", `/workspaces/${this.wsSlug}/projects/${projectId}/archive/`, {});
  }

  // Modules
  listModules(projectId: string): Promise<ApiRecord[]> {
    return this.listPath(`/workspaces/${this.wsSlug}/projects/${projectId}/modules/`);
  }
  createModule(projectId: string, body: unknown) {
    return this.v1<ApiRecord>("POST", `/workspaces/${this.wsSlug}/projects/${projectId}/modules/`, body);
  }
  updateModule(projectId: string, moduleId: string, body: unknown) {
    return this.v1<ApiRecord>("PATCH", `/workspaces/${this.wsSlug}/projects/${projectId}/modules/${moduleId}/`, body);
  }
  deleteModule(projectId: string, moduleId: string) {
    return this.v1<ApiRecord>("DELETE", `/workspaces/${this.wsSlug}/projects/${projectId}/modules/${moduleId}/`);
  }
  listModuleIssues(projectId: string, moduleId: string): Promise<ApiRecord[]> {
    return this.listPath(`/workspaces/${this.wsSlug}/projects/${projectId}/modules/${moduleId}/module-issues/`);
  }
  addIssueToModule(projectId: string, moduleId: string, issueIds: string[]) {
    return this.v1<ApiRecord>(
      "POST",
      `/workspaces/${this.wsSlug}/projects/${projectId}/modules/${moduleId}/module-issues/`,
      { issues: issueIds }
    );
  }
  getModule(projectId: string, moduleId: string) {
    return this.v1<ApiRecord>("GET", `/workspaces/${this.wsSlug}/projects/${projectId}/modules/${moduleId}/`);
  }

  // Work items (v1 usa /work-items/ em vez de /issues/)
  createIssue(projectId: string, body: unknown) {
    return this.v1<ApiRecord>("POST", `/workspaces/${this.wsSlug}/projects/${projectId}/work-items/`, body);
  }
  getIssue(projectId: string, issueId: string) {
    return this.v1<ApiRecord>("GET", `/workspaces/${this.wsSlug}/projects/${projectId}/work-items/${issueId}/`);
  }
  updateIssue(projectId: string, issueId: string, body: unknown) {
    return this.v1<ApiRecord>("PATCH", `/workspaces/${this.wsSlug}/projects/${projectId}/work-items/${issueId}/`, body);
  }
  deleteIssue(projectId: string, issueId: string) {
    return this.v1<ApiRecord>("DELETE", `/workspaces/${this.wsSlug}/projects/${projectId}/work-items/${issueId}/`);
  }
  listSubIssues(projectId: string, issueId: string) {
    return this.v1<ApiRecord>("GET", `/workspaces/${this.wsSlug}/projects/${projectId}/work-items/${issueId}/`);
  }

  // Labels
  listLabels(projectId: string): Promise<ApiRecord[]> {
    return this.listPath(`/workspaces/${this.wsSlug}/projects/${projectId}/labels/`);
  }
  createLabel(projectId: string, body: unknown) {
    return this.v1<ApiRecord>("POST", `/workspaces/${this.wsSlug}/projects/${projectId}/labels/`, body);
  }

  // States
  listStates(projectId: string): Promise<ApiRecord[]> {
    return this.listPath(`/workspaces/${this.wsSlug}/projects/${projectId}/states/`);
  }
}

export function getWsSlug(args: Record<string, unknown>): string {
  const fromArgs = typeof args.workspace_slug === "string" ? args.workspace_slug.trim() : "";
  const fromEnv = process.env.OPERIS_WORKSPACE_SLUG?.trim() ?? "";
  const slug = fromArgs || fromEnv;
  if (!slug) {
    throw new Error(
      "workspace_slug é obrigatório. Defina OPERIS_WORKSPACE_SLUG no ambiente ou passe workspace_slug na chamada."
    );
  }
  return slug;
}
