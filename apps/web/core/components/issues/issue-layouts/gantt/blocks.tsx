import type { MouseEvent } from "react";
import { Link2 } from "lucide-react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronRightIcon } from "@operoz/propel/icons";
// plane imports
import { useTranslation } from "@operoz/i18n";
import { Popover } from "@operoz/propel/popover";
import { Tooltip } from "@operoz/propel/tooltip";
import { ControlLink } from "@operoz/ui";
import { EIssuesStoreType } from "@operoz/types";
import { generateWorkItemLink, cn } from "@operoz/utils";
// components
import { resolveGanttBarColor } from "@/components/gantt-chart/helpers/gantt-bar-color";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import type { IBoardGroupedTimelineStore } from "@/store/timeline/board-grouped-timeline.store";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";
import { useModule } from "@/hooks/store/use-module";
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
// local imports
import { getLocalizedStateName } from "@/components/project-states/state-display.utils";
import { IssueAssigneeIndicator, IssueSubIssuesIndicator } from "../issue-row-indicators";
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
  const { workspaceSlug: routerWorkspaceSlug, moduleId: routeModuleId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // store hooks
  const { getProjectStates } = useProjectState();
  const timelineStore = useTimeLineChartStore();
  const { getBlockById } = timelineStore;
  const boardGroupedStore = "boardModulesById" in timelineStore ? (timelineStore as IBoardGroupedTimelineStore) : null;
  const { getModuleById } = useModule();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // hooks
  const { t } = useTranslation();
  const { isMobile } = usePlatformOS();
  const { handleRedirection } = useIssuePeekOverviewRedirection(isEpic);

  // derived values
  const issueDetails = getIssueById(issueId);
  const stateDetails =
    issueDetails && getProjectStates(issueDetails?.project_id)?.find((state) => state?.id == issueDetails?.state_id);

  const contextModuleId =
    routeModuleId?.toString() ??
    boardGroupedStore?.getModuleIdForIssue(issueId) ??
    issueDetails?.module_ids?.[0] ??
    null;

  const moduleConfig = contextModuleId
    ? (boardGroupedStore?.boardModulesById[contextModuleId] ?? getModuleById(contextModuleId))
    : undefined;

  const barColor = resolveGanttBarColor(stateDetails?.color ?? "", moduleConfig);
  const { blockStyle, message } = getBlockViewDetails(issueDetails, barColor, t);

  const ganttBlock = getBlockById(issueId);
  const hasDependencyLinks =
    (ganttBlock?.blocked_by_ids?.length ?? 0) > 0 || (ganttBlock?.blocking_ids?.length ?? 0) > 0;

  const handleIssuePeekOverview = () => handleRedirection(workspaceSlug, issueDetails, isMobile);

  const tooltipContent = message ?? issueDetails?.name;

  return (
    <Popover delay={100} openOnHover>
      <Popover.Button
        className="w-full"
        render={
          <Tooltip tooltipContent={tooltipContent} isMobile={isMobile}>
            <div
              id={`issue-${issueId}`}
              className="relative flex h-full w-full cursor-pointer items-center justify-center rounded-sm transition-colors hover:brightness-[1.03]"
              style={blockStyle}
              onClick={handleIssuePeekOverview}
            >
              {hasDependencyLinks ? (
                <Link2 size={16} strokeWidth={2} className="shrink-0 text-secondary" aria-hidden />
              ) : null}
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
  const { t } = useTranslation();
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
          <IssueSubIssuesIndicator
            count={subIssuesCount}
            isEpic={isEpic}
            isMobile={isMobile}
            onClick={onToggleExpand ? handleToggleExpand : undefined}
          />
          {stateDetails && (
            <span
              className="flex-shrink-0 rounded px-1.5 py-0.5 text-9 font-semibold tracking-wide uppercase"
              style={{
                backgroundColor: `${stateDetails.color}25`,
                color: stateDetails.color,
                border: `1px solid ${stateDetails.color}60`,
              }}
            >
              {getLocalizedStateName(stateDetails, t)}
            </span>
          )}
          <IssueAssigneeIndicator assigneeIds={issueDetails?.assignee_ids} />
        </div>
      </ControlLink>
    </div>
  );
});
