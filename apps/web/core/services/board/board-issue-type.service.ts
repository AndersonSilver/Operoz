import { API_BASE_URL } from "@operoz/constants";
import type { IBoardIssueType, IProjectIssueTypeLite, TBoardIssueTypeFormData } from "@operoz/types";
import { APIService } from "@/services/api.service";

export class BoardIssueTypeService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getBoardIssueTypes(workspaceSlug: string, boardSlug: string): Promise<IBoardIssueType[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/issue-types/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createBoardIssueType(
    workspaceSlug: string,
    boardSlug: string,
    data: TBoardIssueTypeFormData
  ): Promise<IBoardIssueType> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/issue-types/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateBoardIssueType(
    workspaceSlug: string,
    boardSlug: string,
    boardIssueTypeId: string,
    data: Partial<TBoardIssueTypeFormData> & { is_enabled?: boolean; sort_order?: number }
  ): Promise<IBoardIssueType> {
    return this.patch(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/issue-types/${boardIssueTypeId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async disableBoardIssueType(workspaceSlug: string, boardSlug: string, boardIssueTypeId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/issue-types/${boardIssueTypeId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProjectIssueTypes(workspaceSlug: string, projectId: string): Promise<IProjectIssueTypeLite[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-types/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
