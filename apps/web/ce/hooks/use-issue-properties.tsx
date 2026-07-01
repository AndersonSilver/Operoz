import type { TIssueServiceType } from "@operoz/types";

export const useWorkItemProperties = (
  projectId: string | null | undefined,
  workspaceSlug: string | null | undefined,
  workItemId: string | null | undefined,
  _issueServiceType: TIssueServiceType
) => {
  if (!projectId || !workspaceSlug || !workItemId) return;
};
