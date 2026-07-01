"use client";

import { useMemo } from "react";
import { observer } from "mobx-react";
import { findTotalDaysInRange } from "@operoz/utils";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";

/** Linha vertical do dia atual (estilo Jira). */
export const GanttTodayLine = observer(function GanttTodayLine() {
  const { currentViewData } = useTimeLineChartStore();

  const left = useMemo(() => {
    if (!currentViewData) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const rangeStart = new Date(currentViewData.data.startDate);
    const rangeEnd = new Date(currentViewData.data.endDate);
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(0, 0, 0, 0);

    if (today < rangeStart || today > rangeEnd) return null;

    const dayWidth = currentViewData.data.dayWidth;
    const daysFromStart = findTotalDaysInRange(rangeStart, today, false) ?? 0;

    return daysFromStart * dayWidth + dayWidth / 2;
  }, [currentViewData]);

  if (left == null) return null;

  return (
    <div
      className="pointer-events-none absolute inset-y-0 z-[6] w-px bg-[#2684FF]"
      style={{ left: `${left}px` }}
      aria-hidden
    />
  );
});
