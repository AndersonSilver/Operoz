import type { TBoardFieldFormSpan, TCustomFieldType } from "../board/custom-fields";

export type TSupportCriticality = "p0" | "p1" | "p2" | "p3" | "p4" | "not_incident";

export type TSupportSlaPolicyEntry = {
  duration_minutes: number;
};

export type TSupportSlaPolicy = Record<TSupportCriticality, TSupportSlaPolicyEntry>;

export type TIntakeFormFieldType =
  | "name"
  | "description"
  | "paragraph"
  | "text"
  | "date"
  | "datetime"
  | "select"
  | "priority"
  | "assignee"
  | "number"
  | "checkbox"
  | "url"
  | "labels"
  | "attachment"
  | "criticality"
  | "ticket_number"
  | "sla_due"
  | "client";

export type TIntakeFormField = {
  id: string;
  field_type: TIntakeFormFieldType;
  label: string;
  help_text?: string;
  required?: boolean;
  form_span?: TBoardFieldFormSpan;
  maps_to?: "name" | "description_html" | "start_date" | "target_date" | "priority" | "project_id";
  custom_field_id?: string;
  options?: string[];
};

export type TIntakeFormDefaults = {
  module_ids?: string[];
  assignee_ids?: string[];
  label_ids?: string[];
  priority?: string;
  parent_id?: string | null;
  start_date?: string | null;
  target_date?: string | null;
};

export type TIntakeForm = {
  id: string;
  project: string;
  name: string;
  description?: string;
  header_title?: string;
  anchor: string;
  is_published: boolean;
  fields: TIntakeFormField[];
  defaults: TIntakeFormDefaults;
  submit_message?: string;
  require_auth?: boolean;
  public_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TIntakeFormWritePayload = Partial<
  Pick<
    TIntakeForm,
    "name" | "description" | "header_title" | "is_published" | "fields" | "defaults" | "submit_message" | "require_auth"
  >
>;

export type TIntakeFormPublic = Pick<
  TIntakeForm,
  "id" | "name" | "header_title" | "description" | "fields" | "submit_message" | "require_auth" | "project"
> & {
  form_scope?: "project" | "board";
  theme?: TBoardIntakeFormTheme;
  clients?: TBoardIntakeFormClientOption[];
  sla_policy?: TSupportSlaPolicy;
};

export type TBoardIntakeFormTheme = "default" | "minimal" | "support" | "incident";

export type TBoardIntakeFormClientOption = {
  id: string;
  name: string;
  identifier: string;
};

export type TIntakeFormSubmitPayload = {
  fields: Record<string, unknown>;
  submitter_email?: string;
};

export type TIntakeFormSubmitResponse = {
  issue_id: string;
  intake_issue_id: string;
  message: string;
};

export type TIntakeFormCreatableFieldType = Exclude<TIntakeFormFieldType, "name" | "description">;

export const INTAKE_FORM_CREATABLE_FIELD_TYPES: TIntakeFormCreatableFieldType[] = [
  "text",
  "paragraph",
  "datetime",
  "select",
  "date",
  "number",
  "labels",
  "checkbox",
  "assignee",
  "url",
  "attachment",
  "priority",
  "criticality",
  "ticket_number",
  "sla_due",
];

export const INTAKE_FORM_FIELD_TYPE_OPTIONS: {
  type: TIntakeFormFieldType;
  labelKey: string;
}[] = [
  { type: "name", labelKey: "project_settings.features.intake.forms.field_types.name" },
  { type: "description", labelKey: "project_settings.features.intake.forms.field_types.description" },
  { type: "paragraph", labelKey: "project_settings.features.intake.forms.field_types.paragraph" },
  { type: "text", labelKey: "project_settings.features.intake.forms.field_types.text" },
  { type: "date", labelKey: "project_settings.features.intake.forms.field_types.date" },
  { type: "datetime", labelKey: "project_settings.features.intake.forms.field_types.datetime" },
  { type: "select", labelKey: "project_settings.features.intake.forms.field_types.select" },
  { type: "number", labelKey: "project_settings.features.intake.forms.field_types.number" },
  { type: "labels", labelKey: "project_settings.features.intake.forms.field_types.labels" },
  { type: "checkbox", labelKey: "project_settings.features.intake.forms.field_types.checkbox" },
  { type: "assignee", labelKey: "project_settings.features.intake.forms.field_types.assignee" },
  { type: "url", labelKey: "project_settings.features.intake.forms.field_types.url" },
  { type: "attachment", labelKey: "project_settings.features.intake.forms.field_types.attachment" },
  { type: "priority", labelKey: "project_settings.features.intake.forms.field_types.priority" },
  { type: "criticality", labelKey: "project_settings.features.intake.forms.field_types.criticality" },
  { type: "ticket_number", labelKey: "project_settings.features.intake.forms.field_types.ticket_number" },
  { type: "sla_due", labelKey: "project_settings.features.intake.forms.field_types.sla_due" },
];

export type TIntakeFormCustomFieldBinding = {
  custom_field_id: string;
  name: string;
  field_type: TCustomFieldType;
  options?: string[];
};
