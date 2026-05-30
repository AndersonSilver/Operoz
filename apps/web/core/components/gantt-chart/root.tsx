import { useEffect, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// components
import type { IBlockUpdateData, IBlockUpdateDependencyData } from "@operis/types";
// hooks
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import { ChartViewRoot } from "./chart/root";
import { GanttSidebarWidthProvider } from "./contexts";
import { resolveGanttChartViewScope } from "./helpers/gantt-chart-view-preference";

type GanttChartRootProps = {
  border?: boolean;
  title: string;
  loaderTitle: string;
  blockIds: string[];
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  blockToRender: (data: any) => React.ReactNode;
  sidebarToRender: (props: any) => React.ReactNode;
  quickAdd?: React.ReactNode | undefined;
  canLoadMoreBlocks?: boolean;
  loadMoreBlocks?: () => void;
  updateBlockDates?: (updates: IBlockUpdateDependencyData[]) => Promise<void>;
  enableBlockLeftResize?: boolean | ((blockId: string) => boolean);
  enableBlockRightResize?: boolean | ((blockId: string) => boolean);
  enableBlockMove?: boolean | ((blockId: string) => boolean);
  enableReorder?: boolean | ((blockId: string) => boolean);
  enableAddBlock?: boolean | ((blockId: string) => boolean);
  enableSelection?: boolean | ((blockId: string) => boolean);
  enableDependency?: boolean | ((blockId: string) => boolean);
  bottomSpacing?: boolean;
  showAllBlocks?: boolean;
  showToday?: boolean;
  isEpic?: boolean;
};

export const GanttChartRoot = observer(function GanttChartRoot(props: GanttChartRootProps) {
  const {
    border = true,
    title,
    blockIds,
    loaderTitle = "blocks",
    blockUpdateHandler,
    sidebarToRender,
    blockToRender,
    loadMoreBlocks,
    canLoadMoreBlocks,
    enableBlockLeftResize = false,
    enableBlockRightResize = false,
    enableBlockMove = false,
    enableReorder = false,
    enableAddBlock = false,
    enableSelection = false,
    enableDependency = false,
    bottomSpacing = false,
    showAllBlocks = false,
    showToday = true,
    quickAdd,
    updateBlockDates,
    isEpic = false,
  } = props;

  const { setBlockIds } = useTimeLineChartStore();
  const {
    workspaceSlug: routerWorkspaceSlug,
    boardSlug: routerBoardSlug,
    projectId: routerProjectId,
    moduleId: routerModuleId,
    cycleId: routerCycleId,
  } = useParams();

  const workspaceSlug = routerWorkspaceSlug?.toString();
  const ganttViewScope = useMemo(
    () =>
      resolveGanttChartViewScope({
        boardSlug: routerBoardSlug?.toString(),
        projectId: routerProjectId?.toString(),
        moduleId: routerModuleId?.toString(),
        cycleId: routerCycleId?.toString(),
      }),
    [routerBoardSlug, routerProjectId, routerModuleId, routerCycleId]
  );

  // update the timeline store with updated blockIds
  useEffect(() => {
    queueMicrotask(() => setBlockIds(blockIds));
  }, [blockIds, setBlockIds]);

  return (
    <GanttSidebarWidthProvider workspaceSlug={workspaceSlug} scope={ganttViewScope}>
      <ChartViewRoot
      border={border}
      title={title}
      blockIds={blockIds}
      loadMoreBlocks={loadMoreBlocks}
      canLoadMoreBlocks={canLoadMoreBlocks}
      loaderTitle={loaderTitle}
      blockUpdateHandler={blockUpdateHandler}
      sidebarToRender={sidebarToRender}
      blockToRender={blockToRender}
      enableBlockLeftResize={enableBlockLeftResize}
      enableBlockRightResize={enableBlockRightResize}
      enableBlockMove={enableBlockMove}
      enableReorder={enableReorder}
      enableAddBlock={enableAddBlock}
      enableSelection={enableSelection}
      enableDependency={enableDependency}
      bottomSpacing={bottomSpacing}
      showAllBlocks={showAllBlocks}
      quickAdd={quickAdd}
      showToday={showToday}
      updateBlockDates={updateBlockDates}
      isEpic={isEpic}
    />
    </GanttSidebarWidthProvider>
  );
});
