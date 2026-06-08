import { Layers3, Plus } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { INTAKE_FORM_FIELD_CATALOG, mapCustomFieldTypeToFormType, type TIntakeSelectableCustomField } from "./intake-form-field-catalog";

type Props = {
  customFields: TIntakeSelectableCustomField[];
  usedCustomFieldIds: Set<string>;
  onAddCustomField: (field: TIntakeSelectableCustomField) => void;
  onCreateField: () => void;
};

export function IntakeFormBuilderSidebar(props: Props) {
  const { customFields, usedCustomFieldIds, onAddCustomField, onCreateField } = props;
  const { t } = useTranslation();

  const availableCustomFields = customFields.filter(
    (field) => !usedCustomFieldIds.has(field.custom_field_id)
  );

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5 pb-4">
        <h3 className="text-14 font-semibold text-primary">
          {t("project_settings.features.intake.forms.builder.fields_title")}
        </h3>
        <p className="mt-1.5 text-12 leading-relaxed text-secondary">
          {t("project_settings.features.intake.forms.builder.fields_hint")}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {availableCustomFields.length > 0 ? (
          <div className="space-y-1">
            {availableCustomFields.map((field) => {
              const mappedType = mapCustomFieldTypeToFormType(field.field_type);
              const catalog = INTAKE_FORM_FIELD_CATALOG.find((item) => item.type === mappedType);
              const Icon = catalog?.icon;
              return (
                <button
                  key={field.custom_field_id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-13 text-secondary transition-colors hover:bg-layer-transparent-hover"
                  onClick={() => onAddCustomField(field)}
                >
                  {Icon ? (
                    <span className="grid size-8 shrink-0 place-items-center rounded-md border border-subtle bg-layer-1">
                      <Icon className="size-3.5 text-tertiary" />
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{field.name}</span>
                    {field.source === "workspace" ? (
                      <span className="block truncate text-11 text-tertiary">
                        {t("project_settings.features.intake.forms.builder.workspace_field_badge")}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-subtle bg-layer-1/50 px-4 py-8 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-layer-2 text-tertiary">
              <Layers3 className="size-4" />
            </span>
            <p className="mt-3 text-12 leading-relaxed text-secondary">
              {t("project_settings.features.intake.forms.builder.no_custom_fields")}
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-subtle p-4">
        <Button variant="primary" className="h-9 w-full justify-center" onClick={onCreateField}>
          <Plus className="size-4" />
          {t("project_settings.features.intake.forms.builder.create_field")}
        </Button>
      </div>
    </div>
  );
}
