import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import type { TIssue } from "@operis/types";
import { useUserPermissions } from "@/hooks/store/user";
import { AllIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseCalendarRoot } from "../base-calendar-root";

type Props = {
  viewId: string;
  addIssuesToView?: (issueIds: string[]) => Promise<TIssue>;
};

/** Mesmo root do calendário do board (`BoardCalendarRoot`). */
export const WorkspaceCalendarRoot = observer(function WorkspaceCalendarRoot(props: Props) {
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
    <BaseCalendarRoot
      QuickActions={AllIssueQuickActions}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
      addIssuesToView={addIssuesToView}
      viewId={viewId}
    />
  );
});
