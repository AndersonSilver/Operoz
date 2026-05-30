import type { LucideIcon } from "lucide-react";
import { AlertCircle, AlertTriangle, ClipboardList, Clock, Headphones, LayoutGrid } from "lucide-react";
import type { TClient360Client } from "@operis/types";

export type Client360FilterKey =
  | "all"
  | "critical"
  | "warning"
  | "report_missing"
  | "overdue"
  | "support_open";

export const CLIENT_360_FILTER_OPTIONS: {
  key: Client360FilterKey;
  labelKey: string;
  icon: LucideIcon;
}[] = [
  { key: "all", labelKey: "boards.client_360.filter_all", icon: LayoutGrid },
  { key: "critical", labelKey: "boards.client_360.filter_critical", icon: AlertTriangle },
  { key: "warning", labelKey: "boards.client_360.filter_warning", icon: AlertCircle },
  { key: "report_missing", labelKey: "boards.client_360.filter_report_missing", icon: ClipboardList },
  { key: "overdue", labelKey: "boards.client_360.filter_overdue", icon: Clock },
  { key: "support_open", labelKey: "boards.client_360.filter_support_open", icon: Headphones },
];

export function filterClient360Clients(
  clients: TClient360Client[],
  filter: Client360FilterKey
): TClient360Client[] {
  switch (filter) {
    case "critical":
      return clients.filter((c) => c.health === "critical");
    case "warning":
      return clients.filter((c) => c.health === "warning");
    case "report_missing":
      return clients.filter((c) => c.status_report.coverage === "missing");
    case "overdue":
      return clients.filter((c) => c.issues.overdue > 0);
    case "support_open":
      return clients.filter((c) => c.support.open_count > 0);
    default:
      return clients;
  }
}

export function searchClient360Clients(clients: TClient360Client[], query: string): TClient360Client[] {
  const q = query.trim().toLowerCase();
  if (!q) return clients;
  return clients.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.identifier.toLowerCase().includes(q) ||
      c.responsible_stakeholder.toLowerCase().includes(q) ||
      (c.project_lead?.display_name || "").toLowerCase().includes(q)
  );
}
