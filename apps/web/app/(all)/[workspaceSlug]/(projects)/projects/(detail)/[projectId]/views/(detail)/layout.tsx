import { Outlet } from "react-router";
import { ProjectViewShell } from "@/components/project/project-view-shell";
import { ProjectViewIssuesHeader } from "./[viewId]/header";

export default function ProjectViewIssuesLayout() {
  return (
    <ProjectViewShell header={<ProjectViewIssuesHeader />} rowClassName="h-auto min-h-11 items-center">
      <Outlet />
    </ProjectViewShell>
  );
}
