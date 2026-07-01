import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  ClipboardList,
  Clock,
  DollarSign,
  Gauge,
  Headphones,
  Inbox,
  LayoutGrid,
} from "lucide-react";
import type { TClient360Client } from "@operoz/types";

export type Client360FilterKey =
  | "all"
  | "critical"
  | "warning"
  | "score_alert"
  | "report_missing"
  | "overdue"
  | "support_open"
  | "intake_pending"
  | "blockers"
  | "sla_breach"
  | "finops_alert";

export const CLIENT_360_FILTER_PARAM = "filter";

const VALID_FILTER_KEYS = new Set<Client360FilterKey>([
  "all",
  "critical",
  "warning",
  "score_alert",
  "report_missing",
  "overdue",
  "support_open",
  "intake_pending",
  "blockers",
  "sla_breach",
  "finops_alert",
]);

export function parseClient360FilterParam(raw: string | null): Client360FilterKey {
  if (raw && VALID_FILTER_KEYS.has(raw as Client360FilterKey)) {
    return raw as Client360FilterKey;
  }
  return "all";
}

export const CLIENT_360_FILTER_OPTIONS: {
  key: Client360FilterKey;
  labelKey: string;
  icon: LucideIcon;
}[] = [
  { key: "all", labelKey: "boards.client_360.filter_all", icon: LayoutGrid },
  { key: "critical", labelKey: "boards.client_360.filter_critical", icon: AlertTriangle },
  { key: "warning", labelKey: "boards.client_360.filter_warning", icon: AlertCircle },
  { key: "score_alert", labelKey: "boards.client_360.filter_score_alert", icon: Gauge },
  { key: "report_missing", labelKey: "boards.client_360.filter_report_missing", icon: ClipboardList },
  { key: "overdue", labelKey: "boards.client_360.filter_overdue", icon: Clock },
  { key: "support_open", labelKey: "boards.client_360.filter_support_open", icon: Headphones },
  { key: "intake_pending", labelKey: "boards.client_360.filter_intake_pending", icon: Inbox },
  { key: "blockers", labelKey: "boards.client_360.filter_blockers", icon: Ban },
  { key: "sla_breach", labelKey: "boards.client_360.filter_sla_breach", icon: AlertTriangle },
  { key: "finops_alert", labelKey: "boards.client_360.filter_finops_alert", icon: DollarSign },
];

export function filterClient360Clients(clients: TClient360Client[], filter: Client360FilterKey): TClient360Client[] {
  switch (filter) {
    case "critical":
      return clients.filter((c) => c.health === "critical");
    case "warning":
      return clients.filter((c) => c.health === "warning");
    case "score_alert":
      return clients.filter((c) => c.health_score_alert);
    case "report_missing":
      return clients.filter((c) => c.status_report.coverage === "missing");
    case "overdue":
      return clients.filter((c) => c.issues.overdue > 0);
    case "support_open":
      return clients.filter((c) => c.support.open_count > 0);
    case "intake_pending":
      return clients.filter((c) => (c.intake?.pending ?? 0) > 0);
    case "blockers":
      return clients.filter((c) => (c.blockers?.count ?? 0) > 0);
    case "sla_breach":
      return clients.filter((c) => c.support_sla?.breached);
    case "finops_alert":
      return clients.filter((c) => c.finops?.finops_alert);
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
