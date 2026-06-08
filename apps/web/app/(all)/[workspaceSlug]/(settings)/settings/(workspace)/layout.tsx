import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { Outlet } from "react-router";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { getWorkspaceActivePath, isBoardDetailSettingsPath, pathnameToAccessKey } from "@/components/settings/helper";
import { SettingsMobileNav } from "@/components/settings/mobile/nav";
// plane imports
import { WORKSPACE_SETTINGS_ACCESS } from "@operis/constants";
import type { EUserWorkspaceRoles } from "@operis/types";
// components
import { AuxiliaryCollapsibleSidebar } from "@/components/sidebar/auxiliary-collapsible-sidebar";
import { WorkspaceSettingsSidebarRoot } from "@/components/settings/workspace/sidebar";
import { SETTINGS_SIDEBAR_WIDTH } from "@/constants/collapsible-sidebar";
// hooks
import { useUserPermissions } from "@/hooks/store/user";

import type { Route } from "./+types/layout";

const WorkspaceSettingLayout = observer(function WorkspaceSettingLayout({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  // store hooks
  const { workspaceUserInfo, getWorkspaceRoleByWorkspaceSlug } = useUserPermissions();
  // next hooks
  const pathname = usePathname();
  // derived values
  const { accessKey } = pathnameToAccessKey(pathname);
  const userWorkspaceRole = getWorkspaceRoleByWorkspaceSlug(workspaceSlug);

  let isAuthorized: boolean | string = false;
  if (pathname && workspaceSlug && userWorkspaceRole) {
    isAuthorized = WORKSPACE_SETTINGS_ACCESS[accessKey]?.includes(userWorkspaceRole as EUserWorkspaceRoles);
  }

  const hideWorkspaceSidebar = Boolean(pathname && isBoardDetailSettingsPath(pathname));

  return (
    <>
      {!hideWorkspaceSidebar && (
        <SettingsMobileNav
          hamburgerContent={WorkspaceSettingsSidebarRoot}
          activePath={getWorkspaceActivePath(pathname) || ""}
        />
      )}
      <div className="flex h-full w-full min-w-0 flex-row">
        {workspaceUserInfo && !isAuthorized ? (
          <NotAuthorizedView section="settings" className="h-auto" />
        ) : (
          <>
            {!hideWorkspaceSidebar && (
              <div className="hidden h-full shrink-0 md:block">
                <AuxiliaryCollapsibleSidebar storageKey="workspace_settings_sidebar_pinned" width={SETTINGS_SIDEBAR_WIDTH}>
                  <WorkspaceSettingsSidebarRoot className="h-full border-r-0" />
                </AuxiliaryCollapsibleSidebar>
              </div>
            )}
            <main className="min-w-0 flex-1 overflow-hidden">
              <Outlet />
            </main>
          </>
        )}
      </div>
    </>
  );
});

export default WorkspaceSettingLayout;
