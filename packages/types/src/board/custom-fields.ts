export type TBoardFieldFormSpan = "half" | "full";

export type TStandardFieldKey =
  | "priority"
  | "label_ids"
  | "start_date"
  | "target_date"
  | "cycle_id"
  | "module_ids"
  | "estimate_point"
  | "parent_id";

export type TCustomFieldType =
  | "text"
  | "paragraph"
  | "date"
  | "number"
  | "datetime"
  | "categories"
  | "select"
  | "checkbox"
  | "member"
  | "multi_select"
  | "url"
  | "standard";

export interface IProjectIssueFormConfig {
  standard_fields: IBoardStandardFieldConfig[];
  enabled_standard_keys: TStandardFieldKey[];
  custom_fields: IProjectCustomFieldLite[];
}

export interface IBoardStandardFieldConfig {
  id: string;
  standard_field_key: TStandardFieldKey;
  field_key: TStandardFieldKey;
  sort_order: number;
  is_enabled: boolean;
  form_span?: TBoardFieldFormSpan;
  is_system: true;
}

export type TCustomFieldValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | { member_id?: string };

export interface IWorkspaceCustomField {
  id: string;
  name: string;
  key: string;
  description?: string;
  field_type: TCustomFieldType;
  settings: {
    options?: string[];
  };
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IBoardCustomField {
  id: string;
  custom_field_id: string | null;
  standard_field_key?: TStandardFieldKey | null;
  name: string;
  key: string;
  description?: string;
  field_type: TCustomFieldType;
  settings: {
    options?: string[];
  };
  sort_order: number;
  is_enabled: boolean;
  form_span?: TBoardFieldFormSpan;
  is_active: boolean;
  is_system?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IProjectCustomFieldLite {
  id: string;
  name: string;
  key: string;
  description?: string;
  field_type: TCustomFieldType;
  settings: {
    options?: string[];
  };
}

export type TWorkspaceCustomFieldFormData = {
  name: string;
  description?: string;
  field_type: TCustomFieldType;
  settings?: {
    options?: string[];
  };
};

export type TBoardCustomFieldFormData = TWorkspaceCustomFieldFormData & {
  sort_order?: number;
  is_enabled?: boolean;
};

export type TWorkspaceCustomFieldUpdateData = {
  name?: string;
  description?: string;
  settings?: {
    options?: string[];
  };
};

export type TIssueCustomFieldValuePayload = {
  custom_field_id: string;
  value: TCustomFieldValue;
};
