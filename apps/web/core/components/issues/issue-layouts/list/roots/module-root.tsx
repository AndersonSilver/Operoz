import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EIssuesStoreType } from "@operis/types";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
// local imports — mesmo root da lista do board (WorkspaceListRoot)
import { WorkspaceListRoot } from "./workspace-root";

export const ModuleListLayout = observer(function ModuleListLayout() {
  const { workspaceSlug, projectId, moduleId } = useParams();
  const { issues } = useIssues(EIssuesStoreType.MODULE);

  const workspaceSlugStr = workspaceSlug?.toString();
  const moduleIdStr = moduleId?.toString();

  if (!workspaceSlugStr || !moduleIdStr) return null;

  return (
    <WorkspaceListRoot
      isLoading={false}
      workspaceSlug={workspaceSlugStr}
      globalViewId={moduleIdStr}
      issuesLoading={false}
      addIssuesToView={(issueIds: string[]) => {
        if (!projectId) throw new Error();
        return issues.addIssuesToModule(
          workspaceSlugStr,
          projectId.toString(),
          moduleIdStr,
          issueIds
        );
      }}
    />
  );
});
