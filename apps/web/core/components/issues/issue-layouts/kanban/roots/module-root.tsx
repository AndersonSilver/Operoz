/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EIssuesStoreType } from "@plane/types";
import { useIssues } from "@/hooks/store/use-issues";
import { WorkspaceKanbanRoot } from "./workspace-root";

export const ModuleKanBanLayout = observer(function ModuleKanBanLayout() {
  const { workspaceSlug, projectId, moduleId } = useParams();
  const { issues } = useIssues(EIssuesStoreType.MODULE);

  const moduleIdStr = moduleId?.toString();

  if (!moduleIdStr) return null;

  return (
    <WorkspaceKanbanRoot
      viewId={moduleIdStr}
      addIssuesToView={(issueIds: string[]) => {
        if (!workspaceSlug || !projectId) throw new Error();
        return issues.addIssuesToModule(
          workspaceSlug.toString(),
          projectId.toString(),
          moduleIdStr,
          issueIds
        );
      }}
    />
  );
});
