import { WorkItemCustomFieldsProperties } from "./work-item-custom-fields-properties";

export type TWorkItemAdditionalSidebarProperties = {
  workItemId: string;
  workItemTypeId: string | null;
  projectId: string;
  workspaceSlug: string;
  isEditable: boolean;
  isPeekView?: boolean;
};

export function WorkItemAdditionalSidebarProperties(props: TWorkItemAdditionalSidebarProperties) {
  const { workItemId, projectId, workspaceSlug, isEditable } = props;

  return (
    <WorkItemCustomFieldsProperties
      workspaceSlug={workspaceSlug}
      projectId={projectId}
      issueId={workItemId}
      isEditable={isEditable}
      layout="sidebar"
    />
  );
}
