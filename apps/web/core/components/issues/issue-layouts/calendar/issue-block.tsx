import React from "react";
import type { RefObject } from "react";
import { useState, useRef } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
// plane imports
import { useOutsideClickDetector } from "@operoz/hooks";
import { Popover } from "@operoz/propel/popover";
import type { TIssue } from "@operoz/types";
import { cn } from "@operoz/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";
// local components
import { WorkItemPreviewCard } from "../../preview-card";
import type { TRenderQuickActions } from "../list/list-view-types";
import type { CalendarStoreType } from "./base-calendar-root";

type Props = {
  issue: TIssue;
  quickActions: TRenderQuickActions;
  isDragging?: boolean;
  isEpic?: boolean;
  canDrag?: boolean;
  dragHandleRef?: React.MutableRefObject<HTMLDivElement | null>;
};

export const CalendarIssueBlock = observer(function CalendarIssueBlock(props: Props) {
  const { issue, quickActions, isDragging = false, isEpic = false, canDrag = false, dragHandleRef } = props;
  // states
  const [isMenuActive, setIsMenuActive] = useState(false);
  // refs
  const blockRef = useRef<HTMLDivElement | null>(null);
  const menuActionRef = useRef<HTMLDivElement | null>(null);
  // hooks
  const { workspaceSlug } = useParams();
  const { getProjectStates } = useProjectState();
  const { getIsIssuePeeked } = useIssueDetail();
  const { handleRedirection } = useIssuePeekOverviewRedirection(isEpic);
  const { isMobile } = usePlatformOS();
  const storeType = useIssueStoreType() as CalendarStoreType;
  const { issuesFilter } = useIssues(storeType);

  const stateColor = getProjectStates(issue?.project_id)?.find((state) => state?.id == issue?.state_id)?.color || "";

  const handleIssuePeekOverview = () => handleRedirection(workspaceSlug?.toString(), issue, isMobile);

  useOutsideClickDetector(menuActionRef, () => setIsMenuActive(false));

  const customActionButton = (
    <div
      ref={menuActionRef}
      className={`w-full cursor-pointer rounded-sm p-1 text-placeholder hover:bg-layer-1 ${
        isMenuActive ? "bg-layer-1-active text-primary" : "text-secondary"
      }`}
      onClick={() => setIsMenuActive(!isMenuActive)}
    >
      <MoreHorizontal className="h-3.5 w-3.5" />
    </div>
  );

  const isMenuActionRefAboveScreenBottom =
    menuActionRef?.current && menuActionRef?.current?.getBoundingClientRect().bottom < window.innerHeight - 220;

  const placement = isMenuActionRefAboveScreenBottom ? "bottom-end" : "top-end";

  const setDragHandleRef = (node: HTMLDivElement | null) => {
    blockRef.current = node;
    if (dragHandleRef) {
      dragHandleRef.current = node;
    }
  };

  return (
    <Popover delay={100} openOnHover>
      <Popover.Button
        className="w-full"
        nativeButton={false}
        render={
          <div
            id={`issue-${issue.id}`}
            ref={setDragHandleRef}
            role="button"
            tabIndex={0}
            onClick={() => {
              if (!isDragging) handleIssuePeekOverview();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleIssuePeekOverview();
              }
            }}
            className={cn(
              "relative block w-full rounded-sm border-b border-subtle text-left text-13 text-primary hover:border-subtle-1 md:border-[1px]",
              canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
            )}
          >
            {issue?.tempId !== undefined && (
              <div className="absolute top-0 left-0 z-[99999] h-full w-full animate-pulse bg-surface-1/20" />
            )}

            <div
              className={cn(
                "group/calendar-block flex h-10 w-full items-center justify-between gap-1.5 rounded-sm px-4 py-1.5 md:h-8 md:px-1",
                {
                  "border-accent-strong bg-surface-2 shadow-raised-200": isDragging,
                  "bg-surface-1 hover:bg-surface-2": !isDragging,
                  "border border-accent-strong hover:border-accent-strong": getIsIssuePeeked(issue.id),
                }
              )}
            >
              <div className="flex h-full min-w-0 flex-1 items-center gap-1.5 truncate">
                <span
                  className="h-full w-0.5 flex-shrink-0 rounded-sm"
                  style={{
                    backgroundColor: stateColor,
                  }}
                />
                {issue.project_id && (
                  <IssueIdentifier
                    issueId={issue.id}
                    projectId={issue.project_id}
                    size="xs"
                    variant="tertiary"
                    displayProperties={issuesFilter?.issueFilters?.displayProperties}
                  />
                )}
                <div className="truncate text-13 font-medium md:text-11 md:font-regular">{issue.name}</div>
              </div>
              <div
                className={cn("size-5 flex-shrink-0", {
                  "hidden group-hover/calendar-block:block": !isMobile,
                  block: isMenuActive,
                })}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                {quickActions({
                  issue,
                  parentRef: blockRef,
                  customActionButton,
                  placement,
                })}
              </div>
            </div>
          </div>
        }
      />
      <Popover.Panel side="bottom" align="start">
        <>
          {issue.project_id && (
            <WorkItemPreviewCard
              projectId={issue.project_id}
              stateDetails={{
                id: issue.state_id ?? undefined,
              }}
              workItem={issue}
            />
          )}
        </>
      </Popover.Panel>
    </Popover>
  );
});
