import { Outlet } from "react-router";
import { ProjectViewShell } from "@/components/project/project-view-shell";
import { CyclesListHeader } from "./header";
import { CyclesListMobileHeader } from "./mobile-header";

export default function ProjectCyclesListLayout() {
  return (
    <ProjectViewShell header={<CyclesListHeader />} mobileHeader={<CyclesListMobileHeader />}>
      <Outlet />
    </ProjectViewShell>
  );
}
