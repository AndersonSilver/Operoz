/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ChartDataType, TGanttViews } from "@plane/types";

export const shiftGanttFocusDate = (date: Date, view: TGanttViews, direction: -1 | 1): Date => {
  const next = new Date(date);

  if (view === "week") {
    next.setDate(next.getDate() + direction * 7);
    return next;
  }

  if (view === "quarter") {
    next.setMonth(next.getMonth() + direction * 3);
    return next;
  }

  next.setMonth(next.getMonth() + direction);
  return next;
};

const getWeekRange = (date: Date): { start: Date; end: Date } => {
  const start = new Date(date);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(0, 0, 0, 0);

  return { start, end };
};

const getQuarterRange = (date: Date): { start: Date; end: Date } => {
  const quarter = Math.floor(date.getMonth() / 3);
  const start = new Date(date.getFullYear(), quarter * 3, 1);
  const end = new Date(date.getFullYear(), quarter * 3 + 3, 0);
  return { start, end };
};

export const formatGanttPeriodLabel = (view: TGanttViews, date: Date, locale = "pt-BR"): string => {
  if (view === "month") {
    return new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" }).format(date);
  }

  if (view === "quarter") {
    const { start, end } = getQuarterRange(date);
    const startLabel = new Intl.DateTimeFormat(locale, { month: "short" }).format(start);
    const endLabel = new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" }).format(end);
    return `${startLabel} – ${endLabel}`;
  }

  const { start, end } = getWeekRange(date);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    const monthYear = new Intl.DateTimeFormat(locale, { month: "short", year: "numeric" }).format(start);
    return `${start.getDate()} – ${end.getDate()} ${monthYear}`;
  }

  const startLabel = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(start);
  const endLabel = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(end);
  return `${startLabel} – ${endLabel}`;
};

export const withGanttChartFocusDate = (
  viewData: ChartDataType | undefined,
  focusDate?: Date
): ChartDataType | undefined => {
  if (!viewData) return undefined;

  const resolvedFocus =
    focusDate && !Number.isNaN(focusDate.getTime()) ? new Date(focusDate) : new Date(viewData.data.currentDate);

  return {
    ...viewData,
    data: {
      ...viewData.data,
      currentDate: resolvedFocus,
    },
  };
};
