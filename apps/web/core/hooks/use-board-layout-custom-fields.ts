import { useMemo } from "react";
import useSWR from "swr";
import type {
  IBoardCustomField,
  IIssueDisplayProperties,
  IProjectCustomFieldLite,
  TCustomFieldValue,
} from "@operoz/types";
import { useBoardCustomField } from "@/hooks/store/use-board-custom-field";

const LAYOUT_FIELD_TYPES = new Set(["date", "datetime"]);

export function isBoardLayoutCustomField(field: IProjectCustomFieldLite | IBoardCustomField): boolean {
  return LAYOUT_FIELD_TYPES.has(field.field_type);
}

export function isCustomFieldVisible(fieldId: string, displayProperties: IIssueDisplayProperties | undefined): boolean {
  const map = displayProperties?.custom_fields;
  if (!map) return true;
  return map[fieldId] !== false;
}

export function getIssueCustomFieldValue(
  issueValues: Record<string, TCustomFieldValue> | undefined,
  fieldId: string
): TCustomFieldValue | undefined {
  const raw = issueValues?.[fieldId];
  if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean" || raw === null) {
    return raw;
  }
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "object" && raw !== null && "member_id" in raw) {
    return raw as TCustomFieldValue;
  }
  return undefined;
}

type Args = {
  workspaceSlug: string;
  boardSlug: string | undefined;
  displayProperties?: IIssueDisplayProperties;
};

export function useBoardLayoutCustomFields({ workspaceSlug, boardSlug, displayProperties }: Args) {
  const { fetchBoardCustomFields, getBoardCustomFields } = useBoardCustomField();

  useSWR(
    workspaceSlug && boardSlug ? `BOARD_LAYOUT_CUSTOM_FIELDS_${workspaceSlug}_${boardSlug}` : null,
    () => fetchBoardCustomFields(workspaceSlug, boardSlug!),
    { revalidateOnFocus: false }
  );

  const fields = useMemo(() => {
    if (!boardSlug) return [] as IProjectCustomFieldLite[];
    return getBoardCustomFields(workspaceSlug, boardSlug)
      .filter((row) => row.is_enabled && row.custom_field_id && row.is_active !== false)
      .filter((row) => isBoardLayoutCustomField(row))
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name))
      .map(
        (row): IProjectCustomFieldLite => ({
          id: row.custom_field_id!,
          name: row.name,
          key: row.key,
          description: row.description,
          field_type: row.field_type,
          settings: row.settings ?? {},
        })
      );
  }, [boardSlug, getBoardCustomFields, workspaceSlug]);

  const visibleFields = useMemo(
    () => fields.filter((field) => isCustomFieldVisible(field.id, displayProperties)),
    [fields, displayProperties]
  );

  return { fields, visibleFields };
}
