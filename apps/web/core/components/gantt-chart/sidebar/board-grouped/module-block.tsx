import type { MouseEvent } from "react";
import { observer } from "mobx-react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ModuleStatusIcon } from "@operoz/propel/icons";
import type { IGanttBlock } from "@operoz/types";
import { Row } from "@operoz/ui";
import { cn } from "@operoz/utils";
import { useBoardLayout } from "@/components/board/board-layout-context";
import { BoardGanttRowIcon } from "@/components/board/gantt/board-gantt-row-icon";
import { BLOCK_HEIGHT } from "@/components/gantt-chart/constants";
import {
  getModuleIdFromBoardBlock,
  isBoardModuleBlockId,
} from "@/components/issues/issue-layouts/gantt/board-gantt.utils";
import { getGanttScheduleDisplay } from "@/components/gantt-chart/helpers/schedule-display";
import { useTranslation } from "@operoz/i18n";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import { useBoardGroupedTimelineStore } from "@/hooks/store/use-board-grouped-timeline";

type Props = {
  block: IGanttBlock;
  isDragging: boolean;
};

export const BoardModuleSidebarBlock = observer(function BoardModuleSidebarBlock(props: Props) {
  const { block, isDragging } = props;
  const { t } = useTranslation();
  const { board } = useBoardLayout();
  const { updateActiveBlockId, isBlockActive } = useTimeLineChartStore();
  const { toggleModuleCollapsed, isModuleCollapsed } = useBoardGroupedTimelineStore();

  const moduleId = isBoardModuleBlockId(block.id) ? getModuleIdFromBoardBlock(block.id) : (block.data?.id as string);
  const collapsed = moduleId ? isModuleCollapsed(moduleId) : false;

  const status = block.data?.status as string | undefined;
  const schedule = getGanttScheduleDisplay(block, t);

  if (!block?.data || !moduleId) return null;

  const handleToggleCollapse = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleModuleCollapsed(moduleId);
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
          "group flex w-full items-center gap-1 bg-layer-transparent pr-4 pl-6 hover:bg-layer-transparent-hover",
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
          aria-label={collapsed ? "Expandir módulo" : "Colapsar módulo"}
          onClick={handleToggleCollapse}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <BoardGanttRowIcon
          logo={board?.gantt_module_logo_props}
          size={14}
          fallback={
            <ModuleStatusIcon
              status={(status ?? "backlog") as import("@operoz/types").TModuleStatus}
              height="16px"
              width="16px"
            />
          }
        />
        <button
          type="button"
          className="flex h-full min-w-0 flex-1 cursor-pointer items-center truncate text-left text-13 font-medium text-primary hover:underline"
          onClick={handleToggleCollapse}
        >
          {block.name}
        </button>
        <span className="flex-shrink-0 text-13 text-secondary" title={schedule.title}>
          <span className={schedule.isPlaceholder ? "text-tertiary" : undefined}>{schedule.label}</span>
        </span>
      </Row>
    </div>
  );
});
