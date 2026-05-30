import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EIssuesStoreType } from "@operis/types";
import { useIssues } from "@/hooks/store/use-issues";
import { WorkspaceCalendarRoot } from "./workspace-calendar-root";

export const ModuleCalendarLayout = observer(function ModuleCalendarLayout() {
  const { workspaceSlug, projectId, moduleId } = useParams();
  const {
    issues: { addIssuesToModule },
  } = useIssues(EIssuesStoreType.MODULE);

  const moduleIdStr = moduleId?.toString();

  const addIssuesToView = useCallback(
    (issueIds: string[]) => {
      if (!workspaceSlug || !projectId || !moduleIdStr) throw new Error();
      return addIssuesToModule(workspaceSlug.toString(), projectId.toString(), moduleIdStr, issueIds);
    },
    [addIssuesToModule, workspaceSlug, projectId, moduleIdStr]
  );

  if (!moduleIdStr) return null;

  return <WorkspaceCalendarRoot viewId={moduleIdStr} addIssuesToView={addIssuesToView} />;
});
