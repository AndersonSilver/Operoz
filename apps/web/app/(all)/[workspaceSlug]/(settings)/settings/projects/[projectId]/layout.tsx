import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { Outlet } from "react-router";
// components
import { getProjectActivePath } from "@/components/settings/helper";
import { SettingsMobileNav } from "@/components/settings/mobile/nav";
// layouts
import { ProjectAuthWrapper } from "@/layouts/auth-layout/project-wrapper";
// types
import type { Route } from "./+types/layout";
import { AuxiliaryCollapsibleSidebar } from "@/components/sidebar/auxiliary-collapsible-sidebar";
import { ProjectSettingsSidebarRoot } from "@/components/settings/project/sidebar";
import { SETTINGS_SIDEBAR_WIDTH } from "@/constants/collapsible-sidebar";

function ProjectDetailSettingsLayout({ params }: Route.ComponentProps) {
  const { workspaceSlug, projectId } = params;
  // router
  const pathname = usePathname();

  return (
    <>
      <SettingsMobileNav
        hamburgerContent={(props) => <ProjectSettingsSidebarRoot {...props} projectId={projectId} />}
        activePath={getProjectActivePath(pathname) || ""}
      />
      <div className="flex h-full w-full min-w-0 flex-row">
        <div className="hidden h-full shrink-0 md:block">
          <AuxiliaryCollapsibleSidebar
            storageKey={`project_settings_sidebar_pinned_${projectId}`}
            width={SETTINGS_SIDEBAR_WIDTH}
          >
            <ProjectSettingsSidebarRoot projectId={projectId} className="h-full border-r-0" />
          </AuxiliaryCollapsibleSidebar>
        </div>
        <main className="min-w-0 flex-1 overflow-hidden">
          <ProjectAuthWrapper workspaceSlug={workspaceSlug} projectId={projectId}>
            <Outlet />
          </ProjectAuthWrapper>
        </main>
      </div>
    </>
  );
}

export default observer(ProjectDetailSettingsLayout);
