import { EHubMode } from "@operoz/types";

export function getInboxHubBasePath(workspaceSlug: string, projectId: string, hubMode: EHubMode): string {
  const segment = hubMode === EHubMode.SUPPORT ? "sustentacao" : "intake";
  return `/${workspaceSlug}/projects/${projectId}/${segment}`;
}

export function getInboxHubIssueUrl(
  workspaceSlug: string,
  projectId: string,
  hubMode: EHubMode,
  params?: { currentTab?: string; inboxIssueId?: string }
): string {
  const base = getInboxHubBasePath(workspaceSlug, projectId, hubMode);
  const search = new URLSearchParams();
  if (params?.currentTab) search.set("currentTab", params.currentTab);
  if (params?.inboxIssueId) search.set("inboxIssueId", params.inboxIssueId);
  const query = search.toString();
  return query ? `${base}?${query}` : base;
}

export function getInboxScopeKey(projectId: string, hubMode: EHubMode): string {
  return `${projectId}:${hubMode}`;
}

export function getPendingCountKey(hubMode: EHubMode): "intake_count" | "support_count" {
  return hubMode === EHubMode.SUPPORT ? "support_count" : "intake_count";
}
