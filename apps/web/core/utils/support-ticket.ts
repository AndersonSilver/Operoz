import type { EInboxIssueSource, TSupportTicketMetadata } from "@operoz/types";

export type TInboxSourcePill = {
  source: EInboxIssueSource;
  formName?: string | null;
};

const SOURCE_LABELS: Record<string, string> = {
  IN_APP: "inbox_issue.source.in_app",
  FORMS: "inbox_issue.source.forms",
  PUBLIC_FORM: "inbox_issue.source.public_form",
  EMAIL: "inbox_issue.source.email",
};

export function getInboxSourceLabelKey(source: EInboxIssueSource): string {
  return SOURCE_LABELS[source] ?? "inbox_issue.source.in_app";
}

export function getSupportTicketThemeClass(theme?: string | null): string {
  switch (theme) {
    case "incident":
      return "border-danger-subtle bg-danger-subtle/40 text-danger-primary";
    case "support":
      return "border-accent-subtle bg-accent-subtle/30 text-accent-primary";
    case "minimal":
      return "border-subtle bg-layer-2 text-secondary";
    default:
      return "border-subtle bg-layer-2 text-secondary";
  }
}

export function shouldShowSlaBadge(metadata?: TSupportTicketMetadata, status?: number): boolean {
  if (!metadata || status !== -2) return false;
  return Boolean(metadata.sla_breached);
}

/** Evita "CANOPUS · Canopus" quando identificador e nome são equivalentes. */
export function formatClientProjectLabel(identifier?: string | null, name?: string | null): string {
  const id = identifier?.trim() ?? "";
  const label = name?.trim() ?? "";
  if (!label && !id) return "";
  if (!id) return label;
  if (!label) return id;
  if (id.toLowerCase() === label.toLowerCase()) return label;
  return `${id} · ${label}`;
}
