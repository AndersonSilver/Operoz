import { Outlet } from "react-router";
import { ProjectViewShell } from "@/components/project/project-view-shell";
import { ModuleIssuesHeader } from "./header";
import { ModuleIssuesMobileHeader } from "./mobile-header";

export default function ProjectModuleIssuesLayout() {
  return (
    <ProjectViewShell
      header={<ModuleIssuesHeader />}
      mobileHeader={<ModuleIssuesMobileHeader />}
      rowClassName="h-auto min-h-11 items-center"
    >
      <Outlet />
    </ProjectViewShell>
  );
}
