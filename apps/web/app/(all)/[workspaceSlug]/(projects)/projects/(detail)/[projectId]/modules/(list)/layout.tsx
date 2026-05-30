import { Outlet } from "react-router";
import { ProjectViewShell } from "@/components/project/project-view-shell";
import { ModulesListHeader } from "./header";
import { ModulesListMobileHeader } from "./mobile-header";

export default function ProjectModulesListLayout() {
  return (
    <ProjectViewShell header={<ModulesListHeader />} mobileHeader={<ModulesListMobileHeader />}>
      <Outlet />
    </ProjectViewShell>
  );
}
