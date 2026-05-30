import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import type { TIssue } from "@operis/types";
import { useUserPermissions } from "@/hooks/store/user";
import { AllIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseKanBanRoot } from "../base-kanban-root";

type Props = {
  viewId: string;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
};

export const WorkspaceKanbanRoot = observer(function WorkspaceKanbanRoot(props: Props) {
  const { viewId, addIssuesToView } = props;
  const { workspaceSlug } = useParams();
  const { allowPermissions } = useUserPermissions();

  const canEditPropertiesBasedOnProject = (projectId: string) =>
    allowPermissions(
      [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
      EUserPermissionsLevel.PROJECT,
      workspaceSlug?.toString() ?? "",
      projectId
    );

  return (
    <BaseKanBanRoot
      QuickActions={AllIssueQuickActions}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
      addIssuesToView={addIssuesToView}
      viewId={viewId}
    />
  );
});
