// plane imports
import { API_BASE_URL } from "@operis/constants";
import type { TInboxIssue, TIssue, TInboxIssueWithPagination, THubMode } from "@operis/types";
import { EInboxIssueSource, EHubMode } from "@operis/types";
// helpers
// services
import { APIService } from "@/services/api.service";

export class InboxIssueService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string, projectId: string, params = {}): Promise<TInboxIssueWithPagination> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/inbox-issues/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieve(workspaceSlug: string, projectId: string, inboxIssueId: string): Promise<TInboxIssue> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/inbox-issues/${inboxIssueId}/?expand=issue_inbox`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(
    workspaceSlug: string,
    projectId: string,
    data: Partial<TIssue>,
    options?: { ticket_kind?: THubMode }
  ): Promise<TInboxIssue> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/inbox-issues/`, {
      source: EInboxIssueSource.IN_APP,
      ticket_kind: options?.ticket_kind ?? EHubMode.INTAKE,
      issue: data,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    projectId: string,
    inboxIssueId: string,
    data: Partial<TInboxIssue>
  ): Promise<TInboxIssue> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/inbox-issues/${inboxIssueId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateIssue(
    workspaceSlug: string,
    projectId: string,
    inboxIssueId: string,
    data: Partial<TIssue>
  ): Promise<TInboxIssue> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/inbox-issues/${inboxIssueId}/`, {
      issue: data,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async destroy(
    workspaceSlug: string,
    projectId: string,
    inboxIssueId: string,
    data?: { delete_reason: string }
  ): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/inbox-issues/${inboxIssueId}/`, {
      data,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
