/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TGanttViews } from "@plane/types";

const STORAGE_KEY = "plane_gantt_chart_view_preferences";

const VALID_VIEWS: TGanttViews[] = ["week", "month", "quarter"];

type GanttViewPreferences = Record<string, TGanttViews>;

const buildScopeKey = (workspaceSlug: string, scope: string) => `${workspaceSlug}::${scope}`;

const readPreferences = (): GanttViewPreferences => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as GanttViewPreferences;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writePreferences = (preferences: GanttViewPreferences) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // ignore quota / private mode
  }
};

export type GanttChartViewScopeParams = {
  boardSlug?: string;
  projectId?: string;
  moduleId?: string;
  cycleId?: string;
};

/**
 * Scope key for persisting week | month | quarter per workspace context.
 */
export const resolveGanttChartViewScope = (params: GanttChartViewScopeParams): string => {
  const { boardSlug, projectId, moduleId, cycleId } = params;
  if (boardSlug) return `board:${boardSlug}`;
  if (projectId && moduleId) return `module:${projectId}:${moduleId}`;
  if (projectId && cycleId) return `cycle:${projectId}:${cycleId}`;
  if (projectId) return `project:${projectId}`;
  return "workspace";
};

export const getSavedGanttChartView = (
  workspaceSlug: string,
  scope: string
): TGanttViews | undefined => {
  const view = readPreferences()[buildScopeKey(workspaceSlug, scope)];
  return view && VALID_VIEWS.includes(view) ? view : undefined;
};

export const saveGanttChartView = (workspaceSlug: string, scope: string, view: TGanttViews) => {
  if (!VALID_VIEWS.includes(view)) return;
  const preferences = readPreferences();
  preferences[buildScopeKey(workspaceSlug, scope)] = view;
  writePreferences(preferences);
};
