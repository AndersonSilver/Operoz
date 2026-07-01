import { useTranslation } from "@operoz/i18n";
import { AutomationCreateCard } from "@/components/settings/board/automation/automation-create-card";
import type { IntakeFormTableRow } from "./intake-form-table";
import { IntakeFormGridCard } from "./intake-form-grid-card";
import "@/components/settings/board/automation/automation-list.css";

type Props<TForm extends IntakeFormTableRow> = {
  forms: TForm[];
  buildUrl: (anchor: string) => string;
  i18nPrefix?: string;
  creating?: boolean;
  onCreate?: () => void;
  onEdit: (form: TForm) => void;
  onCopyLink: (form: TForm) => void;
  onDelete: (form: TForm) => void;
};

export function IntakeFormGrid<TForm extends IntakeFormTableRow>(props: Props<TForm>) {
  const {
    forms,
    buildUrl,
    i18nPrefix = "project_settings.features.intake.forms",
    creating,
    onCreate,
    onEdit,
    onCopyLink,
    onDelete,
  } = props;
  const { t } = useTranslation();
  const label = (key: string, params?: Record<string, string | number>) => t(`${i18nPrefix}.${key}`, params);

  return (
    <div className="space-y-3">
      {forms.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-13 font-semibold text-secondary">{label("grid_title")}</h2>
            <span className="rounded-full bg-layer-2 px-2 py-0.5 text-11 text-tertiary">{forms.length}</span>
          </div>
          {forms.some((form) => form.is_published) ? (
            <p className="text-11 text-tertiary">
              {label("published_count", { count: forms.filter((form) => form.is_published).length })}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-13 text-secondary">{label("empty")}</p>
      )}

      <div className="automation-card-grid">
        {onCreate ? (
          <AutomationCreateCard
            label={label("create")}
            hint={label("create_card_hint")}
            loading={creating}
            onClick={onCreate}
            accentClass="text-accent-primary"
          />
        ) : null}
        {forms.map((form) => (
          <IntakeFormGridCard
            key={form.id}
            form={form}
            publicUrl={buildUrl(form.anchor)}
            i18nPrefix={i18nPrefix}
            onEdit={onEdit}
            onCopyLink={onCopyLink}
            onDelete={onDelete}
          />
        ))}
      </div>

      {forms.length > 0 ? (
        <p className="text-11 text-tertiary">{label("table_footer", { count: forms.length })}</p>
      ) : null}
    </div>
  );
}
