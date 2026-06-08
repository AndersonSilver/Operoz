import { Outlet } from "react-router";
import { ProjectViewShell } from "@/components/project/project-view-shell";
import { PagesListHeader } from "./header";

export default function ProjectPagesListLayout() {
  return (
    <ProjectViewShell header={<PagesListHeader />}>
      <Outlet />
    </ProjectViewShell>
  );
}
