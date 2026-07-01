import { observer } from "mobx-react";
import { Outlet } from "react-router";
import { cn } from "@operoz/utils";
import { useWorkspaceImmersiveChrome } from "@/components/board/project-board-background-root";
import { ProjectsAppPowerKProvider } from "@/components/power-k/projects-app-provider";
// plane web components
import { ProjectAppSidebar } from "./_sidebar";
import { ExtendedProjectSidebar } from "./extended-project-sidebar";

function WorkspaceLayout() {
  const isBoardHubImmersive = useWorkspaceImmersiveChrome();

  return (
    <>
      <ProjectsAppPowerKProvider />
      <div
        className={cn(
          "relative flex h-full w-full flex-col overflow-hidden",
          !isBoardHubImmersive && "rounded-lg border border-subtle"
        )}
      >
        <div id="full-screen-portal" className="absolute inset-0 w-full" />
        <div className="relative flex min-w-0 flex-1 flex-row overflow-hidden">
          <ProjectAppSidebar />
          <ExtendedProjectSidebar />
          <main
            className={cn(
              "relative flex h-full min-w-0 flex-1 flex-col overflow-hidden",
              isBoardHubImmersive ? "bg-transparent" : "bg-surface-1"
            )}
          >
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}

export default observer(WorkspaceLayout);
