import type { IBoardCustomField } from "@operis/types";

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export function getBoardFieldDisplayName(item: IBoardCustomField, t: TranslateFn): string {
  if (item.is_system && item.standard_field_key) {
    return t(`boards.settings.fields.standard_fields.${item.standard_field_key}`);
  }
  return item.name;
}
