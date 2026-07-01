// plane types
import type { TIssueServiceType, TWorkItemWidgets } from "@operoz/types";

export type TWorkItemAdditionalWidgetCollapsiblesProps = {
  disabled: boolean;
  hideWidgets: TWorkItemWidgets[];
  issueServiceType: TIssueServiceType;
  projectId: string;
  workItemId: string;
  workspaceSlug: string;
};

export function WorkItemAdditionalWidgetCollapsibles(_props: TWorkItemAdditionalWidgetCollapsiblesProps) {
  return null;
}
