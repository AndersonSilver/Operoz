/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
