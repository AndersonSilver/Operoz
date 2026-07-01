import { API_BASE_URL } from "@operoz/constants";
import type { IBoardModuleStage, TBoardModuleStageFormData, TBoardModuleStageUpdateData } from "@operoz/types";
import { APIService } from "@/services/api.service";

export class BoardModuleStageService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string, boardSlug: string): Promise<IBoardModuleStage[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/module-stages/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, boardSlug: string, data: TBoardModuleStageFormData): Promise<IBoardModuleStage> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/module-stages/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    boardSlug: string,
    stageId: string,
    data: TBoardModuleStageUpdateData
  ): Promise<IBoardModuleStage> {
    return this.patch(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/module-stages/${stageId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async remove(workspaceSlug: string, boardSlug: string, stageId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/module-stages/${stageId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
