import type { IGanttBlock } from "@operoz/types";
import { findTotalDaysInRange, renderFormattedDate } from "@operoz/utils";

export type GanttScheduleDisplay = {
  label: string;
  title?: string;
  isPlaceholder: boolean;
};

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export function getGanttScheduleDisplay(
  block: Pick<IGanttBlock, "start_date" | "target_date">,
  t: TranslateFn
): GanttScheduleDisplay {
  const days = findTotalDaysInRange(block.start_date, block.target_date);

  if (days && days > 0) {
    const startLabel = block.start_date ? renderFormattedDate(block.start_date) : "";
    const targetLabel = block.target_date ? renderFormattedDate(block.target_date) : "";

    return {
      label: t("issue.gantt.schedule_days", { count: days }),
      title: startLabel && targetLabel ? `${startLabel} – ${targetLabel}` : undefined,
      isPlaceholder: false,
    };
  }

  if (block.start_date && !block.target_date) {
    return {
      label: renderFormattedDate(block.start_date) ?? "—",
      title: t("issue.gantt.start_only_hint"),
      isPlaceholder: false,
    };
  }

  if (block.target_date && !block.start_date) {
    return {
      label: renderFormattedDate(block.target_date) ?? "—",
      title: t("issue.gantt.target_only_hint"),
      isPlaceholder: false,
    };
  }

  return {
    label: "—",
    title: t("issue.gantt.missing_dates_hint"),
    isPlaceholder: true,
  };
}
