import { useEffect, useMemo, useState } from "react";
import { GripVertical, Plus, Trash2, X } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import type { TIntakeFormCreatableFieldType, TIntakeFormField } from "@operis/types";
import { Input, TextArea, CustomSelect, ToggleSwitch } from "@operis/ui";
import { cn } from "@operis/utils";
import {
  INTAKE_FORM_FIELD_CATALOG,
  createIntakeFormField,
  getCatalogItem,
} from "./intake-form-field-catalog";

type DrawerMode = "create" | "edit";

type Props = {
  mode: DrawerMode;
  field: TIntakeFormField | null;
  onClose: () => void;
  onCreate: (field: TIntakeFormField) => void;
  onUpdate: (fieldId: string, patch: Partial<TIntakeFormField>) => void;
  onDelete: (fieldId: string) => void;
};

function FieldLabel(props: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-11 font-semibold tracking-wide text-secondary uppercase">
      {props.children}
      {props.required ? <span className="text-danger-primary"> *</span> : null}
    </label>
  );
}

export function IntakeFormFieldDrawer(props: Props) {
  const { mode, field, onClose, onCreate, onUpdate, onDelete } = props;
  const { t } = useTranslation();
  const [fieldType, setFieldType] = useState<TIntakeFormCreatableFieldType | "">("");
  const [name, setName] = useState("");
  const [helpText, setHelpText] = useState("");
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [typeError, setTypeError] = useState(false);

  useEffect(() => {
    if (mode === "edit" && field) {
      setFieldType(field.field_type as TIntakeFormCreatableFieldType);
      setName(field.label);
      setHelpText(field.help_text ?? "");
      setRequired(!!field.required);
      setOptions(field.options?.length ? [...field.options] : ["Opção 1"]);
      setTypeError(false);
      return;
    }
    setFieldType("");
    setName("");
    setHelpText("");
    setRequired(false);
    setOptions(["Opção 1"]);
    setTypeError(false);
  }, [field, mode]);

  const catalogItem = useMemo(() => (fieldType ? getCatalogItem(fieldType) : undefined), [fieldType]);
  const showOptions = !!catalogItem?.hasOptions;
  const isSystemField = field?.field_type === "name" || field?.field_type === "description";
  const canChangeFieldType = mode === "create" || (mode === "edit" && field && !isSystemField);

  const handleSubmit = () => {
    if (mode === "create") {
      if (!fieldType) {
        setTypeError(true);
        return;
      }
      if (!name.trim()) return;
      const created = createIntakeFormField(fieldType, name.trim());
      created.help_text = helpText.trim();
      created.required = required;
      if (showOptions) created.options = options.filter((item) => item.trim());
      onCreate(created);
      onClose();
      return;
    }
    if (!field) return;
    const nextType = canChangeFieldType && fieldType ? fieldType : field.field_type;
    const nextCatalog = getCatalogItem(nextType as TIntakeFormCreatableFieldType);
    onUpdate(field.id, {
      field_type: nextType,
      label: name.trim() || field.label,
      help_text: helpText.trim(),
      required,
      form_span: "full",
      options: nextCatalog?.hasOptions ? options.filter((item) => item.trim()) : undefined,
    });
    onClose();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-subtle px-5 py-4">
        <div>
          <h3 className="text-14 font-semibold text-primary">
            {mode === "create"
              ? t("project_settings.features.intake.forms.builder.create_field")
              : t("project_settings.features.intake.forms.builder.edit_field")}
          </h3>
          <p className="mt-1 text-11 text-tertiary">
            {t("project_settings.features.intake.forms.builder.required_hint")}
          </p>
        </div>
        <button
          type="button"
          className="grid size-8 shrink-0 place-items-center rounded-md text-tertiary transition-colors hover:bg-layer-transparent-hover hover:text-primary"
          onClick={onClose}
          aria-label={t("close")}
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {canChangeFieldType ? (
          <div className="space-y-2">
            <FieldLabel required={mode === "create"}>{t("project_settings.features.intake.forms.builder.field_type")}</FieldLabel>
            <CustomSelect
              value={fieldType}
              label={
                fieldType
                  ? t(`project_settings.features.intake.forms.field_types.${fieldType}`)
                  : t("project_settings.features.intake.forms.builder.select_field_type")
              }
              buttonClassName={cn("h-10 w-full justify-between border-subtle bg-layer-1 text-13", {
                "border-danger-primary": typeError,
              })}
              onChange={(value: string) => {
                const nextType = value as TIntakeFormCreatableFieldType;
                setFieldType(nextType);
                setTypeError(false);
                const nextCatalog = getCatalogItem(nextType);
                if (nextCatalog?.hasOptions && options.length === 0) {
                  setOptions(["Opção 1"]);
                }
              }}
            >
              {INTAKE_FORM_FIELD_CATALOG.map((item) => (
                <CustomSelect.Option key={item.type} value={item.type}>
                  <span className="flex items-center gap-2.5">
                    <item.icon className="size-3.5 text-tertiary" />
                    {t(item.labelKey)}
                  </span>
                </CustomSelect.Option>
              ))}
            </CustomSelect>
            {typeError ? (
              <p className="text-11 text-danger-primary">
                {t("project_settings.features.intake.forms.builder.field_type_required")}
              </p>
            ) : null}
          </div>
        ) : field ? (
          <div className="space-y-2">
            <FieldLabel>{t("project_settings.features.intake.forms.builder.field_type")}</FieldLabel>
            <div className="flex h-10 items-center gap-2.5 rounded-md border border-subtle bg-layer-1 px-3 text-13 text-secondary">
              {getCatalogItem(field.field_type)?.icon ? (
                <span className="grid size-6 place-items-center rounded bg-layer-2">
                  {(() => {
                    const Icon = getCatalogItem(field.field_type)!.icon;
                    return <Icon className="size-3.5" />;
                  })()}
                </span>
              ) : null}
              {t(`project_settings.features.intake.forms.field_types.${field.field_type}`)}
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <FieldLabel required>{t("project_settings.features.intake.forms.builder.field_name")}</FieldLabel>
          <Input className="h-10 bg-layer-1" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-2">
          <FieldLabel>{t("project_settings.features.intake.forms.builder.field_description")}</FieldLabel>
          <TextArea
            className="bg-layer-1"
            value={helpText}
            onChange={(e) => setHelpText(e.target.value)}
            rows={3}
            placeholder={t("project_settings.features.intake.forms.builder.field_description_placeholder")}
          />
        </div>

        {showOptions ? (
          <div className="space-y-2">
            <FieldLabel>{t("project_settings.features.intake.forms.builder.options")}</FieldLabel>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div
                  key={`${index}-${option}`}
                  className="flex items-center gap-2 rounded-lg border border-subtle bg-layer-1 p-2"
                >
                  <GripVertical className="size-3.5 shrink-0 text-tertiary" />
                  <Input
                    className="border-0 bg-transparent px-1 shadow-none focus:ring-0"
                    value={option}
                    onChange={(e) =>
                      setOptions((current) => current.map((item, i) => (i === index ? e.target.value : item)))
                    }
                  />
                  <button
                    type="button"
                    className="grid size-7 shrink-0 place-items-center rounded text-tertiary hover:bg-layer-2 hover:text-danger-primary disabled:opacity-30"
                    onClick={() => setOptions((current) => current.filter((_, i) => i !== index))}
                    disabled={options.length <= 1}
                    aria-label={t("remove")}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-12 font-medium text-accent-primary hover:underline"
              onClick={() => setOptions((current) => [...current, `Opção ${current.length + 1}`])}
            >
              <Plus className="size-3.5" />
              {t("project_settings.features.intake.forms.builder.add_option")}
            </button>
          </div>
        ) : null}

        {field?.field_type !== "name" ? (
          <div className="flex items-center justify-between rounded-lg border border-subtle bg-layer-1 px-3 py-2.5">
            <span className="text-13 text-secondary">{t("required")}</span>
            <ToggleSwitch value={required} onChange={setRequired} size="sm" />
          </div>
        ) : null}
      </div>

      <div className="space-y-2 border-t border-subtle bg-surface-1 px-5 py-4">
        <Button
          variant="primary"
          className="h-9 w-full"
          disabled={!name.trim() || (mode === "create" && !fieldType)}
          onClick={handleSubmit}
        >
          {mode === "create" ? t("common.create") : t("save")}
        </Button>
        <Button variant="secondary" className="h-9 w-full" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        {mode === "edit" && field && field.field_type !== "name" && field.field_type !== "description" ? (
          <button
            type="button"
            className="flex h-9 w-full items-center justify-center gap-1.5 text-12 font-medium text-danger-primary hover:underline"
            onClick={() => {
              onDelete(field.id);
              onClose();
            }}
          >
            <Trash2 className="size-3.5" />
            {t("project_settings.features.intake.forms.builder.delete_field")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
