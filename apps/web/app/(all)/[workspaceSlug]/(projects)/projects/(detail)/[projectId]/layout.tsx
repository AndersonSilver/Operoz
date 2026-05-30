/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Outlet } from "react-router";
// plane imports
import { Header } from "@plane/ui";
// components
import { ProjectBoardBackgroundRoot, ProjectTabNavigationChrome } from "@/components/board/project-board-background-root";
import { TabNavigationRoot } from "@/components/navigation/tab-navigation-root";
// hooks
import { useProjectNavigationPreferences } from "@/hooks/use-navigation-preferences";
// layouts
import { ProjectAuthWrapper } from "@/layouts/auth-layout/project-wrapper";
// local imports
import type { Route } from "./+types/layout";

function ProjectLayout({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, projectId } = params;
  // preferences
  const { preferences: projectPreferences } = useProjectNavigationPreferences();

  return (
    <ProjectAuthWrapper workspaceSlug={workspaceSlug} projectId={projectId}>
      <ProjectBoardBackgroundRoot workspaceSlug={workspaceSlug} projectId={projectId}>
        {projectPreferences.navigationMode === "TABBED" && (
          <ProjectTabNavigationChrome>
            <div className="flex h-full w-full items-center gap-2 divide-x divide-subtle">
              <div className="flex size-full flex-1 items-center gap-2">
                <Header className="h-full pl-1.5">
                  <Header.LeftItem className="flex h-full max-w-full items-center gap-2">
                    <TabNavigationRoot workspaceSlug={workspaceSlug} projectId={projectId} />
                  </Header.LeftItem>
                </Header>
              </div>
            </div>
          </ProjectTabNavigationChrome>
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </ProjectBoardBackgroundRoot>
    </ProjectAuthWrapper>
  );
}

export default observer(ProjectLayout);
