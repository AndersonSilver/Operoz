import { Outlet } from "react-router";
import { ProjectViewShell } from "@/components/project/project-view-shell";
import { ProjectViewsHeader } from "./header";
import { ViewMobileHeader } from "./mobile-header";

export default function ProjectViewsListLayout() {
  return (
    <ProjectViewShell header={<ProjectViewsHeader />} mobileHeader={<ViewMobileHeader />}>
      <Outlet />
    </ProjectViewShell>
  );
}
