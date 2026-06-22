import { ChevronDown, ChevronUp, GripVertical, Lock, Users } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import type { TIntakeFormField } from "@operis/types";
import { cn } from "@operis/utils";
import { fieldPreviewPlaceholderKey, getCatalogItem } from "./intake-form-field-catalog";

type Props = {
  fields: TIntakeFormField[];
  selectedFieldId: string | null;
  headerTitle: string;
  formDescription: string;
  onSelectField: (fieldId: string) => void;
  onMoveField: (fieldId: string, direction: "up" | "down") => void;
};

export function IntakeFormBuilderCanvas(props: Props) {
  const { fields, selectedFieldId, headerTitle, formDescription, onSelectField, onMoveField } = props;
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden rounded-xl border border-subtle bg-surface-1 shadow-raised-100">
      <div className="border-b border-subtle bg-layer-1 px-6 py-5">
        <p className="text-10 font-semibold tracking-[0.08em] text-tertiary uppercase">Operoz</p>
        <h3 className="mt-1 text-18 font-semibold text-primary">
          {headerTitle || t("project_settings.features.intake.forms.builder.preview_title")}
        </h3>
        {formDescription ? <p className="mt-1.5 text-13 text-secondary">{formDescription}</p> : null}
      </div>

      <div className="space-y-2 p-4">
        {fields.map((field, index) => {
          const catalog = getCatalogItem(field.field_type === "client" ? "select" : field.field_type);
          const isSystem =
            field.field_type === "name" || field.field_type === "description" || field.field_type === "client";
          const Icon = field.field_type === "client" ? Users : catalog?.icon;
          const isSelected = selectedFieldId === field.id;

          return (
            <div
              key={field.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectField(field.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelectField(field.id);
              }}
              className={cn(
                "group relative rounded-lg border bg-canvas/40 p-4 text-left transition-all duration-150",
                isSelected
                  ? "border-accent-primary/50 shadow-sm ring-accent-primary/15 bg-accent-subtle/10 ring-1"
                  : "border-transparent hover:border-subtle hover:bg-layer-1"
              )}
            >
              {isSelected ? (
                <span className="absolute top-3 bottom-3 left-0 w-0.5 rounded-full bg-accent-primary" aria-hidden />
              ) : null}

              <div className="flex items-start gap-3 pl-1">
                <GripVertical className="mt-1 size-4 shrink-0 text-tertiary opacity-40 transition-opacity group-hover:opacity-100" />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {Icon ? (
                      <span className="grid size-6 place-items-center rounded-md bg-layer-2 text-tertiary">
                        <Icon className="size-3.5" />
                      </span>
                    ) : null}
                    <p className="text-13 font-medium text-primary">
                      {field.label}
                      {field.required ? <span className="text-danger-primary"> *</span> : null}
                    </p>
                    {isSystem ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-layer-2 px-2 py-0.5 text-10 font-medium text-tertiary">
                        <Lock className="size-2.5" />
                        {t("project_settings.features.intake.forms.builder.system_badge")}
                      </span>
                    ) : null}
                  </div>

                  {field.help_text ? (
                    <p className="mt-1.5 text-12 text-secondary">{field.help_text}</p>
                  ) : (
                    <p className="mt-1.5 text-12 text-placeholder italic">
                      {t("project_settings.features.intake.forms.builder.add_description")}
                    </p>
                  )}

                  <div className="mt-3 rounded-md border border-dashed border-subtle/80 bg-surface-1 px-3 py-2.5 text-12 text-tertiary">
                    {t(fieldPreviewPlaceholderKey(field.field_type))}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    className="grid size-7 place-items-center rounded-md text-tertiary hover:bg-layer-2 hover:text-primary disabled:opacity-30"
                    disabled={index === 0}
                    onClick={(event) => {
                      event.stopPropagation();
                      onMoveField(field.id, "up");
                    }}
                    aria-label={t("project_settings.features.intake.forms.builder.move_up")}
                  >
                    <ChevronUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="grid size-7 place-items-center rounded-md text-tertiary hover:bg-layer-2 hover:text-primary disabled:opacity-30"
                    disabled={index === fields.length - 1}
                    onClick={(event) => {
                      event.stopPropagation();
                      onMoveField(field.id, "down");
                    }}
                    aria-label={t("project_settings.features.intake.forms.builder.move_down")}
                  >
                    <ChevronDown className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
