/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { ENABLE_WORKSPACE_BOARDS } from "@/constants/enable-boards";
import { useAnalytics } from "@/hooks/store/use-analytics";
import { useProject } from "@/hooks/store/use-project";
import { AnalyticsBoardSelect } from "./select/board";
import { ProjectSelect } from "./select/project";

const AnalyticsFilterActions = observer(function AnalyticsFilterActions() {
  const { selectedProjects, selectedBoardId, updateSelectedProjects, updateSelectedBoard } = useAnalytics();
  const { joinedProjectIds } = useProject();

  return (
    <div className="flex items-center justify-end gap-2">
      {ENABLE_WORKSPACE_BOARDS && (
        <AnalyticsBoardSelect value={selectedBoardId} onChange={updateSelectedBoard} />
      )}
      <ProjectSelect
        value={selectedProjects}
        onChange={(val) => {
          updateSelectedProjects(val ?? []);
        }}
        projectIds={joinedProjectIds}
      />
    </div>
  );
});

export default AnalyticsFilterActions;
