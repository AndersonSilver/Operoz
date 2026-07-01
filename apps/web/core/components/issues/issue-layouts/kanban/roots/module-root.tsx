import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EUserPermissions, EUserPermissionsLevel } from "@operoz/constants";
import { EIssuesStoreType } from "@operoz/types";
import { useIssues } from "@/hooks/store/use-issues";
import { useUserPermissions } from "@/hooks/store/user";
import { ModuleIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseKanBanRoot } from "../base-kanban-root";

export const ModuleKanBanLayout = observer(function ModuleKanBanLayout() {
  const { workspaceSlug, projectId, moduleId } = useParams();
  const { issues } = useIssues(EIssuesStoreType.MODULE);
  const { allowPermissions } = useUserPermissions();

  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  const canEditIssueProperties = useCallback(() => isEditingAllowed, [isEditingAllowed]);

  const addIssuesToView = useCallback(
    (issueIds: string[]) => {
      if (!workspaceSlug || !projectId || !moduleId) throw new Error();
      return issues.addIssuesToModule(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), issueIds);
    },
    [issues, workspaceSlug, projectId, moduleId]
  );

  if (!moduleId) return null;

  return (
    <BaseKanBanRoot
      QuickActions={ModuleIssueQuickActions}
      addIssuesToView={addIssuesToView}
      canEditPropertiesBasedOnProject={canEditIssueProperties}
      viewId={moduleId.toString()}
    />
  );
});
