import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { Popover } from "@operis/propel/popover";
import { Tooltip } from "@operis/propel/tooltip";
import { ControlLink } from "@operis/ui";
import { EIssuesStoreType } from "@operis/types";
import { findTotalDaysInRange, generateWorkItemLink } from "@operis/utils";
// components
import { useGanttSidebarWidth } from "@/components/gantt-chart/contexts/gantt-sidebar-width";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useBoardLayoutOptional } from "@/components/board/board-layout-context";
import { BoardGanttRowIcon } from "@/components/board/gantt/board-gantt-row-icon";
import {
  resolveBoardGanttIssueTypeLogo,
  useBoardGanttIssueTypeLogoMap,
} from "@/components/board/gantt/use-board-gantt-issue-type-logo";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";
import { IssueStats } from "@/plane-web/components/issues/issue-layouts/issue-stats";
// local imports
import { WorkItemPreviewCard } from "../../preview-card";
import { getBlockViewDetails } from "../utils";
import type { GanttStoreType } from "./base-gantt-root";

type Props = {
  issueId: string;
  isEpic?: boolean;
};

export const IssueGanttBlock = observer(function IssueGanttBlock(props: Props) {
  const { issueId, isEpic } = props;
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // store hooks
  const { getProjectStates } = useProjectState();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // hooks
  const { isMobile } = usePlatformOS();
  const { handleRedirection } = useIssuePeekOverviewRedirection(isEpic);

  // derived values
  const issueDetails = getIssueById(issueId);
  const stateDetails =
    issueDetails && getProjectStates(issueDetails?.project_id)?.find((state) => state?.id == issueDetails?.state_id);

  const { blockStyle } = getBlockViewDetails(issueDetails, stateDetails?.color ?? "");

  const handleIssuePeekOverview = () => handleRedirection(workspaceSlug, issueDetails, isMobile);

  const duration = findTotalDaysInRange(issueDetails?.start_date, issueDetails?.target_date) || 0;
  const { sidebarWidth } = useGanttSidebarWidth();

  return (
    <Popover delay={100} openOnHover>
      <Popover.Button
        className="w-full"
        render={
          <div
            id={`issue-${issueId}`}
            className="space-between relative flex h-full w-full cursor-pointer items-center rounded-sm"
            style={blockStyle}
            onClick={handleIssuePeekOverview}
          >
            <div className="absolute top-0 left-0 h-full w-full bg-surface-1/50" />
            <div
              className="sticky w-auto flex-1 truncate overflow-hidden px-2.5 py-1 text-13 text-primary"
              style={{ left: `${sidebarWidth}px` }}
            >
              {issueDetails?.name}
            </div>
            {isEpic && (
              <IssueStats
                issueId={issueId}
                className="sticky mx-2 w-auto flex-shrink-0 justify-end truncate overflow-hidden font-medium text-primary"
                showProgressText={duration >= 2}
              />
            )}
          </div>
        }
      />
      <Popover.Panel side="bottom" align="start">
        <>
          {issueDetails && issueDetails?.project_id && (
            <WorkItemPreviewCard
              projectId={issueDetails.project_id}
              stateDetails={{
                id: issueDetails.state_id ?? undefined,
              }}
              workItem={issueDetails}
            />
          )}
        </>
      </Popover.Panel>
    </Popover>
  );
});

// rendering issues on gantt sidebar
export const IssueGanttSidebarBlock = observer(function IssueGanttSidebarBlock(props: Props) {
  const { issueId, isEpic = false } = props;
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { isMobile } = usePlatformOS();
  const storeType = useIssueStoreType() as GanttStoreType;
  const { issuesFilter, issues: issuesStore } = useIssues(storeType);
  const { getProjectIdentifierById } = useProject();
  const boardLayout = useBoardLayoutOptional();
  const isBoardGantt = storeType === EIssuesStoreType.BOARD && Boolean(boardLayout);
  const issueTypeLogoMap = useBoardGanttIssueTypeLogoMap(
    isBoardGantt ? boardLayout!.workspaceSlug : undefined,
    isBoardGantt ? boardLayout!.boardSlug : undefined
  );

  // handlers
  const { handleRedirection } = useIssuePeekOverviewRedirection(isEpic);

  // store hooks
  const { getProjectStates } = useProjectState();

  // derived values — layout store has type_id from board issue list
  const issueDetails = issuesStore.rootIssueStore.issues.getIssueById(issueId) ?? getIssueById(issueId);
  const projectIdentifier = getProjectIdentifierById(issueDetails?.project_id);
  const stateDetails =
    issueDetails && getProjectStates(issueDetails?.project_id)?.find((state) => state?.id === issueDetails?.state_id);
  const isCompleted = stateDetails?.group === "completed" || stateDetails?.group === "cancelled";
  const issueTypeLogo = isBoardGantt
    ? resolveBoardGanttIssueTypeLogo(issueDetails?.type_id, issueTypeLogoMap)
    : undefined;
  const displayProperties = issuesFilter?.issueFilters?.displayProperties;
  const sidebarDisplayProperties =
    isBoardGantt && issueTypeLogo && displayProperties
      ? { ...displayProperties, issue_type: false }
      : displayProperties;

  const handleIssuePeekOverview = (e: any) => {
    e.stopPropagation(true);
    e.preventDefault();
    handleRedirection(workspaceSlug, issueDetails, isMobile);
  };

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: issueDetails?.project_id,
    issueId,
    projectIdentifier,
    sequenceId: issueDetails?.sequence_id,
    isEpic,
  });

  return (
    <ControlLink
      id={`issue-${issueId}`}
      href={workItemLink}
      onClick={handleIssuePeekOverview}
      className="line-clamp-2 w-full cursor-pointer text-13 text-primary"
      disabled={!!issueDetails?.tempId}
    >
      <div className="relative flex h-full w-full cursor-pointer items-center gap-2">
        {isBoardGantt && issueTypeLogo ? (
          <BoardGanttRowIcon logo={issueTypeLogo} size={14} className="!border-0 !bg-transparent" />
        ) : null}
        {issueDetails?.project_id && (
          <IssueIdentifier
            issueId={issueDetails.id}
            projectId={issueDetails.project_id}
            size="xs"
            variant="tertiary"
            displayProperties={sidebarDisplayProperties}
          />
        )}
        <Tooltip tooltipContent={issueDetails?.name} isMobile={isMobile} nativeButton={false}>
          <span className="flex-grow truncate text-13 font-medium">{issueDetails?.name}</span>
        </Tooltip>
        {isCompleted && stateDetails && (
          <span
            className="flex-shrink-0 rounded px-1.5 py-0.5 text-9 font-semibold uppercase tracking-wide"
            style={{ backgroundColor: `${stateDetails.color}25`, color: stateDetails.color, border: `1px solid ${stateDetails.color}60` }}
          >
            {stateDetails.name}
          </span>
        )}
      </div>
    </ControlLink>
  );
});
