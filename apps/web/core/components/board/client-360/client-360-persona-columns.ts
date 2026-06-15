import type {
  Client360TableColumnConfig,
  Client360TableColumnId,
} from "@/components/board/client-360/client-360-table-columns";
import { normalizeClient360TableColumns } from "@/components/board/client-360/client-360-table-columns";
import type { Client360Persona } from "@/components/board/client-360/use-client-360-persona";

const ALL_IDS: Client360TableColumnId[] = [
  "board",
  "health",
  "report",
  "overdue",
  "support",
  "utilization",
  "margin",
  "intake",
  "blockers",
  "throughput",
  "stakeholder",
  "responsible",
];

const MANAGEMENT_VISIBLE = new Set<Client360TableColumnId>([
  "board",
  "health",
  "report",
  "utilization",
  "margin",
  "overdue",
  "support",
  "stakeholder",
  "responsible",
]);

const PM_VISIBLE = new Set<Client360TableColumnId>([
  "board",
  "health",
  "overdue",
  "support",
  "intake",
  "blockers",
  "throughput",
]);

export function tableColumnsForPersona(persona: Client360Persona, includeBoard: boolean): Client360TableColumnConfig[] {
  const visible = persona === "pm" ? PM_VISIBLE : MANAGEMENT_VISIBLE;
  const columns = ALL_IDS.filter((id) => includeBoard || id !== "board").map((id) => ({
    id,
    visible: visible.has(id),
  }));
  return normalizeClient360TableColumns(columns, includeBoard);
}
