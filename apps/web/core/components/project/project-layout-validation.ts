import type { IBoardProjectFieldLayout, IProject, TCustomFieldValue, TProjectStandardFieldKey } from "@operis/types";

export function isEmptyCustomFieldValue(val: TCustomFieldValue | undefined): boolean {
  if (val === undefined || val === null || val === "") return true;
  if (Array.isArray(val) && val.length === 0) return true;
  return false;
}

export function isEmptyProjectFieldValue(val: unknown): boolean {
  if (val === undefined || val === null) return true;
  if (typeof val === "string" && val.trim() === "") return true;
  return false;
}

export function projectFieldRequiredRules(required: boolean, message: string) {
  if (!required) return undefined;
  return {
    required: message,
    validate: (value: unknown) => !isEmptyProjectFieldValue(value) || message,
  };
}

const SYSTEM_FORM_KEYS: Record<TProjectStandardFieldKey, keyof IProject> = {
  name: "name",
  identifier: "identifier",
  description: "description",
  project_lead: "project_lead",
  responsible_stakeholder: "responsible_stakeholder",
  default_assignee: "default_assignee",
  network: "network",
  timezone: "timezone",
};

type ValidateOptions = {
  layout: IBoardProjectFieldLayout[];
  formData: Partial<IProject>;
  customFieldValues: Record<string, TCustomFieldValue>;
  /** Campos já validados noutro bloco do formulário (ex.: nome/ID no create). */
  skipSystemKeys?: TProjectStandardFieldKey[];
  requiredMessage: string;
};

export type TProjectLayoutValidationResult = {
  ok: boolean;
  fieldErrors: { name: keyof IProject; message: string }[];
  missingCustom: boolean;
};

export function validateProjectLayoutRequired(options: ValidateOptions): TProjectLayoutValidationResult {
  const { layout, formData, customFieldValues, skipSystemKeys = [], requiredMessage } = options;
  const fieldErrors: { name: keyof IProject; message: string }[] = [];
  let missingCustom = false;

  for (const item of layout) {
    if (!item.is_enabled || !item.is_required) continue;

    if (item.field_source === "custom" && item.custom_field_id) {
      if (isEmptyCustomFieldValue(customFieldValues[item.custom_field_id])) {
        missingCustom = true;
      }
      continue;
    }

    if (item.field_source !== "system" || !item.standard_field_key) continue;
    const key = item.standard_field_key as TProjectStandardFieldKey;
    if (skipSystemKeys.includes(key)) continue;

    const formKey = SYSTEM_FORM_KEYS[key];
    const value = formData[formKey];
    if (isEmptyProjectFieldValue(value)) {
      fieldErrors.push({
        name: formKey,
        message: requiredMessage,
      });
    }
  }

  return {
    ok: fieldErrors.length === 0 && !missingCustom,
    fieldErrors,
    missingCustom,
  };
}
