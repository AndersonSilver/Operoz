import { API_BASE_URL } from "@operis/constants";
import { APIService } from "@/services/api.service";

export type TJiraOpsSyncStatus = "idle" | "running" | "completed" | "failed";

export type TJiraOpsSyncPhase = "queued" | "fetching_epics" | "fetching_issues" | "importing" | null;

export type TJiraOpsSyncResult = {
  clients: number;
  modules: number;
  skipped_epics: number;
  created_cards: number;
  linked_cards: number;
  updated_cards: number;
  created_subtasks: number;
  linked_subtasks: number;
  updated_subtasks: number;
  epics_fetched: number;
  issues_fetched: number;
};

export type TJiraOpsImportPreview = {
  epics_fetched: number;
  issues_fetched: number;
  skipped_epics: number;
  projects_new: number;
  projects_existing: number;
  modules_new: number;
  modules_existing: number;
  modules_renamed: number;
  cards_new: number;
  cards_updated: number;
  cards_unchanged: number;
  cards_link_only: number;
  subtasks_new: number;
  subtasks_updated: number;
  subtasks_unchanged: number;
  subtasks_parent_missing: number;
  new_project_names: string[];
  sample_new_modules: string[];
  sample_new_cards: string[];
};

export type TJiraOpsConfigPayload = Record<string, string>;

export type TJiraOpsSite = {
  id: string;
  name: string;
  url?: string;
};

export type TJiraOpsProject = {
  key: string;
  name: string;
  id: string;
};

export type TJiraOpsSyncState = {
  oauth_app_client_id: string;
  oauth_app_configured: boolean;
  oauth_redirect_uri: string;
  cloud_id: string;
  email: string;
  api_token_configured: boolean;
  oauth_connected: boolean;
  jira_site_name: string;
  project_key: string;
  board_slug: string;
  configured: boolean;
  uses_env_fallback?: boolean;
  last_sync_at?: string | null;
  status: TJiraOpsSyncStatus;
  phase?: TJiraOpsSyncPhase;
  started_at?: string;
  finished_at?: string | null;
  result?: TJiraOpsSyncResult;
  error?: string;
  epics_count?: number;
  issues_count?: number;
};

export class WorkspaceJiraSyncService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getStatus(workspaceSlug: string): Promise<TJiraOpsSyncState> {
    return this.get(`/api/workspaces/${workspaceSlug}/jira-ops-sync/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async saveConfig(workspaceSlug: string, data: TJiraOpsConfigPayload): Promise<TJiraOpsSyncState> {
    return this.patch(`/api/workspaces/${workspaceSlug}/jira-ops-sync/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async previewSync(
    workspaceSlug: string,
    data: { board_slug: string; project_key: string }
  ): Promise<TJiraOpsImportPreview> {
    return this.post(`/api/workspaces/${workspaceSlug}/jira-ops-sync/preview/`, data)
      .then((response) => response?.data as TJiraOpsImportPreview)
      .catch((error) => {
        throw error?.response?.data ?? error?.response;
      });
  }

  async startSync(workspaceSlug: string, boardSlug?: string): Promise<TJiraOpsSyncState> {
    return this.post(`/api/workspaces/${workspaceSlug}/jira-ops-sync/`, boardSlug ? { board_slug: boardSlug } : {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data ?? error?.response;
      });
  }

  async getOAuthStartUrl(workspaceSlug: string): Promise<string> {
    return this.get(`/api/workspaces/${workspaceSlug}/jira-ops-sync/oauth/start/`)
      .then((response) => response?.data?.authorize_url as string)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getOAuthSites(workspaceSlug: string): Promise<{ sites: TJiraOpsSite[]; pending: boolean }> {
    return this.get(`/api/workspaces/${workspaceSlug}/jira-ops-sync/oauth/sites/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async completeOAuth(
    workspaceSlug: string,
    data: { cloud_id: string; project_key?: string; board_slug?: string }
  ): Promise<TJiraOpsSyncState> {
    return this.post(`/api/workspaces/${workspaceSlug}/jira-ops-sync/oauth/complete/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getJiraProjects(workspaceSlug: string): Promise<TJiraOpsProject[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/jira-ops-sync/jira-projects/`)
      .then((response) => (response?.data?.projects ?? []) as TJiraOpsProject[])
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
