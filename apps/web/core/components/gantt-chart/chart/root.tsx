import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
// plane imports
import { useTranslation } from "@operis/i18n";
// components
import type { ChartDataType, IBlockUpdateData, IBlockUpdateDependencyData, TGanttViews } from "@operis/types";
import { cn } from "@operis/utils";
import { useBoardHubHasBackground } from "@/components/board/board-hub-background";
import { GanttChartHeader, GanttChartMainContent } from "@/components/gantt-chart";
import {
  getSavedGanttChartView,
  resolveGanttChartViewScope,
  saveGanttChartView,
  withGanttChartFocusDate,
} from "@/components/gantt-chart/helpers";
// helpers
// hooks
import { useUserProfile } from "@/hooks/store/user";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
//
import { useGanttSidebarWidth } from "../contexts/gantt-sidebar-width";
import { currentViewDataWithView, VIEWS_LIST } from "../data";
import type { IMonthBlock, IMonthView, IWeekBlock } from "../views";
import { getNumberOfDaysBetweenTwoDates, monthView, quarterView, weekView } from "../views";

type ChartViewRootProps = {
  border: boolean;
  title: string;
  loaderTitle: string;
  blockIds: string[];
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  blockToRender: (data: any) => React.ReactNode;
  sidebarToRender: (props: any) => React.ReactNode;
  enableBlockLeftResize: boolean | ((blockId: string) => boolean);
  enableBlockRightResize: boolean | ((blockId: string) => boolean);
  enableBlockMove: boolean | ((blockId: string) => boolean);
  enableReorder: boolean | ((blockId: string) => boolean);
  enableAddBlock: boolean | ((blockId: string) => boolean);
  enableSelection: boolean | ((blockId: string) => boolean);
  enableDependency: boolean | ((blockId: string) => boolean);
  bottomSpacing: boolean;
  showAllBlocks: boolean;
  loadMoreBlocks?: () => void;
  updateBlockDates?: (updates: IBlockUpdateDependencyData[]) => Promise<void>;
  canLoadMoreBlocks?: boolean;
  quickAdd?: React.ReactNode | undefined;
  showToday: boolean;
  isEpic?: boolean;
};

const timelineViewHelpers = {
  week: weekView,
  month: monthView,
  quarter: quarterView,
};

