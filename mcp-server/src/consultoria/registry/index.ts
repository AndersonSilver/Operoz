import { CARD_OPERATIONS } from "./cards.js";
import { MODULE_OPERATIONS } from "./modules.js";
import { PRD_OPERATIONS } from "./prd.js";
import { PROJECT_OPERATIONS } from "./projects.js";
import { TASK_OPERATIONS } from "./tasks.js";
import type { ConsultoriaOperation } from "./types.js";

export const ALL_CONSULTORIA_OPERATIONS: ConsultoriaOperation[] = [
  ...PROJECT_OPERATIONS,
  ...MODULE_OPERATIONS,
  ...CARD_OPERATIONS,
  ...TASK_OPERATIONS,
  ...PRD_OPERATIONS,
];

export const CONSULTORIA_OPERATIONS_BY_NAME = new Map(ALL_CONSULTORIA_OPERATIONS.map((o) => [o.name, o]));

export function groupByDomain(): Record<string, string[]> {
  const groups: Record<string, string[]> = {};
  for (const op of ALL_CONSULTORIA_OPERATIONS) {
    if (!groups[op.domain]) groups[op.domain] = [];
    groups[op.domain].push(op.name);
  }
  return groups;
}
