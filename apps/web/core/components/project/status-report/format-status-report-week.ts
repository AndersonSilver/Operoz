import type { useTranslation } from "@operoz/i18n";
import { getReportPeriodISOWeekInfo, renderFormattedDate } from "@operoz/utils";

function formatPeriodFallback(start: string, end: string): string {
  try {
    return `${renderFormattedDate(start)} — ${renderFormattedDate(end)}`;
  } catch {
    return `${start} — ${end}`;
  }
}

export function formatReportWeekLabel(start: string, end: string, t: ReturnType<typeof useTranslation>["t"]): string {
  const info = getReportPeriodISOWeekInfo(start, end);
  if (!info) {
    return formatPeriodFallback(start, end);
  }

  const today = new Date().toISOString().slice(0, 10);
  const currentIsoYear = getReportPeriodISOWeekInfo(today, today)?.startYear ?? new Date().getFullYear();
  const showYear =
    info.startYear !== currentIsoYear || info.endYear !== currentIsoYear || info.startYear !== info.endYear;

  if (info.startWeek === info.endWeek && info.startYear === info.endYear) {
    if (showYear) {
      return t("project.status_report.week_number_year", { week: info.startWeek, year: info.startYear });
    }
    return t("project.status_report.week_number", { week: info.startWeek });
  }

  if (info.startYear === info.endYear) {
    if (showYear) {
      return t("project.status_report.week_range_year", {
        startWeek: info.startWeek,
        endWeek: info.endWeek,
        year: info.startYear,
      });
    }
    return t("project.status_report.week_range", { startWeek: info.startWeek, endWeek: info.endWeek });
  }

  return t("project.status_report.week_range_cross_year", {
    startWeek: info.startWeek,
    startYear: info.startYear,
    endWeek: info.endWeek,
    endYear: info.endYear,
  });
}
