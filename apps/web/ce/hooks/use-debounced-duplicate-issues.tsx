import type { TDeDupeIssue } from "@operis/types";

export const useDebouncedDuplicateIssues = (
  _workspaceSlug: string | undefined,
  _workspaceId: string | undefined,
  _projectId: string | undefined,
  _formData: { name: string | undefined; description_html?: string | undefined; issueId?: string | undefined }
) => {
  const duplicateIssues: TDeDupeIssue[] = [];

  return { duplicateIssues };
};
