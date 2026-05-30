import { Outlet } from "react-router";
import { ProjectViewShell } from "@/components/project/project-view-shell";
import { ProjectViewIssuesHeader } from "./[viewId]/header";

export default function ProjectViewIssuesLayout() {
  return (
    <ProjectViewShell header={<ProjectViewIssuesHeader />}>
      <Outlet />
    </ProjectViewShell>
  );
}
