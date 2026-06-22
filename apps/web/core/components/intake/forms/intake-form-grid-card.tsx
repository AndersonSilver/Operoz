import { Copy, ExternalLink, FileText, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { cn, renderFormattedDate } from "@operis/utils";
import type { IntakeFormTableRow } from "./intake-form-table";
import "@/components/settings/board/automation/automation-list.css";

type Props<TForm extends IntakeFormTableRow> = {
  form: TForm;
  publicUrl: string;
  i18nPrefix?: string;
  onEdit: (form: TForm) => void;
  onCopyLink: (form: TForm) => void;
  onDelete: (form: TForm) => void;
};

export function IntakeFormGridCard<TForm extends IntakeFormTableRow>(props: Props<TForm>) {
  const {
    form,
    publicUrl,
    i18nPrefix = "project_settings.features.intake.forms",
    onEdit,
    onCopyLink,
    onDelete,
  } = props;
  const { t } = useTranslation();
  const label = (key: string, params?: Record<string, string | number>) => t(`${i18nPrefix}.${key}`, params);

  const fieldCount = form.fields?.length ?? 0;
  const subtitle =
    form.header_title && form.header_title.trim().toLowerCase() !== form.name.trim().toLowerCase()
      ? form.header_title
      : null;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-subtle bg-layer-1 transition-all duration-150",
        "hover:border-strong hover:shadow-raised-100",
        form.is_published && "automation-card-glow-active border-success-subtle/30"
      )}
    >
      <span
        className={cn("absolute inset-x-0 top-0 h-0.5", form.is_published ? "bg-success-primary" : "bg-subtle")}
        aria-hidden
      />

      <button
        type="button"
        className="flex flex-1 flex-col p-4 pb-3 text-left transition-colors group-hover:bg-layer-1-hover/40"
        onClick={() => onEdit(form)}
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              "shadow-sm grid size-10 shrink-0 place-items-center rounded-lg border border-subtle",
              form.is_published
                ? "border-success-subtle/50 bg-success-subtle/40 text-success-primary"
                : "bg-layer-2 text-tertiary"
            )}
          >
            <FileText className="size-4" strokeWidth={1.75} />
          </span>
          <div className="flex flex-wrap justify-end gap-1">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-10 font-semibold tracking-wide uppercase",
                form.is_published ? "bg-success-subtle text-success-primary" : "bg-layer-2 text-tertiary"
              )}
            >
              {form.is_published ? label("published") : label("draft")}
            </span>
            {form.require_auth ? (
              <span className="rounded-full border border-subtle bg-layer-1 px-2 py-0.5 text-10 font-medium text-tertiary">
                {label("auth_required_badge")}
              </span>
            ) : null}
          </div>
        </div>

        <h3 className="mt-3 line-clamp-2 text-14 leading-snug font-semibold text-primary">{form.name}</h3>

        {subtitle ? <p className="mt-1 line-clamp-2 text-13 leading-relaxed text-tertiary">{subtitle}</p> : null}

        <p className="mt-3 text-12 text-tertiary">
          {label("fields_count", { count: fieldCount })}
          {form.updated_at ? (
            <>
              <span className="mx-1.5 text-placeholder" aria-hidden>
                ·
              </span>
              {renderFormattedDate(form.updated_at)}
            </>
          ) : null}
        </p>

        {!form.is_published ? <p className="mt-3 text-12 text-placeholder italic">{label("draft_hint")}</p> : null}
      </button>

      <div
        className="flex flex-wrap items-center gap-1.5 border-t border-subtle bg-surface-1/70 px-3 py-2"
        onClick={(event) => event.stopPropagation()}
      >
        <Button variant="secondary" size="sm" className="mr-auto h-8" onClick={() => onEdit(form)}>
          <Pencil className="size-3.5" />
          {t("edit")}
        </Button>
        {form.is_published ? (
          <>
            <Button variant="secondary" size="sm" className="h-8" onClick={() => onCopyLink(form)}>
              <Copy className="size-3.5" />
              <span className="hidden sm:inline">{label("copy_link")}</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="h-8"
              onClick={() => window.open(publicUrl, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="size-3.5" />
              <span className="hidden sm:inline">{label("open")}</span>
            </Button>
          </>
        ) : null}
        <Button variant="error-outline" size="sm" className="h-8" onClick={() => onDelete(form)}>
          <Trash2 className="size-3.5" />
          <span className="hidden sm:inline">{t("delete")}</span>
        </Button>
      </div>
    </article>
  );
}
