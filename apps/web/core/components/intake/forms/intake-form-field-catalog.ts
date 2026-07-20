import type { LucideIcon } from "lucide-react";
import {
  AlignLeft,
  AlertTriangle,
  AlarmClock,
  Calendar,
  CheckSquare,
  Circle,
  Clock,
  Hash,
  Link2,
  List,
  Paperclip,
  Tag,
  Ticket,
  Type,
  User,
} from "lucide-react";
import type {
  IBoardCustomField,
  TCustomFieldType,
  TIntakeFormCreatableFieldType,
  TIntakeFormField,
  TIntakeFormFieldType,
  IWorkspaceCustomField,
} from "@operoz/types";
import { v4 as uuidv4 } from "uuid";

export type TIntakeFormFieldCatalogItem = {
  type: TIntakeFormCreatableFieldType;
  labelKey: string;
  icon: LucideIcon;
  hasOptions?: boolean;
};

export const INTAKE_FORM_FIELD_CATALOG: TIntakeFormFieldCatalogItem[] = [
  { type: "text", labelKey: "project_settings.features.intake.forms.field_types.text", icon: Type },
  { type: "paragraph", labelKey: "project_settings.features.intake.forms.field_types.paragraph", icon: AlignLeft },
  { type: "datetime", labelKey: "project_settings.features.intake.forms.field_types.datetime", icon: Clock },
  {
    type: "select",
    labelKey: "project_settings.features.intake.forms.field_types.select",
    icon: List,
    hasOptions: true,
  },
  { type: "date", labelKey: "project_settings.features.intake.forms.field_types.date", icon: Calendar },
  { type: "number", labelKey: "project_settings.features.intake.forms.field_types.number", icon: Hash },
  {
    type: "labels",
    labelKey: "project_settings.features.intake.forms.field_types.labels",
    icon: Tag,
    hasOptions: true,
  },
  {
    type: "checkbox",
    labelKey: "project_settings.features.intake.forms.field_types.checkbox",
    icon: CheckSquare,
    hasOptions: true,
  },
  { type: "assignee", labelKey: "project_settings.features.intake.forms.field_types.assignee", icon: User },
  { type: "url", labelKey: "project_settings.features.intake.forms.field_types.url", icon: Link2 },
  {
    type: "attachment",
    labelKey: "project_settings.features.intake.forms.field_types.attachment",
    icon: Paperclip,
  },
  {
    type: "criticality",
    labelKey: "project_settings.features.intake.forms.field_types.criticality",
    icon: AlertTriangle,
    hasOptions: true,
  },
  { type: "ticket_number", labelKey: "project_settings.features.intake.forms.field_types.ticket_number", icon: Ticket },
  { type: "sla_due", labelKey: "project_settings.features.intake.forms.field_types.sla_due", icon: AlarmClock },
];

export function getCatalogItem(type: TIntakeFormFieldType): TIntakeFormFieldCatalogItem | undefined {
  return INTAKE_FORM_FIELD_CATALOG.find((item) => item.type === type);
}

export type TIntakeSelectableCustomField = {
  custom_field_id: string;
  name: string;
  field_type: TCustomFieldType;
  settings?: { options?: string[] };
  source: "workspace" | "board";
};

export function mapCustomFieldTypeToFormType(fieldType: TCustomFieldType): TIntakeFormCreatableFieldType {
  switch (fieldType) {
    case "paragraph":
      return "paragraph";
    case "date":
      return "date";
    case "datetime":
      return "datetime";
    case "number":
      return "number";
    case "select":
      return "select";
    case "multi_select":
      return "checkbox";
    case "categories":
      return "labels";
    case "checkbox":
      return "checkbox";
    case "member":
      return "assignee";
    case "url":
      return "url";
    default:
      return "text";
  }
}

export function mapBoardFieldToFormType(field: IBoardCustomField): TIntakeFormCreatableFieldType {
  return mapCustomFieldTypeToFormType(field.field_type);
}

export function fromWorkspaceCustomField(field: IWorkspaceCustomField): TIntakeSelectableCustomField {
  return {
    custom_field_id: field.id,
    name: field.name,
    field_type: field.field_type,
    settings: field.settings,
    source: "workspace",
  };
}

export function fromBoardCustomField(field: IBoardCustomField): TIntakeSelectableCustomField | null {
  if (!field.custom_field_id || field.is_system) return null;
  return {
    custom_field_id: field.custom_field_id,
    name: field.name,
    field_type: field.field_type,
    settings: field.settings,
    source: "board",
  };
}

export function createIntakeFormField(
  fieldType: TIntakeFormCreatableFieldType,
  label: string,
  source?: { custom_field_id?: string | null; settings?: { options?: string[] } }
): TIntakeFormField {
  const id = `field-${uuidv4().slice(0, 8)}`;
  const options = source?.settings?.options?.length
    ? [...source.settings.options]
    : fieldType === "criticality"
      ? ["p0", "p1", "p2", "p3", "p4", "not_incident"]
      : fieldType === "select" || fieldType === "checkbox" || fieldType === "labels"
        ? ["Opção 1"]
        : [];

  return {
    id,
    field_type: fieldType,
    label,
    help_text: "",
    required: false,
    form_span: "full",
    custom_field_id: source?.custom_field_id ?? undefined,
    options,
  };
}

export function createIntakeFormFieldFromCustomField(field: TIntakeSelectableCustomField): TIntakeFormField {
  const fieldType = mapCustomFieldTypeToFormType(field.field_type);
  return createIntakeFormField(fieldType, field.name, {
    custom_field_id: field.custom_field_id,
    settings: field.settings,
  });
}

export function fieldPreviewPlaceholderKey(fieldType: TIntakeFormFieldType): string {
  switch (fieldType) {
    case "date":
    case "datetime":
    case "sla_due":
      return "project_settings.features.intake.forms.builder.preview_date";
    case "number":
      return "project_settings.features.intake.forms.builder.preview_number";
    case "select":
    case "criticality":
    case "client":
    case "circle":
    case "labels":
    case "checkbox":
    case "priority":
    case "assignee":
      return "project_settings.features.intake.forms.builder.preview_select";
    case "url":
      return "project_settings.features.intake.forms.builder.preview_url";
    case "attachment":
      return "project_settings.features.intake.forms.builder.preview_attachment";
    case "description":
    case "paragraph":
      return "project_settings.features.intake.forms.builder.preview_paragraph";
    case "ticket_number":
      return "project_settings.features.intake.forms.builder.preview_text";
    default:
      return "project_settings.features.intake.forms.builder.preview_text";
  }
}
