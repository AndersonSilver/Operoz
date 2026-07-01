/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { addDays } from "date-fns/addDays";
import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays";
import type { IIssueDisplayFilterOptions, IssuePaginationOptions } from "@plane/types";
import type { TIssue } from "@plane/types";
import { getDate, renderFormattedPayloadDate } from "@plane/utils";
import type { ICalendarStore } from "@/store/issue/issue_calendar_view.store";

type TIssuesFilterWithGet = {
  getIssueFilters?: (entityId: string) => { displayFilters?: IIssueDisplayFilterOptions } | undefined;
  issueFilters?: { displayFilters?: IIssueDisplayFilterOptions };
};

/** Usa entityId da URL (módulo/ciclo) em vez do getter do root store, que pode atrasar. */
export const resolveLayoutDisplayFilters = (
  issuesFilter: TIssuesFilterWithGet | undefined,
  entityId?: string
): IIssueDisplayFilterOptions | undefined => {
  if (entityId && issuesFilter?.getIssueFilters) {
    return issuesFilter.getIssueFilters(entityId)?.displayFilters;
  }

  return issuesFilter?.issueFilters?.displayFilters;
};

/** Opções de paginação para fetch do calendário (intervalo do mês/semana + group_by target_date). */
export const getCalendarPaginationOptions = (
  issueCalendarView: ICalendarStore,
  layout: "month" | "week" = "month"
): IssuePaginationOptions | undefined => {
  const { startDate, endDate } =
    issueCalendarView.getStartAndEndDate(layout) ??
    issueCalendarView.getMonthDateRange(issueCalendarView.calendarFilters.activeMonthDate) ??
    {};

  if (!startDate || !endDate) return undefined;

  return {
    canGroup: true,
    perPageCount: layout === "month" ? 4 : 30,
    before: endDate,
    after: startDate,
    groupedBy: "target_date",
  };
};

/** Módulo: todos os cards do módulo com data alvo/início (sem cortar ao mês visível na API). */
export const getModuleCalendarPaginationOptions = (): IssuePaginationOptions => ({
  canGroup: true,
  perPageCount: 100,
  groupedBy: "target_date",
});

export type TCalendarDateUpdatePayload = {
  start_date?: string;
  target_date: string;
};

export const buildCalendarDateUpdatePayload = (
  sourceDate: string,
  destinationDate: string,
  issueBeforeUpdate?: TIssue | null
): TCalendarDateUpdatePayload | null => {
  const normalizedSource = renderFormattedPayloadDate(sourceDate) ?? sourceDate;
  const normalizedDestination = renderFormattedPayloadDate(destinationDate) ?? destinationDate;

  if (!normalizedSource || !normalizedDestination || normalizedSource === normalizedDestination) return null;

  const payload: TCalendarDateUpdatePayload = {
    target_date: normalizedDestination,
  };

  if (issueBeforeUpdate?.start_date) {
    const sourceDay = getDate(normalizedSource);
    const destinationDay = getDate(normalizedDestination);
    const startDay = getDate(issueBeforeUpdate.start_date);

    if (sourceDay && destinationDay && startDay) {
      const dayDelta = differenceInCalendarDays(destinationDay, sourceDay);
      payload.start_date = renderFormattedPayloadDate(addDays(startDay, dayDelta));
    }
  }

  return payload;
};

export const handleDragDrop = async (
  issueId: string,
  sourceDate: string,
  destinationDate: string,
  workspaceSlug: string | undefined,
  projectId: string | undefined,
  updateIssue?: (projectId: string, issueId: string, data: Partial<TIssue>) => Promise<void>,
  issueBeforeUpdate?: TIssue | null
) => {
  if (!workspaceSlug || !projectId || !updateIssue) return;

  const payload = buildCalendarDateUpdatePayload(sourceDate, destinationDate, issueBeforeUpdate);
  if (!payload) return;

  return await updateIssue(projectId, issueId, payload);
};
