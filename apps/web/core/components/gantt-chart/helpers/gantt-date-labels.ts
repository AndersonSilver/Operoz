import type { TLanguage } from "@operoz/i18n";

export function formatGanttWeekMonthRangeTitle(startDate: Date, endDate: Date, locale: TLanguage): string {
  const sameMonth = startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear();

  if (sameMonth) {
    return new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" }).format(startDate);
  }

  const start = new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" }).format(startDate);
  const end = new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" }).format(endDate);
  return `${start} - ${end}`;
}

export function formatGanttMonthTitle(date: Date, locale: TLanguage): string {
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(date);
}
