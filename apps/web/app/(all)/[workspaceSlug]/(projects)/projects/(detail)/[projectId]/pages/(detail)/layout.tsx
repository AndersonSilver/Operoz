import { Outlet } from "react-router";
import useSWR from "swr";
import { ProjectViewShell } from "@/components/project/project-view-shell";
// operoz web hooks
import { EPageStoreType, usePageStore } from "@/operoz-web/hooks/store";
// local components
import type { Route } from "./+types/layout";
import { PageDetailsHeader } from "./header";

export default function ProjectPageDetailsLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  const { fetchPagesList } = usePageStore(EPageStoreType.PROJECT);
  // fetching pages list
  useSWR(`PROJECT_PAGES_${projectId}`, () => fetchPagesList(workspaceSlug, projectId));

  return (
    <ProjectViewShell header={<PageDetailsHeader />}>
      <Outlet />
    </ProjectViewShell>
  );
}
