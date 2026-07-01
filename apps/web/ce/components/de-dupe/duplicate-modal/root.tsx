// types
import type { TDeDupeIssue } from "@operoz/types";

type TDuplicateModalRootProps = {
  workspaceSlug: string;
  issues: TDeDupeIssue[];
  handleDuplicateIssueModal: (value: boolean) => void;
};

export function DuplicateModalRoot(_props: TDuplicateModalRootProps) {
  return <></>;
}
