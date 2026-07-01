/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { isBoardGroupBlockId } from "@/components/issues/issue-layouts/gantt/board-gantt.utils";

type TGanttIssueFields = {
  start_date?: string | null;
  target_date?: string | null;
  type_id?: string | null;
};

/** MobX dependencies so gantt blocks refresh when issue schedule/type changes (not only when ids load). */
export function trackGanttIssueFields(
  blockIds: string[] | undefined,
  getIssueById: (id: string) => TGanttIssueFields | undefined,
  options?: { skipBoardGroupBlocks?: boolean }
) {
  if (!blockIds?.length) return;

  for (const blockId of blockIds) {
    if (options?.skipBoardGroupBlocks && isBoardGroupBlockId(blockId)) continue;
    const issue = getIssueById(blockId);
    void issue?.start_date;
    void issue?.target_date;
    void issue?.type_id;
  }
}
