import { observer } from "mobx-react";
import { Tooltip } from "@operis/propel/tooltip";
import { findTotalDaysInRange } from "@operis/utils";
import { useGanttSidebarWidth } from "@/components/gantt-chart/contexts/gantt-sidebar-width";
import { useProject } from "@/hooks/store/use-project";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  projectId: string;
  startDate?: string;
  targetDate?: string;
  name: string;
};

export const BoardProjectGanttBlock = observer(function BoardProjectGanttBlock(props: Props) {
  const { projectId, startDate, targetDate, name } = props;
  const { getPartialProjectById } = useProject();
  const { isMobile } = usePlatformOS();
  const { sidebarWidth } = useGanttSidebarWidth();

  const project = getPartialProjectById(projectId);
  const duration = findTotalDaysInRange(startDate, targetDate) || 0;

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
      <div className="relative flex h-full w-full items-center rounded-sm border border-subtle bg-layer-2">
        <div className="absolute top-0 left-0 h-full w-full bg-surface-1/30" />
        <div
          className="sticky w-auto truncate overflow-hidden px-2.5 py-1 text-13 font-medium text-primary"
          style={{ left: `${sidebarWidth}px` }}
        >
          {project?.identifier ? `${project.identifier} · ` : ""}
          {name}
        </div>
      </div>
    </Tooltip>
  );
});
