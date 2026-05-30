import { API_BASE_URL } from "@operis/constants";
import type { IProjectBoardPermissions } from "@operis/types";
import { APIService } from "@/services/api.service";

export class BoardPermissionsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getProjectBoardPermissions(
    workspaceSlug: string,
    projectId: string
  ): Promise<IProjectBoardPermissions> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/board-permissions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
