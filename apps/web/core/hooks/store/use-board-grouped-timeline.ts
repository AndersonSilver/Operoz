import { GANTT_TIMELINE_TYPE } from "@operis/types";
import type { IBoardGroupedTimelineStore } from "@/store/timeline/board-grouped-timeline.store";
import { useTimeLineChart } from "@/hooks/use-timeline-chart";

export const useBoardGroupedTimelineStore = (): IBoardGroupedTimelineStore =>
  useTimeLineChart(GANTT_TIMELINE_TYPE.GROUPED) as IBoardGroupedTimelineStore;
