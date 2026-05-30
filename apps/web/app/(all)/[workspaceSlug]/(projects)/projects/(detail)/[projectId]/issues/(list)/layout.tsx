/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";
import { ProjectViewShell } from "@/components/project/project-view-shell";
import { ProjectIssuesHeader } from "./header";
import { ProjectIssuesMobileHeader } from "./mobile-header";

export default function ProjectIssuesLayout() {
  return (
    <ProjectViewShell header={<ProjectIssuesHeader />} mobileHeader={<ProjectIssuesMobileHeader />}>
      <Outlet />
    </ProjectViewShell>
  );
}
