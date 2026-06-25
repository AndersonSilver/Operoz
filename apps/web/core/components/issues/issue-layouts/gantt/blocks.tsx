import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import type { MouseEvent } from "react";
import { ChevronRightIcon } from "@operis/propel/icons";
// plane imports
import { Popover } from "@operis/propel/popover";
import { Tooltip } from "@operis/propel/tooltip";
import { ControlLink } from "@operis/ui";
import { EIssuesStoreType } from "@operis/types";
import { findTotalDaysInRange, generateWorkItemLink, cn } from "@operis/utils";
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
import { IssueIdentifier, IssueTypeIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";
import { IssueStats } from "@/plane-web/components/issues/issue-layouts/issue-stats";
// local imports
import { WorkItemPreviewCard } from "../../preview-card";
import { getBlockViewDetails } from "../utils";
import type { GanttStoreType } from "./base-gantt-root";

type SidebarBlockProps = {
  issueId: string;
  isEpic?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: (event: MouseEvent<HTMLButtonElement>) => void;
  subIssuesCount?: number;
};

type IssueGanttChartBlockProps = {
  issueId: string;
  isEpic?: boolean;
};

export const IssueGanttBlock = observer(function IssueGanttBlock(props: IssueGanttChartBlockProps) {
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

  const { blockStyle, message } = getBlockViewDetails(issueDetails, stateDetails?.color ?? "");

  const handleIssuePeekOverview = () => handleRedirection(workspaceSlug, issueDetails, isMobile);

  const duration = findTotalDaysInRange(issueDetails?.start_date, issueDetails?.target_date) || 0;
  const { sidebarWidth } = useGanttSidebarWidth();
  const tooltipContent = message ?? issueDetails?.name;

  return (
    <Popover delay={100} openOnHover>
      <Popover.Button
        className="w-full"
        render={
          <Tooltip tooltipContent={tooltipContent} isMobile={isMobile}>
            <div
              id={`issue-${issueId}`}
              className="relative flex h-full w-full cursor-pointer items-center rounded-sm transition-colors hover:brightness-[1.03]"
              style={blockStyle}
              onClick={handleIssuePeekOverview}
            >
              <div
                className="sticky w-auto flex-1 truncate overflow-hidden px-2.5 py-1 text-13 font-medium text-primary"
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
          </Tooltip>
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
export const IssueGanttSidebarBlock = observer(function IssueGanttSidebarBlock(props: SidebarBlockProps) {
  const { issueId, isEpic = false, isExpanded = false, onToggleExpand, subIssuesCount = 0 } = props;
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
  const showIssueTypeIcon = Boolean(issueDetails?.type_id && issueDetails?.project_id);
  const displayProperties = issuesFilter?.issueFilters?.displayProperties;
  const sidebarDisplayProperties =
    displayProperties && (showIssueTypeIcon || (isBoardGantt && issueTypeLogo))
      ? { ...displayProperties, issue_type: false }
      : displayProperties;

  const handleIssuePeekOverview = (e: any) => {
    e.stopPropagation(true);
    e.preventDefault();
    handleRedirection(workspaceSlug, issueDetails, isMobile);
  };

  const handleToggleExpand = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    onToggleExpand?.(e);
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
    <div className="relative flex h-full w-full min-w-0 items-center gap-2">
      <div className="grid size-4 flex-shrink-0 place-items-center">
        {subIssuesCount > 0 && !isEpic && onToggleExpand ? (
          <button
            type="button"
            className="grid size-4 place-items-center rounded-xs text-placeholder hover:text-tertiary"
            onClick={handleToggleExpand}
          >
            <ChevronRightIcon
              className={cn("size-4", {
                "rotate-90": isExpanded,
              })}
              strokeWidth={2.5}
            />
          </button>
        ) : null}
      </div>
      <ControlLink
        id={`issue-${issueId}`}
        href={workItemLink}
        onClick={handleIssuePeekOverview}
        className="line-clamp-2 min-w-0 flex-1 cursor-pointer text-13 text-primary"
        disabled={!!issueDetails?.tempId}
      >
        <div className="relative flex h-full w-full cursor-pointer items-center gap-2">
          {isBoardGantt && issueTypeLogo ? (
            <BoardGanttRowIcon logo={issueTypeLogo} size={14} className="!border-0 !bg-transparent" />
          ) : showIssueTypeIcon ? (
            <IssueTypeIdentifier issueTypeId={issueDetails!.type_id!} projectId={issueDetails!.project_id!} size="xs" />
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
              className="flex-shrink-0 rounded px-1.5 py-0.5 text-9 font-semibold tracking-wide uppercase"
              style={{
                backgroundColor: `${stateDetails.color}25`,
                color: stateDetails.color,
                border: `1px solid ${stateDetails.color}60`,
              }}
            >
              {stateDetails.name}
            </span>
          )}
        </div>
      </ControlLink>
    </div>
  );
});
