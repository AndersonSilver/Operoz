/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";
import { ProjectViewShell } from "@/components/project/project-view-shell";
import { ModuleIssuesHeader } from "./header";
import { ModuleIssuesMobileHeader } from "./mobile-header";

export default function ProjectModuleIssuesLayout() {
  return (
    <ProjectViewShell
      header={<ModuleIssuesHeader />}
      mobileHeader={<ModuleIssuesMobileHeader />}
      rowClassName="h-auto min-h-11 items-center"
    >
      <Outlet />
    </ProjectViewShell>
  );
}
