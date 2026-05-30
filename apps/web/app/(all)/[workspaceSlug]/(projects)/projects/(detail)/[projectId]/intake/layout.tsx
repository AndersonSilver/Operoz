import { Outlet } from "react-router";
import { ProjectViewShell } from "@/components/project/project-view-shell";
import { ProjectInboxHeader } from "@/plane-web/components/projects/settings/intake/header";

export default function ProjectInboxIssuesLayout() {
  return (
    <ProjectViewShell header={<ProjectInboxHeader />}>
      <Outlet />
    </ProjectViewShell>
  );
}
