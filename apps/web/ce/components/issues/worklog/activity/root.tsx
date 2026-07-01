import type { TIssueActivityComment } from "@operoz/types";

type TIssueActivityWorklog = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityComment: TIssueActivityComment;
  ends?: "top" | "bottom";
};

export function IssueActivityWorklog(_props: TIssueActivityWorklog) {
  return <></>;
}
