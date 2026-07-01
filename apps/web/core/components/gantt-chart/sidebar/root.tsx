import type { RefObject } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
// components
import type { IBlockUpdateData } from "@operoz/types";
import { Row, ERowVariant } from "@operoz/ui";
import { cn } from "@operoz/utils";
import { BOARD_HUB_GANTT_SURFACE, useBoardHubHasBackground } from "@/components/board/board-hub-background";
import { MultipleSelectGroupAction } from "@/components/core/multiple-select";
// helpers
// hooks
import type { TSelectionHelper } from "@/hooks/use-multiple-select";
// constants
import { useGanttSidebarWidth } from "../contexts/gantt-sidebar-width";
import { GanttSidebarResizeHandle } from "./gantt-sidebar-resize-handle";
import { GANTT_SELECT_GROUP, HEADER_HEIGHT, GANTT_CHECKBOX_GUTTER_PX } from "../constants";

type Props = {
  blockIds: string[];
  blockUpdateHandler: (block: any, payload: IBlockUpdateData) => void;
  canLoadMoreBlocks?: boolean;
  loadMoreBlocks?: () => void;
  ganttContainerRef: RefObject<HTMLDivElement>;
  enableReorder: boolean | ((blockId: string) => boolean);
  enableSelection: boolean | ((blockId: string) => boolean);
  sidebarToRender: (props: any) => React.ReactNode;
  title: string;
  selectionHelpers: TSelectionHelper;
  showAllBlocks?: boolean;
  isEpic?: boolean;
  showDurationColumn?: boolean;
};

export const GanttChartSidebar = observer(function GanttChartSidebar(props: Props) {
  const { t } = useTranslation();
  const {
    blockIds,
    blockUpdateHandler,
    enableReorder,
    enableSelection,
    sidebarToRender,
    loadMoreBlocks,
    canLoadMoreBlocks,
    ganttContainerRef,
    title,
    selectionHelpers,
    showAllBlocks = false,
    isEpic = false,
    showDurationColumn = false,
  } = props;

  const selectionEnabled = Boolean(enableSelection);
  const { sidebarWidth, isResizing } = useGanttSidebarWidth();
  const hasBoardWallpaper = useBoardHubHasBackground();
  const ganttSurface = hasBoardWallpaper ? BOARD_HUB_GANTT_SURFACE : "bg-surface-1";

  return (
    <Row
      // DO NOT REMOVE THE ID
      id="gantt-sidebar"
      className={cn(
        "sticky left-0 z-10 h-max min-h-full flex-shrink-0 border-r-[0.5px] border-subtle-1",
        ganttSurface,
        !isResizing && "transition-[width] duration-150 ease-out"
      )}
      style={{
        width: `${sidebarWidth}px`,
      }}
      variant={ERowVariant.HUGGING}
    >
      <Row
        className={cn(
          "group/list-header sticky top-0 z-10 box-border flex flex-shrink-0 items-end justify-between gap-2 border-b-[0.5px] border-subtle-1 pr-4 pb-2 text-13 font-medium text-tertiary",
          ganttSurface
        )}
        style={{
          height: `${HEADER_HEIGHT}px`,
        }}
      >
        <div
          className={cn("flex min-w-0 flex-1 items-center gap-2", {
            "pl-8": selectionEnabled,
          })}
        >
          {selectionEnabled && (
            <div
              className="absolute left-2 flex w-3.5 flex-shrink-0 items-center"
              style={{ width: `${GANTT_CHECKBOX_GUTTER_PX - 8}px` }}
            >
              <MultipleSelectGroupAction
                className="size-3.5 !outline-none"
                groupID={GANTT_SELECT_GROUP}
                selectionHelpers={selectionHelpers}
              />
            </div>
          )}
          <h6 className="truncate">{title}</h6>
        </div>
        {showDurationColumn ? <h6 className="flex-shrink-0">{t("common.duration")}</h6> : null}
      </Row>

      <Row variant={ERowVariant.HUGGING} className={cn("h-max min-h-full", ganttSurface)}>
        {sidebarToRender &&
          sidebarToRender({
            title,
            blockUpdateHandler,
            blockIds,
            enableReorder,
            enableSelection,
            canLoadMoreBlocks,
            ganttContainerRef,
            loadMoreBlocks,
            selectionHelpers,
            showAllBlocks,
            isEpic,
            showDurationColumn,
          })}
      </Row>
      <GanttSidebarResizeHandle />
    </Row>
  );
});
