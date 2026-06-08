import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { useIssues } from "@/hooks/store/use-issues";
import { useUserPermissions } from "@/hooks/store/user";
import { ModuleIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseSpreadsheetRoot } from "../base-spreadsheet-root";

export const ModuleSpreadsheetLayout = observer(function ModuleSpreadsheetLayout() {
  const { moduleId } = useParams();
  const { allowPermissions } = useUserPermissions();

  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  const canEditIssueProperties = useCallback(() => isEditingAllowed, [isEditingAllowed]);

  if (!moduleId) return null;

  return (
    <BaseSpreadsheetRoot
      QuickActions={ModuleIssueQuickActions}
      canEditPropertiesBasedOnProject={canEditIssueProperties}
      viewId={moduleId.toString()}
    />
  );
});
