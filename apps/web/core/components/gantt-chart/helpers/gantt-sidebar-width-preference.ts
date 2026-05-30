/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { GANTT_SIDEBAR_MAX_WIDTH, GANTT_SIDEBAR_MIN_WIDTH, SIDEBAR_WIDTH } from "../constants";

const STORAGE_KEY = "plane_gantt_sidebar_width_preferences";

type GanttSidebarWidthPreferences = Record<string, number>;

const buildScopeKey = (workspaceSlug: string, scope: string) => `${workspaceSlug}::${scope}`;

const clampWidth = (width: number) =>
  Math.min(Math.max(Math.round(width), GANTT_SIDEBAR_MIN_WIDTH), GANTT_SIDEBAR_MAX_WIDTH);

const readPreferences = (): GanttSidebarWidthPreferences => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as GanttSidebarWidthPreferences;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writePreferences = (preferences: GanttSidebarWidthPreferences) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // ignore quota / private mode
  }
};

export const getSavedGanttSidebarWidth = (workspaceSlug: string, scope: string): number => {
  const stored = readPreferences()[buildScopeKey(workspaceSlug, scope)];
  if (typeof stored !== "number" || Number.isNaN(stored)) return SIDEBAR_WIDTH;
  return clampWidth(stored);
};

export const saveGanttSidebarWidth = (workspaceSlug: string, scope: string, width: number) => {
  const preferences = readPreferences();
  preferences[buildScopeKey(workspaceSlug, scope)] = clampWidth(width);
  writePreferences(preferences);
};
