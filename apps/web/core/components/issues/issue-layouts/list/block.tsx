import type { Dispatch, MouseEvent, SetStateAction } from "react";
import { useEffect, useRef } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronRightIcon } from "@operoz/propel/icons";
// types
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import { Tooltip } from "@operoz/propel/tooltip";
import type { TIssue, IIssueDisplayProperties, TIssueMap } from "@operoz/types";
import { EIssueServiceType, EIssuesStoreType } from "@operoz/types";
// ui
import { Spinner, ControlLink, Row } from "@operoz/ui";
import { cn, generateWorkItemLink } from "@operoz/utils";
// components
import { BulkSelectCheckboxCell } from "@/components/core/multiple-select/bulk-select-checkbox-cell";
import { IssueProperties } from "@/components/issues/issue-layouts/properties";
// helpers
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useListGridColumnsContextOptional } from "./list-grid-columns-context";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";
import { IssueStats } from "@/plane-web/components/issues/issue-layouts/issue-stats";
// types
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";
import { IssueAssigneeIndicator, IssueSubIssuesIndicator } from "../issue-row-indicators";
import { calculateIdentifierWidth } from "../utils";
import type { TRenderQuickActions } from "./list-view-types";

/** Na lista do board, exibe só o nome do card (sem prefixo do projeto/épico no título). */
function getBoardListIssueTitle(issueName: string, projectName?: string): string {
  let name = issueName.trim();

  if (projectName) {
    const project = projectName.trim();
    if (project && name.startsWith(project)) {
      name = name
        .slice(project.length)
        .replace(/^[\s\-–—:]+/, "")
        .trim();
    }
  }

  // Remove prefixos do tipo "[ MÓDULO ] - " repetidos no início do título
  name = name.replace(/^(?:\[[^\]]+\]\s*)+(?:[-–—]\s*)+/, "").trim();

  return name || issueName;
}

interface IssueBlockProps {
  issueId: string;
  issuesMap: TIssueMap;
  groupId: string;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  quickActions: TRenderQuickActions;
  displayProperties: IIssueDisplayProperties | undefined;
  canEditProperties: (projectId: string | undefined) => boolean;
  nestingLevel: number;
  spacingLeft?: number;
  isExpanded: boolean;
  setExpanded: Dispatch<SetStateAction<boolean>>;
  selectionHelpers: TSelectionHelper;
  isCurrentBlockDragging: boolean;
  setIsCurrentBlockDragging: React.Dispatch<React.SetStateAction<boolean>>;
  canDrag: boolean;
  isEpic?: boolean;
}

