import { Outlet } from "react-router";
import { EHubMode } from "@operis/types";
import { ProjectViewShell } from "@/components/project/project-view-shell";
import { ProjectInboxHeader } from "@/plane-web/components/projects/settings/intake/header";

export default function ProjectSupportLayout() {
  return (
    <ProjectViewShell header={<ProjectInboxHeader hubMode={EHubMode.SUPPORT} />}>
      <Outlet />
    </ProjectViewShell>
  );
}
