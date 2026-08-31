import { API_BASE_URL } from "@operoz/constants";
import { APIService } from "@/services/api.service";

export type TRagPageIndexStatus = {
  status: "disabled" | "empty" | "not_indexed" | "pending" | "processing" | "indexed" | "failed" | "stale";
  chunk_count: number;
  updated_at: string | null;
  error: string | null;
  message_key: string;
  estimated_seconds_remaining: number | null;
  eta_at: string | null;
  last_index_duration_seconds: number | null;
};

/** Estado da indexação RAG de uma página. Único resquício do assistant: o chat foi removido. */
export class RagService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getPageIndexStatus(workspaceSlug: string, projectId: string, pageId: string): Promise<TRagPageIndexStatus> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/pages/${pageId}/assistant-index-status/`)
      .then((res) => res?.data as TRagPageIndexStatus)
      .catch((error) => {
        throw error?.response;
      });
  }
}
