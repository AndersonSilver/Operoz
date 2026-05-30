import { useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EIssuesStoreType } from "@operis/types";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { WorkspaceSpreadsheetRoot } from "./workspace-root";

export const ModuleSpreadsheetLayout = observer(function ModuleSpreadsheetLayout() {
  const { workspaceSlug, projectId, moduleId } = useParams();
  const { fetchNextIssues } = useIssuesActions(EIssuesStoreType.MODULE);

  const workspaceSlugStr = workspaceSlug?.toString();
  const moduleIdStr = moduleId?.toString();
  const projectIdStr = projectId?.toString();

  const fetchNextPages = useCallback(() => {
    if (!workspaceSlugStr || !projectIdStr || !moduleIdStr) return;
    void fetchNextIssues(workspaceSlugStr, projectIdStr, moduleIdStr);
  }, [fetchNextIssues, workspaceSlugStr, projectIdStr, moduleIdStr]);

  if (!workspaceSlugStr || !moduleIdStr) return null;

  return (
    <WorkspaceSpreadsheetRoot
      isDefaultView={false}
      isLoading={false}
      toggleLoading={() => undefined}
      workspaceSlug={workspaceSlugStr}
      globalViewId={moduleIdStr}
      routeFilters={{}}
      fetchNextPages={fetchNextPages}
      globalViewsLoading={false}
      issuesLoading={false}
    />
  );
});
