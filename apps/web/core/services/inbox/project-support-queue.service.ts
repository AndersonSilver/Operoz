import { API_BASE_URL } from "@operoz/constants";
import type { TBoardSupportQueue } from "@operoz/types";
import { APIService } from "@/services/api.service";

export class ProjectSupportQueueService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string, projectId: string): Promise<TBoardSupportQueue[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/support-queues/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const projectSupportQueueService = new ProjectSupportQueueService();
