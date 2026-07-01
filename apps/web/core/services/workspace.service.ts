import { API_BASE_URL } from "@operoz/constants";
import type {
  IWorkspace,
  IWorkspaceMemberMe,
  IWorkspaceMember,
  IWorkspaceMemberInvitation,
  ILastActiveWorkspaceDetails,
  IWorkspaceSearchResults,
  IWorkspaceBulkInviteFormData,
  IWorkspaceViewProps,
  IUserProjectsRole,
  IWorkspaceView,
  TIssuesResponse,
  TLink,
  TSearchResponse,
  TSearchEntityRequestPayload,
  TWidgetEntityData,
  TActivityEntityData,
  IWorkspaceSidebarNavigationItem,
  IWorkspaceSidebarNavigation,
  IWorkspaceUserPropertiesResponse,
  TClient360DetailResponse,
  TClient360HealthHistoryResponse,
  TClient360ListResponse,
  TClient360MatrixResponse,
} from "@operoz/types";
// services
import { APIService } from "@/services/api.service";

export class WorkspaceService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async userWorkspaces(): Promise<IWorkspace[]> {
    return this.get("/api/users/me/workspaces/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getWorkspace(workspaceSlug: string): Promise<IWorkspace> {
    return this.get(`/api/workspaces/${workspaceSlug}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async createWorkspace(data: Partial<IWorkspace>): Promise<IWorkspace> {
    return this.post("/api/workspaces/", data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateWorkspace(workspaceSlug: string, data: Partial<IWorkspace>): Promise<IWorkspace> {
    return this.patch(`/api/workspaces/${workspaceSlug}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteWorkspace(workspaceSlug: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async transferWorkspaceOwnership(workspaceSlug: string, data: { new_owner_id: string }): Promise<IWorkspace> {
    return this.post(`/api/workspaces/${workspaceSlug}/transfer-ownership/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async inviteWorkspace(workspaceSlug: string, data: IWorkspaceBulkInviteFormData): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/invitations/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async joinWorkspace(workspaceSlug: string, invitationId: string, data: any): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/invitations/${invitationId}/join/`, data, {
      headers: {},
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async joinWorkspaces(data: any): Promise<any> {
    return this.post("/api/users/me/workspaces/invitations/", data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getLastActiveWorkspaceAndProjects(): Promise<ILastActiveWorkspaceDetails> {
    return this.get("/api/users/last-visited-workspace/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async userWorkspaceInvitations(): Promise<IWorkspaceMemberInvitation[]> {
    return this.get("/api/users/me/workspaces/invitations/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async workspaceMemberMe(workspaceSlug: string): Promise<IWorkspaceMemberMe> {
    return this.get(`/api/workspaces/${workspaceSlug}/workspace-members/me/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateWorkspaceView(workspaceSlug: string, data: { view_props: IWorkspaceViewProps }): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/workspace-views/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchWorkspaceMembers(workspaceSlug: string): Promise<IWorkspaceMember[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/members/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateWorkspaceMember(
    workspaceSlug: string,
    memberId: string,
    data: Partial<IWorkspaceMember>
  ): Promise<IWorkspaceMember> {
    return this.patch(`/api/workspaces/${workspaceSlug}/members/${memberId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteWorkspaceMember(workspaceSlug: string, memberId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/members/${memberId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async workspaceInvitations(workspaceSlug: string): Promise<IWorkspaceMemberInvitation[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/invitations/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getWorkspaceInvitation(workspaceSlug: string, invitationId: string): Promise<IWorkspaceMemberInvitation> {
    return this.get(`/api/workspaces/${workspaceSlug}/invitations/${invitationId}/join/`, { headers: {} })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateWorkspaceInvitation(
    workspaceSlug: string,
    invitationId: string,
    data: Partial<IWorkspaceMember>
  ): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/invitations/${invitationId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteWorkspaceInvitations(workspaceSlug: string, invitationId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/invitations/${invitationId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async workspaceSlugCheck(slug: string): Promise<any> {
    return this.get(`/api/workspace-slug-check/?slug=${slug}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async searchWorkspace(
    workspaceSlug: string,
    params: {
      project_id?: string;
      search: string;
      workspace_search: boolean;
    }
  ): Promise<IWorkspaceSearchResults> {
    return this.get(`/api/workspaces/${workspaceSlug}/search/`, {
      params,
    })
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createView(workspaceSlug: string, data: Partial<IWorkspaceView>): Promise<IWorkspaceView> {
    return this.post(`/api/workspaces/${workspaceSlug}/views/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateView(workspaceSlug: string, viewId: string, data: Partial<IWorkspaceView>): Promise<IWorkspaceView> {
    return this.patch(`/api/workspaces/${workspaceSlug}/views/${viewId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteView(workspaceSlug: string, viewId: string): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/views/${viewId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getAllViews(workspaceSlug: string): Promise<IWorkspaceView[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/views/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getViewDetails(workspaceSlug: string, viewId: string): Promise<IWorkspaceView> {
    return this.get(`/api/workspaces/${workspaceSlug}/views/${viewId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getViewIssues(workspaceSlug: string, params: any, config = {}): Promise<TIssuesResponse> {
    const path = params.expand?.includes("issue_relation")
      ? `/api/workspaces/${workspaceSlug}/issues-detail/`
      : `/api/workspaces/${workspaceSlug}/issues/`;
    return this.get(
      path,
      {
        params,
      },
      config
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getWorkspaceUserProjectsRole(workspaceSlug: string): Promise<IUserProjectsRole> {
    return this.get(`/api/users/me/workspaces/${workspaceSlug}/project-roles/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // quicklinks
  async fetchWorkspaceLinks(workspaceSlug: string): Promise<TLink[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/quick-links/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async createWorkspaceLink(workspaceSlug: string, data: Partial<TLink>): Promise<TLink> {
    return this.post(`/api/workspaces/${workspaceSlug}/quick-links/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateWorkspaceLink(workspaceSlug: string, linkId: string, data: Partial<TLink>): Promise<TLink> {
    return this.patch(`/api/workspaces/${workspaceSlug}/quick-links/${linkId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteWorkspaceLink(workspaceSlug: string, linkId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/quick-links/${linkId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async searchEntity(workspaceSlug: string, params: TSearchEntityRequestPayload): Promise<TSearchResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/entity-search/`, {
      params: {
        ...params,
        query_type: params.query_type.join(","),
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // recents
  async fetchWorkspaceRecents(workspaceSlug: string, entity_name?: string): Promise<TActivityEntityData[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/recent-visits/`, {
      params: {
        entity_name,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  // widgets
  async fetchWorkspaceWidgets(workspaceSlug: string): Promise<TWidgetEntityData[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/home-preferences/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateWorkspaceWidget(
    workspaceSlug: string,
    widgetKey: string,
    data: Partial<TWidgetEntityData>
  ): Promise<TWidgetEntityData> {
    return this.patch(`/api/workspaces/${workspaceSlug}/home-preferences/${widgetKey}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async fetchSidebarNavigationPreferences(workspaceSlug: string): Promise<IWorkspaceSidebarNavigation> {
    return this.get(`/api/workspaces/${workspaceSlug}/sidebar-preferences/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateSidebarPreference(
    workspaceSlug: string,
    key: string,
    data: Partial<IWorkspaceSidebarNavigationItem>
  ): Promise<IWorkspaceSidebarNavigationItem> {
    return this.patch(`/api/workspaces/${workspaceSlug}/sidebar-preferences/${key}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateBulkSidebarPreferences(
    workspaceSlug: string,
    data: Array<{ key: string; is_pinned: boolean; sort_order: number }>
  ): Promise<IWorkspaceSidebarNavigation> {
    return this.patch(`/api/workspaces/${workspaceSlug}/sidebar-preferences/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async fetchWorkspaceFilters(workspaceSlug: string): Promise<IWorkspaceUserPropertiesResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/user-properties/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchWorkspaceFilters(
    workspaceSlug: string,
    data: Partial<IWorkspaceUserPropertiesResponse>
  ): Promise<IWorkspaceUserPropertiesResponse> {
    return this.patch(`/api/workspaces/${workspaceSlug}/user-properties/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getClient360(
    workspaceSlug: string,
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
    return this.get(`/api/workspaces/${workspaceSlug}/client-360/`, { params: query })
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
    projectId: string,
    params?: { period_start?: string; period_end?: string }
  ): Promise<TClient360DetailResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/client-360/${projectId}/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getClient360HealthHistory(
    workspaceSlug: string,
    projectId: string,
    params?: { weeks?: number }
  ): Promise<TClient360HealthHistoryResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/client-360/${projectId}/health-history/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getClient360Matrix(
    workspaceSlug: string,
    params?: {
      period_start?: string;
      period_end?: string;
      weeks?: number;
      page?: number;
      page_size?: number;
      board_ids?: string;
    }
  ): Promise<TClient360MatrixResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/client-360/matrix/`, { params })
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
    params: {
      period_start?: string;
      period_end?: string;
      weeks?: number;
      export: "csv";
      delimiter?: "semicolon";
      board_ids?: string;
    }
  ): Promise<{ data: Blob; headers: Record<string, string | undefined> }> {
    return this.get(`/api/workspaces/${workspaceSlug}/client-360/matrix/`, { params }, { responseType: "blob" })
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
    params: {
      period_start?: string;
      period_end?: string;
      export: "support_csv";
      delimiter?: "semicolon";
    }
  ): Promise<{ data: Blob; headers: Record<string, string | undefined> }> {
    return this.get(`/api/workspaces/${workspaceSlug}/client-360/`, { params }, { responseType: "blob" })
      .then((response) => ({
        data: response.data as Blob,
        headers: response.headers as Record<string, string | undefined>,
      }))
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getClient360Narrative(
    workspaceSlug: string,
    projectId: string,
    params: { period_start: string; period_end: string }
  ): Promise<import("@operoz/types").TClient360Narrative> {
    return this.get(`/api/workspaces/${workspaceSlug}/client-360/${projectId}/narrative/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateClient360Narrative(
    workspaceSlug: string,
    projectId: string,
    data: { wins_md?: string; risks_md?: string; next_steps_md?: string },
    params: { period_start: string; period_end: string }
  ): Promise<import("@operoz/types").TClient360Narrative> {
    return this.patch(`/api/workspaces/${workspaceSlug}/client-360/${projectId}/narrative/`, data, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async downloadClient360QbrPortfolio(
    workspaceSlug: string,
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
    return this.get(`/api/workspaces/${workspaceSlug}/client-360/qbr/`, { params: query }, { responseType: "blob" })
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
      `/api/workspaces/${workspaceSlug}/client-360/${projectId}/qbr/`,
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

  async createClient360QbrGuestLink(
    workspaceSlug: string,
    data: {
      scope: "client" | "portfolio";
      project_id?: string;
      period_start: string;
      period_end: string;
      weeks?: number;
      include_compare?: boolean;
      expires_in_days?: number;
    }
  ): Promise<import("@/services/guest-qbr.service").TClient360QbrGuestLink> {
    return this.post(`/api/workspaces/${workspaceSlug}/client-360/qbr-guest-links/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getClient360SharedViews(workspaceSlug: string): Promise<import("@operoz/types").TClient360SharedView[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/client-360/shared-views/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createClient360SharedView(
    workspaceSlug: string,
    data: { name: string; payload: Record<string, unknown>; is_shared?: boolean }
  ): Promise<import("@operoz/types").TClient360SharedView> {
    return this.post(`/api/workspaces/${workspaceSlug}/client-360/shared-views/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteClient360SharedView(workspaceSlug: string, viewId: string): Promise<void> {
    await this.delete(`/api/workspaces/${workspaceSlug}/client-360/shared-views/${viewId}/`).catch((error) => {
      throw error?.response?.data;
    });
  }

  async getClient360FinopsHeatmap(
    workspaceSlug: string,
    params?: { board_ids?: string }
  ): Promise<import("@operoz/types").TClient360ConsultantHeatmap> {
    return this.get(`/api/workspaces/${workspaceSlug}/client-360/finops/consultant-heatmap/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async downloadClient360FinopsCsv(workspaceSlug: string): Promise<void> {
    const response = await this.get(
      `/api/workspaces/${workspaceSlug}/client-360/finops/export/`,
      {},
      { responseType: "blob" }
    );
    const blob = response.data as Blob;
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `operoz-finops-${workspaceSlug}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async updateClient360FinopsProfile(
    workspaceSlug: string,
    projectId: string,
    data: import("@operoz/types").TClient360FinopsProfileWrite
  ): Promise<import("@operoz/types").TClient360FinopsProfile> {
    return this.patch(`/api/workspaces/${workspaceSlug}/client-360/${projectId}/finops/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getClient360WeeklyBriefing(
    workspaceSlug: string,
    params: { period_start: string; period_end: string }
  ): Promise<import("@operoz/types").TClient360WeeklyBriefing> {
    return this.get(`/api/workspaces/${workspaceSlug}/client-360/intelligence/weekly-briefing/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async generateClient360WeeklyBriefing(
    workspaceSlug: string,
    params: { period_start: string; period_end: string; force?: boolean }
  ): Promise<import("@operoz/types").TClient360WeeklyBriefing> {
    return this.post(`/api/workspaces/${workspaceSlug}/client-360/intelligence/weekly-briefing/`, {}, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getClient360HealthExplainer(
    workspaceSlug: string,
    projectId: string,
    params: { period_start: string; period_end: string }
  ): Promise<import("@operoz/types").TClient360HealthExplainer> {
    return this.get(`/api/workspaces/${workspaceSlug}/client-360/${projectId}/health-explainer/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getClient360SuggestedActions(
    workspaceSlug: string,
    projectId: string,
    params: { period_start: string; period_end: string }
  ): Promise<import("@operoz/types").TClient360SuggestedActionsResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/client-360/${projectId}/suggested-actions/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async dismissClient360SuggestedAction(workspaceSlug: string, projectId: string, actionKey: string): Promise<void> {
    await this.post(`/api/workspaces/${workspaceSlug}/client-360/${projectId}/suggested-actions/`, {
      action_key: actionKey,
    }).catch((error) => {
      throw error?.response?.data;
    });
  }

  async getClient360QbrDraft(
    workspaceSlug: string,
    projectId: string,
    params: { period_start: string; period_end: string; quarter?: string }
  ): Promise<import("@operoz/types").TClient360QbrDraft> {
    return this.get(`/api/workspaces/${workspaceSlug}/client-360/${projectId}/qbr-draft/`, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async generateClient360QbrDraft(
    workspaceSlug: string,
    projectId: string,
    params: { period_start: string; period_end: string; quarter?: string }
  ): Promise<import("@operoz/types").TClient360QbrDraft> {
    return this.post(`/api/workspaces/${workspaceSlug}/client-360/${projectId}/qbr-draft/`, {}, { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateClient360QbrDraft(
    workspaceSlug: string,
    projectId: string,
    payload: { human_edited_md: string; quarter?: string }
  ): Promise<import("@operoz/types").TClient360QbrDraft> {
    return this.patch(`/api/workspaces/${workspaceSlug}/client-360/${projectId}/qbr-draft/`, payload, {
      params: payload.quarter ? { quarter: payload.quarter } : undefined,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
