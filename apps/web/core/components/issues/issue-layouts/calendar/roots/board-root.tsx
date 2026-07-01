/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useCanEditIssueOnProject } from "@/hooks/use-board-issue-capabilities";
import { AllIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseCalendarRoot } from "../base-calendar-root";

type Props = {
  viewId: string;
};

export const BoardCalendarRoot = observer(function BoardCalendarRoot(props: Props) {
  const { viewId } = props;
  const { workspaceSlug } = useParams();
  const canEditPropertiesBasedOnProject = useCanEditIssueOnProject();

  return (
    <BaseCalendarRoot
      QuickActions={AllIssueQuickActions}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
      viewId={viewId}
    />
  );
});
