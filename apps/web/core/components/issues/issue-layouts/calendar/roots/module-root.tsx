import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EIssuesStoreType } from "@operoz/types";
import { useIssues } from "@/hooks/store/use-issues";
import { ModuleIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseCalendarRoot } from "../base-calendar-root";

export const ModuleCalendarLayout = observer(function ModuleCalendarLayout() {
  const { workspaceSlug, projectId, moduleId } = useParams();
  const {
    issues: { addIssuesToModule },
  } = useIssues(EIssuesStoreType.MODULE);

  const addIssuesToView = useCallback(
    (issueIds: string[]) => {
      if (!workspaceSlug || !projectId || !moduleId) throw new Error();
      return addIssuesToModule(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), issueIds);
    },
    [addIssuesToModule, workspaceSlug, projectId, moduleId]
  );

  if (!moduleId) return null;

  return (
    <BaseCalendarRoot
      QuickActions={ModuleIssueQuickActions}
      addIssuesToView={addIssuesToView}
      viewId={moduleId.toString()}
    />
  );
});
