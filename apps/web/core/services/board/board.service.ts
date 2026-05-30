import { API_BASE_URL } from "@operis/constants";
import type {
  IBoard,
  IBoardMeta,
  IBoardModule,
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
}
