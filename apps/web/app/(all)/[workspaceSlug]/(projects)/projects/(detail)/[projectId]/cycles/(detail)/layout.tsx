import { Outlet } from "react-router";
// components
import { ProjectViewShell } from "@/components/project/project-view-shell";
import { CycleIssuesHeader } from "./header";
import { CycleIssuesMobileHeader } from "./mobile-header";

export default function ProjectCycleIssuesLayout() {
  return (
    <ProjectViewShell
      header={<CycleIssuesHeader />}
      mobileHeader={<CycleIssuesMobileHeader />}
      rowClassName="h-auto min-h-14 items-center px-4 py-2.5"
    >
      <Outlet />
    </ProjectViewShell>
  );
}
