// local components
import { useProjectNavigationPreferences } from "@/hooks/use-navigation-preferences";
import { BoardBreadcrumb } from "./board";
import { ProjectBreadcrumb } from "./project";

type TCommonProjectBreadcrumbProps = {
  workspaceSlug: string;
  projectId: string;
};

export function CommonProjectBreadcrumbs(props: TCommonProjectBreadcrumbProps) {
  const { workspaceSlug, projectId } = props;
  const { preferences: projectPreferences } = useProjectNavigationPreferences();

  if (projectPreferences.navigationMode === "TABBED") return null;
  return (
    <>
      <BoardBreadcrumb workspaceSlug={workspaceSlug} projectId={projectId} />
      <ProjectBreadcrumb workspaceSlug={workspaceSlug} projectId={projectId} />
    </>
  );
}
