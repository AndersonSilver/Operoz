import type { TCustomFieldType } from "@operis/types";

/** Ordem e tipos do picker de criar campo no workspace. */
export const JIRA_CUSTOM_FIELD_TYPES: TCustomFieldType[] = [
  "text",
  "paragraph",
  "date",
  "number",
  "datetime",
  "categories",
  "select",
  "checkbox",
  "member",
  "multi_select",
  "url",
];

export const fieldTypeNeedsOptions = (fieldType: TCustomFieldType): boolean =>
  fieldType === "select" || fieldType === "multi_select" || fieldType === "categories";
