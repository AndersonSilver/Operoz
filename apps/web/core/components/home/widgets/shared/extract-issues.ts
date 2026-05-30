/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TIssue, TIssuesResponse } from "@plane/types";

export function extractIssuesFromResponse(response: TIssuesResponse | undefined, limit = 8): TIssue[] {
  if (!response?.results) return [];

  if (Array.isArray(response.results)) {
    return response.results.slice(0, limit);
  }

  const issues: TIssue[] = [];
  Object.values(response.results).forEach((group) => {
    if (group && typeof group === "object" && "results" in group && Array.isArray(group.results)) {
      issues.push(...group.results);
    }
  });

  return issues.slice(0, limit);
}
