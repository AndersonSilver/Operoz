import { API_BASE_URL } from "@operoz/constants";

export type TClient360GuestQbrResponse = {
  title: string;
  workspace_name: string;
  scope: "portfolio" | "client";
  period_start: string;
  period_end: string;
  expires_at: string;
  markdown: string;
  html: string;
  summary: Record<string, number>;
  wins: string[];
  risks: string[];
  chart_warnings: string[];
};

export type TClient360QbrGuestLink = {
  id: string;
  scope: "portfolio" | "client";
  token: string;
  url: string;
  expires_at: string;
  revoked_at: string | null;
  period_start: string;
  period_end: string;
  weeks: number;
  include_compare: boolean;
  project_id: string | null;
  access_count: number;
  last_accessed_at: string | null;
  created_at: string | null;
};

export async function fetchGuestQbr(token: string): Promise<TClient360GuestQbrResponse> {
  const response = await fetch(`${API_BASE_URL}/api/guest/client-360/qbr/${encodeURIComponent(token)}/`, {
    credentials: "omit",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw { status: response.status, ...(data as object) };
  }
  return data as TClient360GuestQbrResponse;
}
