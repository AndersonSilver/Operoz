import { Outlet } from "react-router";
import { ProjectViewShell } from "@/components/project/project-view-shell";
import { ProjectStatusReportHeader } from "./header";

export default function ProjectStatusReportLayout() {
  return (
    <ProjectViewShell header={<ProjectStatusReportHeader />}>
      <Outlet />
    </ProjectViewShell>
  );
}