export const IssueBlock = observer(function IssueBlock(props: IssueBlockProps) {
  const {
    issuesMap,
    issueId,
    groupId,
    updateIssue,
    quickActions,
    displayProperties,
    canEditProperties,
    nestingLevel,
    spacingLeft = 14,
    isExpanded,
    setExpanded,
    selectionHelpers,
    isCurrentBlockDragging,
    setIsCurrentBlockDragging,
    canDrag,
    isEpic = false,
  } = props;
  // ref
  const issueRef = useRef<HTMLDivElement | null>(null);
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  const projectId = routerProjectId?.toString();
  // hooks
  const { sidebarCollapsed: isSidebarCollapsed } = useAppTheme();
  const storeType = useIssueStoreType();
  const useListGridLayout =
    storeType === EIssuesStoreType.MODULE ||
    storeType === EIssuesStoreType.PROJECT ||
    storeType === EIssuesStoreType.BOARD;
  const useListRowLayout = useListGridLayout;
  const listGridCtx = useListGridColumnsContextOptional();
  const useAlignedListGrid = useListGridLayout && !!listGridCtx;
  const propertiesLayoutVariant = useListGridLayout ? "list-grid" : "flex";
  const { getProjectIdentifierById, getPartialProjectById, currentProjectNextSequenceId } = useProject();
  const {
    getIsIssuePeeked,
    peekIssue,
    setPeekIssue,
    subIssues: subIssuesStore,
  } = useIssueDetail(isEpic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES);

  const handleIssuePeekOverview = (issue: TIssue) =>
    workspaceSlug &&
    issue &&
    issue.project_id &&
    issue.id &&
    !getIsIssuePeeked(issue.id) &&
    setPeekIssue({
      workspaceSlug,
      projectId: issue.project_id,
      issueId: issue.id,
      nestingLevel: nestingLevel,
      isArchived: !!issue.archived_at,
    });

  // derived values
  const issue = issuesMap[issueId];
  const subIssuesCount = issue?.sub_issues_count ?? 0;
  const canEditIssueProperties = canEditProperties(issue?.project_id ?? undefined);
  const isDraggingAllowed = canDrag && canEditIssueProperties;

  const { isMobile } = usePlatformOS();

  useEffect(() => {
    const element = issueRef.current;

    if (!element) return;

    return combine(
      draggable({
        element,
        canDrag: () => isDraggingAllowed,
        getInitialData: () => ({ id: issueId, type: "ISSUE", groupId }),
        onDragStart: () => {
          setIsCurrentBlockDragging(true);
        },
        onDrop: () => {
          setIsCurrentBlockDragging(false);
        },
      })
    );
  }, [isDraggingAllowed, issueId, groupId, setIsCurrentBlockDragging]);

  if (!issue) return null;

  const projectIdentifier = getProjectIdentifierById(issue.project_id);
  const isBoardList = storeType === EIssuesStoreType.BOARD;
  const boardListProjectName =
    isBoardList && issue.project_id ? getPartialProjectById(issue.project_id)?.name : undefined;
  const issueDisplayName = isBoardList ? getBoardListIssueTitle(issue.name, boardListProjectName) : issue.name;
  const isIssueSelected = selectionHelpers.getIsEntitySelected(issue.id);
  const isIssueActive = selectionHelpers.getIsEntityActive(issue.id);
  const canSelectIssues = canEditIssueProperties && !selectionHelpers.isSelectionDisabled;
  const showBulkSelectCheckbox = Boolean(projectId && canSelectIssues && !isEpic);
  const subIssueContentIndentPx = nestingLevel * spacingLeft;

  const handleToggleExpand = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (nestingLevel >= 3) {
      handleIssuePeekOverview(issue);
    } else {
      setExpanded((prevState) => {
        if (!prevState && workspaceSlug && issue && issue.project_id)
          subIssuesStore.fetchSubIssues(workspaceSlug.toString(), issue.project_id, issue.id);
        return !prevState;
      });
    }
  };

  // Calculate width for: projectIdentifier + "-" + dynamic sequence number digits
  // Use next_work_item_sequence from backend (static value from project endpoint)
  const maxSequenceId = currentProjectNextSequenceId ?? 1;
  const keyMinWidth = displayProperties?.key
    ? calculateIdentifierWidth(projectIdentifier?.length ?? 0, maxSequenceId)
    : 0;

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: issue?.project_id,
    issueId,
    projectIdentifier,
    sequenceId: issue?.sequence_id,
    isEpic,
    isArchived: !!issue?.archived_at,
  });
  const bulkSelectCheckbox = showBulkSelectCheckbox ? (
    <BulkSelectCheckboxCell
      groupId={groupId}
      id={issue.id}
      selectionHelpers={selectionHelpers}
      disabled={Boolean(projectId && issue.project_id && issue.project_id !== projectId)}
      disabledTitle="Only work items within the current project can be selected."
    />
  ) : null;

  const issueTitleContent = (
    <div
      className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden"
      style={subIssueContentIndentPx > 0 ? { paddingLeft: `${subIssueContentIndentPx}px` } : undefined}
    >
      {displayProperties && (displayProperties.key || displayProperties.issue_type) && (
        <div className="flex-shrink-0" style={{ minWidth: `${keyMinWidth}px` }}>
          {issue.project_id && (
            <IssueIdentifier
              issueId={issueId}
              projectId={issue.project_id}
              size="xs"
              variant="tertiary"
              displayProperties={displayProperties}
            />
          )}
        </div>
      )}

      <div className="grid size-4 flex-shrink-0 place-items-center">
        {subIssuesCount > 0 && !isEpic && (
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
        )}
      </div>

      {issue?.tempId !== undefined && (
        <div className="absolute top-0 left-0 z-[99999] h-full w-full animate-pulse bg-surface-1/20" />
      )}

      <Tooltip
        tooltipContent={issueDisplayName}
        isMobile={isMobile}
        position="top-start"
        disabled={isCurrentBlockDragging}
        renderByDefault={false}
      >
        <p className="min-w-0 flex-1 cursor-pointer truncate text-body-xs-medium text-primary">{issueDisplayName}</p>
      </Tooltip>
      <IssueSubIssuesIndicator
        count={subIssuesCount}
        isEpic={isEpic}
        isMobile={isMobile}
        onClick={handleToggleExpand}
      />
      <IssueAssigneeIndicator assigneeIds={issue.assignee_ids} />
      {isEpic && displayProperties && (
        <WithDisplayPropertiesHOC
          displayProperties={displayProperties}
          displayPropertyKey="sub_issue_count"
          shouldRenderProperty={(properties) => !!properties.sub_issue_count}
        >
          <IssueStats issueId={issue.id} className="ml-2 text-body-xs-medium text-tertiary" />
        </WithDisplayPropertiesHOC>
      )}
    </div>
  );

  return (
    <Row
      ref={issueRef}
      className={cn(
        "group/list-block relative min-h-11 bg-layer-transparent text-13 transition-colors hover:bg-layer-transparent-hover",
        useAlignedListGrid
          ? cn("grid w-full min-w-0 items-center gap-0 py-2.5 pr-3", !showBulkSelectCheckbox && "pl-3")
          : cn(
              "flex min-w-full flex-col",
              !showBulkSelectCheckbox && "pl-3",
              useListGridLayout ? "gap-2 py-2.5 sm:flex-row sm:items-center sm:gap-0" : "gap-3 py-3"
            ),
        {
          "border-accent-strong": getIsIssuePeeked(issue.id) && peekIssue?.nestingLevel === nestingLevel,
          "border-strong-1": isIssueActive,
          "last:border-b-transparent": !getIsIssuePeeked(issue.id) && !isIssueActive,
          "bg-accent-primary/5 hover:bg-accent-primary/10": isIssueSelected,
          "bg-layer-1": isCurrentBlockDragging,
          "sm:flex-row sm:items-center": useListRowLayout && !useAlignedListGrid && !useListGridLayout,
          "md:flex-row md:items-center": isSidebarCollapsed && !useListRowLayout && !useAlignedListGrid,
          "lg:flex-row lg:items-center": !isSidebarCollapsed && !useListRowLayout && !useAlignedListGrid,
        }
      )}
      style={
        useAlignedListGrid && listGridCtx ? { gridTemplateColumns: listGridCtx.layoutGridTemplateColumns } : undefined
      }
      onDragStart={() => {
        if (!isDraggingAllowed) {
          setToast({
            type: TOAST_TYPE.WARNING,
            title: "Cannot move work item",
            message: !canEditIssueProperties
              ? "You are not allowed to move this work item"
              : "Drag and drop is disabled for the current grouping",
          });
        }
      }}
    >
      <div
        className={cn(
          useAlignedListGrid
            ? "flex min-w-0 items-center gap-0 overflow-hidden pr-3"
            : cn("flex min-w-0", useListGridLayout ? "flex-1 gap-2 sm:pr-2" : "w-full gap-2")
        )}
      >
        {bulkSelectCheckbox}
        <ControlLink
          id={`issue-${issue.id}`}
          href={workItemLink}
          onClick={() => handleIssuePeekOverview(issue)}
          className={cn("flex min-w-0 flex-1 cursor-pointer", useAlignedListGrid ? "overflow-hidden" : "w-full")}
          disabled={!!issue?.tempId || issue?.is_draft}
        >
          <div
            className={cn(
              "flex min-w-0 items-center gap-1.5 overflow-hidden",
              useAlignedListGrid ? "w-full" : "flex-1"
            )}
          >
            {issueTitleContent}
          </div>
          {!issue?.tempId && !useAlignedListGrid && (
            <div
              className={cn("block rounded-sm border border-strong", {
                "md:hidden": isSidebarCollapsed,
                "lg:hidden": !isSidebarCollapsed,
              })}
            >
              {quickActions({
                issue,
                parentRef: issueRef,
              })}
            </div>
          )}
        </ControlLink>
      </div>

      {useAlignedListGrid ? (
        <>
          <div className="min-w-0 border-l border-subtle pl-3">
            {!issue?.tempId ? (
              <IssueProperties
                className="relative w-full min-w-0"
                issue={issue}
                isReadOnly={!canEditIssueProperties}
                updateIssue={updateIssue}
                displayProperties={displayProperties}
                activeLayout="List"
                isEpic={isEpic}
                layoutVariant="list-grid"
              />
            ) : (
              <div className="col-span-full flex justify-center py-1">
                <Spinner className="h-4 w-4" />
              </div>
            )}
          </div>
          <div
            className="flex w-8 shrink-0 items-center justify-center"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {!issue?.tempId ? quickActions({ issue, parentRef: issueRef }) : <Spinner className="h-4 w-4" />}
          </div>
        </>
      ) : (
        <div
          className={cn(
            "flex shrink-0 items-center",
            useListGridLayout ? "w-full gap-2 sm:ml-2 sm:w-auto sm:border-l sm:border-subtle sm:pl-3" : "gap-2"
          )}
        >
          {!issue?.tempId ? (
            <>
              <IssueProperties
                className={cn(
                  "relative flex items-center whitespace-nowrap",
                  useListGridLayout
                    ? "w-full min-w-0"
                    : cn(
                        "flex-wrap gap-2",
                        isSidebarCollapsed ? "md:flex-shrink-0 md:flex-grow" : "lg:flex-shrink-0 lg:flex-grow"
                      )
                )}
                issue={issue}
                isReadOnly={!canEditIssueProperties}
                updateIssue={updateIssue}
                displayProperties={displayProperties}
                activeLayout="List"
                isEpic={isEpic}
                layoutVariant={propertiesLayoutVariant}
              />
              <div
                className={cn(
                  useListGridLayout
                    ? "hidden sm:flex sm:w-8 sm:shrink-0 sm:justify-center"
                    : cn("hidden", {
                        "md:flex": isSidebarCollapsed,
                        "lg:flex": !isSidebarCollapsed,
                      })
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {quickActions({ issue, parentRef: issueRef })}
              </div>
            </>
          ) : (
            <div className="h-4 w-4">
              <Spinner className="h-4 w-4" />
            </div>
          )}
        </div>
      )}
    </Row>
  );
});
