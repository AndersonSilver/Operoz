import { API_BASE_URL } from "@operoz/constants";
import type { TBoardSupportSlaPolicy, TBoardSupportSlaPolicyWritePayload } from "@operoz/types";
import { APIService } from "@/services/api.service";

export class BoardSupportSlaPolicyService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async retrieve(workspaceSlug: string, boardSlug: string): Promise<TBoardSupportSlaPolicy> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/support-sla-policy/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    boardSlug: string,
    data: TBoardSupportSlaPolicyWritePayload
  ): Promise<TBoardSupportSlaPolicy> {
    return this.patch(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/support-sla-policy/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const boardSupportSlaPolicyService = new BoardSupportSlaPolicyService();
