import { observer } from "mobx-react";
import { MODULE_STATUS } from "@operoz/constants";
import { ModuleStatusIcon } from "@operoz/propel/icons";
import { Tooltip } from "@operoz/propel/tooltip";
import type { TModuleStatus } from "@operoz/types";
import { findTotalDaysInRange } from "@operoz/utils";
import { useGanttSidebarWidth } from "@/components/gantt-chart/contexts/gantt-sidebar-width";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  name: string;
  status?: TModuleStatus | null;
  startDate?: string;
  targetDate?: string;
};

export const BoardModuleGanttBlock = observer(function BoardModuleGanttBlock(props: Props) {
  const { name, status, startDate, targetDate } = props;
  const { isMobile } = usePlatformOS();
  const { sidebarWidth } = useGanttSidebarWidth();

  const duration = findTotalDaysInRange(startDate, targetDate) || 0;
  const statusColor = MODULE_STATUS.find((s) => s.value === (status ?? "backlog"))?.color ?? "";

  return (
    <Tooltip
      isMobile={isMobile}
      tooltipContent={
        <div className="space-y-1">
          <h5>{name}</h5>
          {duration > 0 && (
            <div>
              {duration} day{duration > 1 ? "s" : ""}
            </div>
          )}
        </div>
      }
      position="top-start"
    >
      <div
        className="relative flex h-full w-full items-center rounded-sm border border-subtle"
        style={{ backgroundColor: statusColor ? `${statusColor}22` : undefined }}
      >
        <div className="absolute top-0 left-0 h-full w-full bg-surface-1/40" />
        <div
          className="sticky flex w-auto min-w-0 items-center gap-1.5 truncate overflow-hidden px-2.5 py-1 text-13 font-medium text-primary"
          style={{ left: `${sidebarWidth}px` }}
        >
          <ModuleStatusIcon status={status ?? "backlog"} height="14px" width="14px" />
          {name}
        </div>
      </div>
    </Tooltip>
  );
});