export const ChartViewRoot = observer(function ChartViewRoot(props: ChartViewRootProps) {
  const {
    border,
    title,
    blockIds,
    loadMoreBlocks,
    loaderTitle,
    blockUpdateHandler,
    sidebarToRender,
    blockToRender,
    canLoadMoreBlocks,
    enableBlockLeftResize,
    enableBlockRightResize,
    enableBlockMove,
    enableReorder,
    enableAddBlock,
    enableSelection,
    enableDependency,
    bottomSpacing,
    showAllBlocks,
    quickAdd,
    showToday,
    updateBlockDates,
    isEpic = false,
  } = props;
  const { t } = useTranslation();
  // states
  const [itemsContainerWidth, setItemsContainerWidth] = useState(0);
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [isViewControlsCollapsed, setIsViewControlsCollapsed] = useState(false);
  // hooks
  const {
    currentView,
    currentViewData,
    renderView,
    updateCurrentView,
    updateCurrentViewData,
    updateRenderView,
    updateAllBlocksOnChartChangeWhileDragging,
  } = useTimeLineChartStore();
  const { data } = useUserProfile();
  const startOfWeek = data?.start_of_the_week;
  const { sidebarWidth } = useGanttSidebarWidth();
  const hasBoardWallpaper = useBoardHubHasBackground();

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

  const scrollGanttToDate = useCallback((currentState: ChartDataType, date: Date) => {
    const scrollContainer = document.querySelector("#gantt-container") as HTMLDivElement | null;
    if (!scrollContainer) return;

    const clientVisibleWidth = scrollContainer.clientWidth;
    const daysDifference = getNumberOfDaysBetweenTwoDates(currentState.data.startDate, date);
    const scrollWidth =
      Math.abs(daysDifference) * currentState.data.dayWidth -
      (clientVisibleWidth / 2 - currentState.data.dayWidth) +
      sidebarWidth / 2;

    scrollContainer.scrollLeft = Math.max(0, scrollWidth);
  }, [sidebarWidth]);

  const updateItemsContainerWidth = useCallback((width: number) => {
    const scrollContainer = document.querySelector("#gantt-container") as HTMLDivElement;
    if (!scrollContainer) return;
    setItemsContainerWidth(width + scrollContainer.scrollLeft);
  }, []);

  const updateCurrentLeftScrollPosition = useCallback((width: number) => {
    const scrollContainer = document.querySelector("#gantt-container") as HTMLDivElement;
    if (!scrollContainer) return;

    scrollContainer.scrollLeft = width + scrollContainer.scrollLeft;
  }, []);

  const updateCurrentViewRenderPayload = useCallback(
    (side: null | "left" | "right", view: TGanttViews, targetDate?: Date) => {
      const selectedCurrentView: TGanttViews = view;
      const baseViewData: ChartDataType | undefined =
        selectedCurrentView && selectedCurrentView === currentViewData?.key
          ? currentViewData
          : currentViewDataWithView(view);
      const selectedCurrentViewData = withGanttChartFocusDate(baseViewData, targetDate);

      if (selectedCurrentViewData === undefined) return;

      const currentViewHelpers = timelineViewHelpers[selectedCurrentView];
      const currentRender = currentViewHelpers.generateChart(
        selectedCurrentViewData,
        side,
        targetDate,
        startOfWeek
      );
      const mergeRenderPayloads = currentViewHelpers.mergeRenderPayloads as (
        a: IWeekBlock[] | IMonthView | IMonthBlock[],
        b: IWeekBlock[] | IMonthView | IMonthBlock[]
      ) => IWeekBlock[] | IMonthView | IMonthBlock[];

      if (currentRender.payload) {
        updateCurrentViewData(currentRender.state);

        if (side === "left") {
          updateCurrentView(selectedCurrentView);
          updateRenderView(
            renderView ? mergeRenderPayloads(currentRender.payload, renderView) : currentRender.payload
          );
          updateItemsContainerWidth(currentRender.scrollWidth);
          if (!targetDate) updateCurrentLeftScrollPosition(currentRender.scrollWidth);
          updateAllBlocksOnChartChangeWhileDragging(currentRender.scrollWidth);
          setItemsContainerWidth((prev) => prev + currentRender.scrollWidth);
        } else if (side === "right") {
          updateCurrentView(view);
          updateRenderView(
            renderView ? mergeRenderPayloads(renderView, currentRender.payload) : currentRender.payload
          );
          setItemsContainerWidth((prev) => prev + currentRender.scrollWidth);
        } else {
          updateCurrentView(view);
          updateRenderView(currentRender.payload);
          setItemsContainerWidth(currentRender.scrollWidth);
          const centerDate = targetDate ?? currentRender.state.data.currentDate;
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              scrollGanttToDate(currentRender.state, centerDate);
            });
          });
        }
      }

      return currentRender.state;
    },
    [
      currentViewData,
      renderView,
      scrollGanttToDate,
      startOfWeek,
      updateAllBlocksOnChartChangeWhileDragging,
      updateCurrentLeftScrollPosition,
      updateCurrentView,
      updateCurrentViewData,
      updateItemsContainerWidth,
      updateRenderView,
    ]
  );

  const handleToday = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Já em Semana e hoje visível: só recentra o scroll (sem mudar escala nem preferência).
    if (currentView === "week" && currentViewData?.data?.startDate && currentViewData?.data?.endDate) {
      const rangeStart = new Date(currentViewData.data.startDate);
      const rangeEnd = new Date(currentViewData.data.endDate);
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd.setHours(23, 59, 59, 999);

      if (today >= rangeStart && today <= rangeEnd) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollGanttToDate(currentViewData, today);
          });
        });
        return;
      }
    }

    // Em Mês/Trimestre: mudar para Semana centrada em hoje (não persiste — preferência mantém Mês/Trimestre).
    updateCurrentViewRenderPayload(null, "week", today);
  }, [currentView, currentViewData, scrollGanttToDate, updateCurrentViewRenderPayload]);

  const handleChartView = useCallback(
    (view: TGanttViews) => {
      if (workspaceSlug) {
        saveGanttChartView(workspaceSlug, ganttViewScope, view);
      }
      updateCurrentViewRenderPayload(null, view, new Date());
    },
    [ganttViewScope, updateCurrentViewRenderPayload, workspaceSlug]
  );

  const lastGanttScopeKeyRef = useRef<string>("");

  // Restore preferred scale and center on today when opening the chart or switching board/project/module.
  useEffect(() => {
    if (!workspaceSlug) return;

    const scopeKey = `${workspaceSlug}::${ganttViewScope}`;
    if (lastGanttScopeKeyRef.current === scopeKey) return;
    lastGanttScopeKeyRef.current = scopeKey;

    const savedView = getSavedGanttChartView(workspaceSlug, ganttViewScope);
    const initialView = savedView ?? currentView;

    if (savedView) {
      updateCurrentView(savedView);
    }

    updateCurrentViewRenderPayload(null, initialView, new Date());
  }, [workspaceSlug, ganttViewScope, updateCurrentViewRenderPayload, updateCurrentView, currentView]);

  const portalContainer = document.getElementById("full-screen-portal") as HTMLElement;

  const content = (
    <div
      className={cn("relative flex h-full flex-col rounded-xs shadow select-none", {
        "inset-0 z-[25] bg-surface-1": fullScreenMode,
        "border-[0.5px] border-subtle bg-surface-1": !fullScreenMode && hasBoardWallpaper,
        "border-[0.5px] border-subtle bg-surface-1/90 backdrop-blur-sm": !fullScreenMode && !hasBoardWallpaper,
      })}
    >
      <GanttChartHeader
        blockIds={blockIds}
        fullScreenMode={fullScreenMode}
        toggleFullScreenMode={() => setFullScreenMode((prevData) => !prevData)}
        handleChartView={handleChartView}
        handleToday={handleToday}
        loaderTitle={loaderTitle}
        showToday={showToday}
      />
      <GanttChartMainContent
        blockIds={blockIds}
        loadMoreBlocks={loadMoreBlocks}
        canLoadMoreBlocks={canLoadMoreBlocks}
        blockToRender={blockToRender}
        blockUpdateHandler={blockUpdateHandler}
        bottomSpacing={bottomSpacing}
        enableBlockLeftResize={enableBlockLeftResize}
        enableBlockMove={enableBlockMove}
        enableBlockRightResize={enableBlockRightResize}
        enableReorder={enableReorder}
        enableSelection={enableSelection}
        enableAddBlock={enableAddBlock}
        enableDependency={enableDependency}
        itemsContainerWidth={itemsContainerWidth}
        showAllBlocks={showAllBlocks}
        sidebarToRender={sidebarToRender}
        title={title}
        updateCurrentViewRenderPayload={updateCurrentViewRenderPayload}
        quickAdd={quickAdd}
        updateBlockDates={updateBlockDates}
        isEpic={isEpic}
      />

    </div>
  );

  // Bottom bar rendered via portal into document.body so `position:fixed`
  // is always relative to the real viewport, regardless of parent transforms.
  const floatingBar = createPortal(
    <div
      style={{ position: "fixed", bottom: "16px", right: "16px", zIndex: 9999 }}
      className="flex items-center gap-0.5 rounded-lg border border-subtle bg-surface-1 px-2 py-1.5 shadow-lg"
    >
      {!isViewControlsCollapsed && (
        <>
          {showToday && (
            <button
              type="button"
              className="rounded-md px-2 py-1 text-11 font-medium text-secondary hover:bg-layer-transparent-hover"
              onClick={handleToday}
            >
              {t("common.today")}
            </button>
          )}
          {showToday && <div className="mx-1 h-4 w-px bg-subtle" />}
          {VIEWS_LIST.map((chartView: any) => (
            <button
              key={chartView?.key}
              type="button"
              className={cn(
                "rounded-md px-2 py-1 text-11 font-medium transition-colors",
                currentView === chartView?.key
                  ? "bg-accent-primary text-on-color"
                  : "text-secondary hover:bg-layer-transparent-hover"
              )}
              onClick={() => handleChartView(chartView?.key)}
            >
              {t(chartView?.i18n_title)}
            </button>
          ))}
          <div className="mx-1 h-4 w-px bg-subtle" />
        </>
      )}
      <button
        type="button"
        title={isViewControlsCollapsed ? "Expandir controles" : "Recolher controles"}
        className="flex items-center justify-center rounded-md p-1 text-secondary transition-all hover:bg-layer-transparent-hover"
        onClick={() => setIsViewControlsCollapsed((v) => !v)}
      >
        {isViewControlsCollapsed ? (
          <ChevronLeft className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>
    </div>,
    document.body
  );

  return (
    <>
      {fullScreenMode && portalContainer ? createPortal(content, portalContainer) : content}
      {floatingBar}
    </>
  );
});
