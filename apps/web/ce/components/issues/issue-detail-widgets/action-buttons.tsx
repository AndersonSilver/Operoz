// plane types
import type { TIssueServiceType, TWorkItemWidgets } from "@operis/types";

export type TWorkItemAdditionalWidgetActionButtonsProps = {
  disabled: boolean;
  hideWidgets: TWorkItemWidgets[];
  issueServiceType: TIssueServiceType;
  projectId: string;
  workItemId: string;
  workspaceSlug: string;
};

export function WorkItemAdditionalWidgetActionButtons(_props: TWorkItemAdditionalWidgetActionButtonsProps) {
  return null;
}
