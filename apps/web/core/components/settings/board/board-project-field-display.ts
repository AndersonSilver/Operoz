import type { IBoardProjectFieldLayout } from "@operoz/types";

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export function getBoardProjectFieldDisplayName(item: IBoardProjectFieldLayout, t: TranslateFn): string {
  if (item.field_source === "system" && item.standard_field_key) {
    return t(`boards.settings.project_schema.standard_fields.${item.standard_field_key}`);
  }
  return item.name;
}
