import { API_BASE_URL } from "@operis/constants";
import type { TBoardSupportQueue, TBoardSupportQueueWritePayload } from "@operis/types";
import { APIService } from "@/services/api.service";

export class BoardSupportQueueService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string, boardSlug: string): Promise<TBoardSupportQueue[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/support-queues/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(
    workspaceSlug: string,
    boardSlug: string,
    data: TBoardSupportQueueWritePayload
  ): Promise<TBoardSupportQueue> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/support-queues/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    boardSlug: string,
    queueId: string,
    data: TBoardSupportQueueWritePayload
  ): Promise<TBoardSupportQueue> {
    return this.patch(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/support-queues/${queueId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(workspaceSlug: string, boardSlug: string, queueId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/support-queues/${queueId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const boardSupportQueueService = new BoardSupportQueueService();
