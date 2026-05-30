/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { PriorityIcon, StateGroupIcon } from "@plane/propel/icons";
import type { TIssue } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { generateWorkItemLink } from "@plane/utils";
import { ListItem } from "@/components/core/list";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";

type WorkItemRowProps = {
  issue: TIssue;
  workspaceSlug: string;
};

export const WorkItemRow = observer(function WorkItemRow(props: WorkItemRowProps) {
  const { issue, workspaceSlug } = props;
  const { getStateById } = useProjectState();
  const { setPeekIssue } = useIssueDetail();
  const { setPeekIssue: setPeekEpic } = useIssueDetail(EIssueServiceType.EPICS);
  const { getProjectIdentifierById } = useProject();

  const projectIdentifier = getProjectIdentifierById(issue.project_id);
  const state = issue.state_id ? getStateById(issue.state_id) : undefined;

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: issue.project_id,
    issueId: issue.id,
    projectIdentifier,
    sequenceId: issue.sequence_id,
    isEpic: issue.is_epic,
  });

  const handlePeekOverview = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const peekDetails = {
      workspaceSlug,
      projectId: issue.project_id,
      issueId: issue.id,
    };
    if (issue.is_epic) setPeekEpic(peekDetails);
    else setPeekIssue(peekDetails);
  };

  return (
    <ListItem
      key={issue.id}
      id={`home-issue-${issue.id}`}
      itemLink={workItemLink}
      title={issue.name}
      prependTitleElement={
        <div className="flex flex-shrink-0 items-center gap-2">
          {issue.type_id ? (
            <IssueIdentifier
              size="lg"
              projectId={issue.project_id || ""}
              projectIdentifier={projectIdentifier || ""}
              issueSequenceId={issue.sequence_id}
              variant="tertiary"
            />
          ) : (
            <span className="text-11 text-tertiary">
              {projectIdentifier}-{issue.sequence_id}
            </span>
          )}
          {state && <StateGroupIcon stateGroup={state.group} color={state.color} className="size-4" />}
          <PriorityIcon priority={issue.priority} withContainer size={12} />
        </div>
      }
      appendTitleElement={
        issue.target_date ? (
          <span className="whitespace-nowrap text-11 text-tertiary">{issue.target_date}</span>
        ) : undefined
      }
      onItemClick={handlePeekOverview}
    />
  );
});
