/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import type { TLogoProps } from "@plane/types";
import { useBoardIssueType } from "@/hooks/store/use-board-issue-type";

export function useBoardGanttIssueTypeLogoMap(workspaceSlug?: string, boardSlug?: string) {
  const { getBoardIssueTypes } = useBoardIssueType();
  const boardIssueTypes =
    workspaceSlug && boardSlug ? getBoardIssueTypes(workspaceSlug, boardSlug) : [];

  return useMemo(() => {
    const map = new Map<string, TLogoProps>();
    for (const item of boardIssueTypes) {
      if (!item.is_enabled) continue;
      map.set(item.issue_type_id, item.logo_props);
    }
    return map;
  }, [boardIssueTypes, boardSlug, workspaceSlug]);
}

export function resolveBoardGanttIssueTypeLogo(
  typeId: string | null | undefined,
  logoByTypeId: Map<string, TLogoProps>
): TLogoProps | undefined {
  if (!typeId) return undefined;
  return logoByTypeId.get(typeId);
}
