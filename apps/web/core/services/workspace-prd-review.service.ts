import { API_BASE_URL } from "@operoz/constants";
import { APIService } from "@/services/api.service";

export type TPrdReviewInboxItem = {
  id: string;
  page_id: string;
  page_name: string;
  project_id: string;
  project_name: string;
  project_identifier: string;
  board_slug: string | null;
  page_version_id: string | null;
  page_version?: { id: string; last_saved_at: string | null } | null;
  status: string;
  sent_at: string | null;
  resolved_at: string | null;
  created_at: string | null;
  comment_count: number;
  invite_count: number;
};

export type TPrdReviewMetrics = {
  total_sessions: number;
  by_status: Record<string, number>;
  pending_feedback: number;
  approval_rate: number | null;
  recent_30d_approval_rate: number | null;
  avg_hours_to_resolve: number | null;
  rounds_avg: number;
};

export class WorkspacePrdReviewService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchInbox(
    workspaceSlug: string,
    params?: { status?: string; project_id?: string; limit?: number }
  ): Promise<{ items: TPrdReviewInboxItem[]; count: number }> {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.project_id) search.set("project_id", params.project_id);
    if (params?.limit) search.set("limit", String(params.limit));
    const qs = search.toString();
    return this.get(`/api/workspaces/${workspaceSlug}/prd-review-inbox${qs ? `?${qs}` : ""}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchMetrics(workspaceSlug: string): Promise<TPrdReviewMetrics> {
    return this.get(`/api/workspaces/${workspaceSlug}/prd-review-metrics/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
