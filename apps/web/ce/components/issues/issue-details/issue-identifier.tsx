import { observer } from "mobx-react";
import useSWR from "swr";
import { useParams } from "next/navigation";
// plane imports
import { Tooltip } from "@operis/propel/tooltip";
import type { TIssueIdentifierProps, TIssueTypeIdentifier, TIssueIdentifierSize } from "@operis/types";
// hooks
import { useBoardIssueType } from "@/hooks/store/use-board-issue-type";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { BoardGanttRowIcon } from "@/components/board/gantt/board-gantt-row-icon";
import { IdentifierText } from "@/components/issues/issue-detail/identifier-text";

const ISSUE_TYPE_ICON_SIZE: Record<TIssueIdentifierSize, number> = {
  xs: 14,
  sm: 14,
  md: 16,
  lg: 18,
};

export const IssueIdentifier = observer(function IssueIdentifier(props: TIssueIdentifierProps) {
  const { projectId, variant, size, displayProperties, enableClickToCopyIdentifier = false } = props;
  // store hooks
  const { getProjectIdentifierById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // Determine if the component is using store data or not
  const isUsingStoreData = "issueId" in props;
  // derived values
  const issue = isUsingStoreData ? getIssueById(props.issueId) : null;
  const projectIdentifier = isUsingStoreData ? getProjectIdentifierById(projectId) : props.projectIdentifier;
  const issueSequenceId = isUsingStoreData ? issue?.sequence_id : props.issueSequenceId;
  const issueTypeId = isUsingStoreData ? issue?.type_id : props.issueTypeId;
  const shouldRenderIssueId = displayProperties ? displayProperties.key : true;
  const shouldRenderIssueType = displayProperties ? displayProperties.issue_type : false;

  if (!shouldRenderIssueId && !shouldRenderIssueType) return null;

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {shouldRenderIssueType && issueTypeId && (
        <IssueTypeIdentifier issueTypeId={issueTypeId} projectId={projectId} size={size} />
      )}
      {shouldRenderIssueId && (
        <IdentifierText
          identifier={`${projectIdentifier}-${issueSequenceId}`}
          enableClickToCopyIdentifier={enableClickToCopyIdentifier}
          variant={variant}
          size={size}
        />
      )}
    </div>
  );
});

export const IssueTypeIdentifier = observer(function IssueTypeIdentifier(props: TIssueTypeIdentifier) {
  const { issueTypeId, projectId, size = "xs" } = props;
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const { fetchProjectIssueTypes, getProjectIssueTypes } = useBoardIssueType();

  useSWR(
    workspaceSlug && projectId ? `PROJECT_ISSUE_TYPES_${workspaceSlug}_${projectId}` : null,
    () => fetchProjectIssueTypes(workspaceSlug!, projectId),
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const issueType = getProjectIssueTypes(projectId).find((type) => type.id === issueTypeId);
  if (!issueTypeId || !issueType) return null;

  const iconSize = ISSUE_TYPE_ICON_SIZE[size];

  return (
    <Tooltip tooltipContent={issueType.name} isMobile={false}>
      <span className="flex shrink-0 items-center" aria-label={issueType.name}>
        <BoardGanttRowIcon logo={issueType.logo_props} size={iconSize} className="!border-0 !bg-transparent" />
      </span>
    </Tooltip>
  );
});
