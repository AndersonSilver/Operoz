/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { RefObject } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import { GANTT_TIMELINE_TYPE } from "@plane/types";
import type { IBlockUpdateData } from "@plane/types";
import { Loader } from "@plane/ui";
import RenderIfVisible from "@/components/core/render-if-visible-HOC";
import {
  isBoardModuleBlockId,
  isBoardProjectBlockId,
} from "@/components/issues/issue-layouts/gantt/board-gantt.utils";
import { GanttLayoutListItemLoader } from "@/components/ui/loader/layouts/gantt-layout-loader";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useIssuesStore } from "@/hooks/use-issue-layout-store";
import type { TSelectionHelper } from "@/hooks/use-multiple-select";
import { useTimeLineChart } from "@/hooks/use-timeline-chart";
import { GanttDnDHOC } from "../gantt-dnd-HOC";
import { handleOrderChange } from "../utils";
import { IssuesSidebarBlock } from "../issues/block";
import { BoardModuleSidebarBlock } from "./module-block";
import { BoardProjectSidebarBlock } from "./project-block";

type Props = {
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  canLoadMoreBlocks?: boolean;
  loadMoreBlocks?: () => void;
  ganttContainerRef: RefObject<HTMLDivElement>;
  blockIds: string[];
  enableReorder: boolean | ((blockId: string) => boolean);
  enableSelection: boolean | ((blockId: string) => boolean);
  showAllBlocks?: boolean;
  selectionHelpers?: TSelectionHelper;
};

const resolveFlag = (value: boolean | ((blockId: string) => boolean), blockId: string) =>
  typeof value === "function" ? value(blockId) : value;

export const BoardGroupedGanttSidebar = observer(function BoardGroupedGanttSidebar(props: Props) {
  const {
    blockUpdateHandler,
    blockIds,
    enableReorder,
    enableSelection,
    loadMoreBlocks,
    canLoadMoreBlocks,
    ganttContainerRef,
    showAllBlocks = true,
    selectionHelpers,
  } = props;

  const { getBlockById } = useTimeLineChart(GANTT_TIMELINE_TYPE.GROUPED);

  const {
    issues: { getIssueLoader },
  } = useIssuesStore();

  const [intersectionElement, setIntersectionElement] = useState<HTMLDivElement | null>(null);
  const isPaginating = !!getIssueLoader();

  useIntersectionObserver(
    ganttContainerRef,
    isPaginating ? null : intersectionElement,
    loadMoreBlocks,
    "100% 0% 100% 0%"
  );

  const handleOnDrop = (
    draggingBlockId: string | undefined,
    droppedBlockId: string | undefined,
    dropAtEndOfList: boolean
  ) => {
    handleOrderChange(draggingBlockId, droppedBlockId, dropAtEndOfList, blockIds, getBlockById, blockUpdateHandler);
  };

  return (
    <div>
      {blockIds ? (
        <>
          {blockIds.map((blockId, index) => {
            const block = getBlockById(blockId);
            if (!block) return null;

            const isProjectRow = isBoardProjectBlockId(blockId);
            const isModuleRow = isBoardModuleBlockId(blockId);
            const isGroupRow = isProjectRow || isModuleRow;
            const isBlockVisibleOnSidebar = block?.start_date && block?.target_date;

            if (!showAllBlocks && !isGroupRow && !isBlockVisibleOnSidebar) return null;

            const issueIndentClass = (() => {
              for (let i = index - 1; i >= 0; i--) {
                if (isBoardProjectBlockId(blockIds[i])) return "pl-6";
                if (isBoardModuleBlockId(blockIds[i])) return "pl-12";
              }
              return "pl-6";
            })();

            const reorderEnabled = resolveFlag(enableReorder, blockId);
            const selectionEnabled = resolveFlag(enableSelection, blockId);

            return (
              <RenderIfVisible
                key={block.id}
                root={ganttContainerRef}
                horizontalOffset={100}
                verticalOffset={200}
                shouldRecordHeights={false}
                placeholderChildren={<GanttLayoutListItemLoader />}
              >
                <GanttDnDHOC
                  id={block.id}
                  isLastChild={index === blockIds.length - 1}
                  isDragEnabled={reorderEnabled}
                  onDrop={handleOnDrop}
                >
                  {(isDragging: boolean) =>
                    isProjectRow ? (
                      <BoardProjectSidebarBlock block={block} isDragging={isDragging} />
                    ) : isModuleRow ? (
                      <BoardModuleSidebarBlock block={block} isDragging={isDragging} />
                    ) : (
                      <div className={issueIndentClass}>
                        <IssuesSidebarBlock
                          block={block}
                          enableSelection={selectionEnabled}
                          isDragging={isDragging}
                          selectionHelpers={selectionHelpers}
                        />
                      </div>
                    )
                  }
                </GanttDnDHOC>
              </RenderIfVisible>
            );
          })}
          {canLoadMoreBlocks && (
            <div ref={setIntersectionElement} className="p-2">
              <div className="flex h-10 w-full animate-pulse items-center justify-between gap-1.5 rounded-sm bg-layer-1 px-4 py-1.5 md:h-8 md:px-1" />
            </div>
          )}
        </>
      ) : (
        <Loader className="space-y-3 pr-2">
          <Loader.Item height="34px" />
          <Loader.Item height="34px" />
          <Loader.Item height="34px" />
        </Loader>
      )}
    </div>
  );
});
