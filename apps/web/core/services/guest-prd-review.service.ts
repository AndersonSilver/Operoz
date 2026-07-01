import { API_BASE_URL } from "@operoz/constants";

export type TPrdReviewSession = {
  id: string;
  page_id: string;
  page_version_id: string | null;
  page_version?: { id: string; last_saved_at: string | null } | null;
  project_id: string;
  status: "draft" | "sent" | "approved" | "changes_requested";
  sent_at: string | null;
  resolved_at: string | null;
  created_at: string | null;
  comment_count: number;
  invite_count: number;
  comments?: TPrdReviewComment[];
  events?: TPrdReviewEvent[];
  invites?: TPrdReviewInvite[];
};

export type TPrdReviewComment = {
  id: string;
  type: "section" | "inline";
  section_id: string;
  quote: string;
  anchor: Record<string, unknown>;
  body: string;
  author_email: string;
  created_at?: string | null;
};

export type TPrdReviewInvite = {
  id: string;
  email: string;
  token: string;
  url: string;
  expires_at: string;
  revoked_at: string | null;
  last_access_at: string | null;
  access_count: number;
};

export type TPrdReviewEvent = {
  id: string;
  event_type: string;
  actor_email: string;
  payload: Record<string, unknown>;
  created_at: string | null;
};

export type TGuestPrdReviewResponse = {
  session: TPrdReviewSession;
  page: {
    id: string;
    name: string;
    description_html: string;
    render_html: string;
    render_mode: "html_embed" | "page_description";
  };
  guest_email: string;
  expires_at: string;
  section_comments: Record<string, { id: string; title: string; text: string; author_email: string }>;
  inline_comments: Array<{
    id: string;
    sectionId: string;
    sectionTitle: string;
    quote: string;
    text: string;
    author_email: string;
  }>;
};

export async function fetchGuestPrdReview(token: string): Promise<TGuestPrdReviewResponse> {
  const response = await fetch(`${API_BASE_URL}/api/guest/prd-review/${encodeURIComponent(token)}/`, {
    credentials: "omit",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw { status: response.status, ...(data as object) };
  }
  return data as TGuestPrdReviewResponse;
}

export async function submitGuestPrdReview(token: string, action: "approve" | "feedback", summary?: string) {
  const response = await fetch(`${API_BASE_URL}/api/guest/prd-review/${encodeURIComponent(token)}/submit/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    body: JSON.stringify({ action, summary: summary || "" }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw { status: response.status, ...(data as object) };
  }
  return data;
}

export async function postGuestPrdReviewComment(
  token: string,
  payload: {
    type?: "section" | "inline";
    section_id: string;
    body: string;
    quote?: string;
    anchor?: Record<string, unknown>;
    comment_id?: string;
  }
) {
  const response = await fetch(`${API_BASE_URL}/api/guest/prd-review/${encodeURIComponent(token)}/comments/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw { status: response.status, ...(data as object) };
  }
  return data;
}

export async function deleteGuestPrdReviewComment(token: string, commentId: string) {
  const response = await fetch(`${API_BASE_URL}/api/guest/prd-review/${encodeURIComponent(token)}/comments/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "omit",
    body: JSON.stringify({ delete: true, comment_id: commentId }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw { status: response.status, ...(data as object) };
  }
  return data as TGuestPrdReviewResponse;
}

export async function updateGuestPrdReviewComment(
  token: string,
  payload: {
    type?: "section" | "inline";
    section_id: string;
    body: string;
    quote?: string;
    comment_id: string;
  }
) {
  return postGuestPrdReviewComment(token, payload);
}
