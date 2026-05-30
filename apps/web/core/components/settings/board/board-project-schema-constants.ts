import type { TProjectStandardFieldKey } from "@operis/types";

/** Campos de sistema do Projeto — criados automaticamente; não se apagam, só ocultam. */
export const PROJECT_STANDARD_FIELD_KEYS: TProjectStandardFieldKey[] = [
  "name",
  "identifier",
  "description",
  "project_lead",
  "responsible_stakeholder",
  "default_assignee",
  "network",
  "timezone",
];

export function isProjectStandardLayoutField(fieldSource: string) {
  return fieldSource === "system";
}
