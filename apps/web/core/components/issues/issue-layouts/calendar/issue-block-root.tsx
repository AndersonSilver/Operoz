import React, { useEffect, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { draggable } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { preventUnhandled } from "@atlaskit/pragmatic-drag-and-drop/prevent-unhandled";
import { observer } from "mobx-react";
// plane helpers
import { useOutsideClickDetector } from "@operis/hooks";
// components
import { cn, renderFormattedPayloadDate } from "@operis/utils";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import type { TRenderQuickActions } from "../list/list-view-types";
import { HIGHLIGHT_CLASS } from "../utils";
import { CALENDAR_ISSUE_DRAG_TYPE } from "./calendar-drag-context";
import { CalendarIssueBlock } from "./issue-block";
// types

type Props = {
  issueId: string;
  calendarCellDate: string;
  quickActions: TRenderQuickActions;
  isDragDisabled: boolean;
  isEpic?: boolean;
  canEditProperties: (projectId: string | undefined) => boolean;
};

export const CalendarIssueBlockRoot = observer(function CalendarIssueBlockRoot(props: Props) {
  const { issueId, calendarCellDate, quickActions, isDragDisabled, isEpic = false, canEditProperties } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragHandleRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const {
    issue: { getIssueById },
  } = useIssueDetail();

  const issue = getIssueById(issueId);

  const canDrag = !isDragDisabled && canEditProperties(issue?.project_id ?? undefined);

  useEffect(() => {
    const element = containerRef.current;
    const dragHandle = dragHandleRef.current;

    if (!element || !dragHandle) return;

    return combine(
      draggable({
        element,
        dragHandle,
        canDrag: () => canDrag,
        getInitialData: () => ({
          id: issue?.id,
          type: CALENDAR_ISSUE_DRAG_TYPE,
          date: renderFormattedPayloadDate(issue?.target_date) ?? issue?.target_date,
        }),
        onDragStart: () => {
          preventUnhandled.start();
          setIsDragging(true);
        },
        onDrop: () => {
          preventUnhandled.stop();
          setIsDragging(false);
        },
      })
    );
  }, [issue, canDrag, calendarCellDate]);

  useOutsideClickDetector(containerRef, () => {
    containerRef?.current?.classList?.remove(HIGHLIGHT_CLASS);
  });

  if (!issue) return null;

  return (
    <div
      ref={containerRef}
      className={cn("w-full", {
        "pointer-events-none": isDragging,
        "relative z-[2]": isDragging,
      })}
    >
      <CalendarIssueBlock
        issue={issue}
        quickActions={quickActions}
        isDragging={isDragging}
        isEpic={isEpic}
        canDrag={canDrag}
        dragHandleRef={dragHandleRef}
      />
    </div>
  );
});
