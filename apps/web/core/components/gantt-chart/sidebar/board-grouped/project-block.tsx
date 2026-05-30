/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { MouseEvent } from "react";
import { observer } from "mobx-react";
import { ChevronDown, ChevronRight, FolderKanban } from "lucide-react";
import type { IGanttBlock } from "@plane/types";
import { Row } from "@plane/ui";
import { cn } from "@plane/utils";
import { useBoardLayout } from "@/components/board/board-layout-context";
import { BoardGanttRowIcon } from "@/components/board/gantt/board-gantt-row-icon";
import { BLOCK_HEIGHT } from "@/components/gantt-chart/constants";
import { getProjectIdFromBoardBlock, isBoardProjectBlockId } from "@/components/issues/issue-layouts/gantt/board-gantt.utils";
import { useProject } from "@/hooks/store/use-project";
import { useBoardGroupedTimelineStore } from "@/hooks/store/use-board-grouped-timeline";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";

type Props = {
  block: IGanttBlock;
  isDragging: boolean;
};

export const BoardProjectSidebarBlock = observer(function BoardProjectSidebarBlock(props: Props) {
  const { block, isDragging } = props;
  const { board } = useBoardLayout();
  const { getPartialProjectById } = useProject();
  const { updateActiveBlockId, isBlockActive, getNumberOfDaysFromPosition } = useTimeLineChartStore();
  const { toggleProjectCollapsed, isProjectCollapsed } = useBoardGroupedTimelineStore();

  const projectId = isBoardProjectBlockId(block.id)
    ? getProjectIdFromBoardBlock(block.id)
    : (block.data?.id ?? block.data?.project_id);
  const project = getPartialProjectById(projectId);
  const collapsed = isProjectCollapsed(projectId);

  const isBlockComplete = !!block?.start_date && !!block?.target_date;
  const duration = isBlockComplete ? getNumberOfDaysFromPosition(block?.position?.width) : undefined;

  if (!projectId || !block?.data) return null;

  const handleToggleCollapse = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleProjectCollapsed(projectId);
  };

  return (
    <div
      className={cn("group/list-block", {
        "rounded-sm bg-layer-1": isDragging,
      })}
      onMouseEnter={() => updateActiveBlockId(block.id)}
      onMouseLeave={() => updateActiveBlockId(null)}
    >
      <Row
        className={cn(
          "group flex w-full items-center gap-1 bg-layer-transparent pr-4 hover:bg-layer-transparent-hover",
          {
            "bg-layer-transparent-hover": isBlockActive(block.id),
          }
        )}
        style={{ height: `${BLOCK_HEIGHT}px` }}
      >
        <button
          type="button"
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-secondary hover:bg-layer-1 hover:text-primary"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expandir projeto" : "Colapsar projeto"}
          onClick={handleToggleCollapse}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <BoardGanttRowIcon
          logo={board?.gantt_project_logo_props}
          size={14}
          fallback={<FolderKanban className="size-4 text-secondary" aria-hidden />}
        />
        <button
          type="button"
          className="flex h-full min-w-0 flex-1 cursor-pointer items-center text-left text-13 font-medium text-primary hover:underline"
          onClick={handleToggleCollapse}
        >
          {project?.identifier ? (
            <span className="text-secondary">{project.identifier}</span>
          ) : null}
          {project?.identifier ? " · " : ""}
          {block.name}
        </button>
        <div className="flex h-full flex-shrink-0 items-center gap-2">
          <span className="text-13 text-secondary">
            {isBlockComplete && duration ? (
              <>
                {duration} day{duration > 1 ? "s" : ""}
              </>
            ) : (
              <span className="text-tertiary">—</span>
            )}
          </span>
        </div>
      </Row>
    </div>
  );
});
