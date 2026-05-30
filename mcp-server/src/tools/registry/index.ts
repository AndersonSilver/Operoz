import { APP_BOARD_OPERATIONS } from "./app-boards.js";
import { APP_INTEGRATION_OPERATIONS } from "./app-integrations.js";
import { APP_PAGE_OPERATIONS } from "./app-pages.js";
import { APP_PLANNING_OPERATIONS } from "./app-planning.js";
import { APP_PROJECT_OPERATIONS } from "./app-projects.js";
import { APP_WORK_ITEM_OPERATIONS } from "./app-work-items.js";
import { APP_WORKSPACE_OPERATIONS } from "./app-workspaces.js";
import { META_OPERATIONS } from "./meta.js";
import type { ToolOperation } from "./types.js";
import { V1_OPERATIONS } from "./v1.js";

function dedupeByName(operations: ToolOperation[]): ToolOperation[] {
  const seen = new Set<string>();
  const out: ToolOperation[] = [];
  for (const op of operations) {
    if (seen.has(op.name)) continue;
    seen.add(op.name);
    out.push(op);
  }
  return out;
}

export const ALL_OPERATIONS: ToolOperation[] = dedupeByName([
  ...META_OPERATIONS,
  ...V1_OPERATIONS,
  ...APP_WORKSPACE_OPERATIONS,
  ...APP_PROJECT_OPERATIONS,
  ...APP_WORK_ITEM_OPERATIONS,
  ...APP_PLANNING_OPERATIONS,
  ...APP_BOARD_OPERATIONS,
  ...APP_PAGE_OPERATIONS,
  ...APP_INTEGRATION_OPERATIONS,
]);

export const OPERATIONS_BY_NAME = new Map(ALL_OPERATIONS.map((o) => [o.name, o]));

export function groupByDomain(): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const operation of ALL_OPERATIONS) {
    if (!groups[operation.domain]) groups[operation.domain] = [];
    groups[operation.domain].push(operation.name);
  }
  return groups;
}
