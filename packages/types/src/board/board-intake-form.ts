import type { TBoardFieldFormSpan, TCustomFieldType } from "../board/custom-fields";
import type { TIntakeFormDefaults, TIntakeFormField } from "../intake/intake-form";

export type TBoardIntakeFormTheme = "default" | "minimal" | "support" | "incident";

export type TBoardIntakeFormClientOption = {
  id: string;
  name: string;
  identifier: string;
};

export type TBoardIntakeForm = {
  id: string;
  board: string;
  name: string;
  description?: string;
  header_title?: string;
  anchor: string;
  is_published: boolean;
  fields: TIntakeFormField[];
  defaults: TIntakeFormDefaults;
  submit_message?: string;
  require_auth?: boolean;
  theme: TBoardIntakeFormTheme;
  public_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TBoardIntakeFormWritePayload = Partial<
  Pick<
    TBoardIntakeForm,
    | "name"
    | "description"
    | "header_title"
    | "is_published"
    | "fields"
    | "defaults"
    | "submit_message"
    | "require_auth"
    | "theme"
  >
>;

export type TBoardIntakeFormPublic = {
  id: string;
  name: string;
  header_title?: string;
  description?: string;
  fields: TIntakeFormField[];
  submit_message?: string;
  require_auth?: boolean;
  theme: TBoardIntakeFormTheme;
  form_scope: "board";
  clients: TBoardIntakeFormClientOption[];
};

export const BOARD_INTAKE_FORM_THEMES: { value: TBoardIntakeFormTheme; labelKey: string }[] = [
  { value: "default", labelKey: "boards.settings.intake_forms.themes.default" },
  { value: "minimal", labelKey: "boards.settings.intake_forms.themes.minimal" },
  { value: "support", labelKey: "boards.settings.intake_forms.themes.support" },
  { value: "incident", labelKey: "boards.settings.intake_forms.themes.incident" },
];

export type TBoardIntakeFormFieldType = TIntakeFormField["field_type"] | "client";

export type TBoardIntakeFormField = TIntakeFormField & {
  field_type: TBoardIntakeFormFieldType;
  maps_to?: TIntakeFormField["maps_to"] | "project_id";
  form_span?: TBoardFieldFormSpan;
};
