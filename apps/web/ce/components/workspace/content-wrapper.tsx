import React from "react";
import { observer } from "mobx-react";
import { useLocation } from "react-router";
// plane imports
import { cn } from "@operis/utils";
import { useWorkspaceImmersiveChrome } from "@/components/board/project-board-background-root";
import { AppRailRoot } from "@/components/navigation";
import { useAppRailVisibility } from "@/lib/app-rail";
// local imports
import { TopNavigationRoot } from "../navigations";

export const WorkspaceContentWrapper = observer(function WorkspaceContentWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const isBoardHubImmersive = useWorkspaceImmersiveChrome();
  // Use the context to determine if app rail should render
  const { shouldRenderAppRail } = useAppRailVisibility();

  return (
    <div
      className={cn(
        "relative flex size-full flex-col overflow-hidden transition-all duration-300 ease-in-out",
        isBoardHubImmersive ? "bg-transparent" : "bg-canvas"
      )}
    >
      <TopNavigationRoot />
      <div className="relative flex size-full overflow-hidden">
        {/* Conditionally render AppRailRoot based on context */}
        {shouldRenderAppRail && <AppRailRoot />}
        <div
          className={cn(
            "relative size-full flex-grow overflow-hidden transition-all duration-300 ease-in-out",
            isBoardHubImmersive ? "p-0" : "pr-2 pb-2 pl-2",
            {
              "pl-0!": shouldRenderAppRail && !isBoardHubImmersive,
            }
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
});
