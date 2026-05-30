/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";
import { ProjectViewShell } from "@/components/project/project-view-shell";
import { ProjectInboxHeader } from "@/plane-web/components/projects/settings/intake/header";

export default function ProjectInboxIssuesLayout() {
  return (
    <ProjectViewShell header={<ProjectInboxHeader />}>
      <Outlet />
    </ProjectViewShell>
  );
}
