import { Copy, ExternalLink, FileText, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { Tooltip } from "@operis/propel/tooltip";
import type { TIntakeForm } from "@operis/types";
import { CustomMenu } from "@operis/ui";
import { cn, renderFormattedDate } from "@operis/utils";
import { formatShortPublicUrl } from "./intake-url-utils";
import "./intake-settings.css";

type Props = {
  forms: TIntakeForm[];
  buildUrl: (anchor: string) => string;
  onEdit: (form: TIntakeForm) => void;
  onCopyLink: (form: TIntakeForm) => void;
  onDelete: (form: TIntakeForm) => void;
};

export function IntakeFormTable(props: Props) {
  const { forms, buildUrl, onEdit, onCopyLink, onDelete } = props;
  const { t } = useTranslation();

  return (
    <div className="intake-form-table-wrap">
      <table className="intake-form-table">
        <thead>
          <tr>
            <th>{t("project_settings.features.intake.forms.column_form")}</th>
            <th>{t("project_settings.features.intake.forms.column_status")}</th>
            <th>{t("project_settings.features.intake.forms.column_meta")}</th>
            <th>{t("project_settings.features.intake.forms.column_link")}</th>
            <th className="intake-form-table-actions-head">
              {t("project_settings.features.intake.forms.column_actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {forms.map((form) => {
            const publicUrl = buildUrl(form.anchor);
            const shortUrl = formatShortPublicUrl(publicUrl, form.anchor);
            const fieldCount = form.fields?.length ?? 0;

            return (
              <tr key={form.id} className={cn(form.is_published && "is-published")}>
                <td>
                  <button type="button" className="intake-form-table-name" onClick={() => onEdit(form)}>
                    <span
                      className={cn(
                        "intake-form-table-icon",
                        form.is_published ? "is-published" : "is-draft"
                      )}
                    >
                      <FileText className="size-3.5" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-primary">{form.name}</span>
                      <span className="mt-0.5 block truncate text-12 text-tertiary">
                        {form.header_title || t("project_settings.features.intake.forms.default_header")}
                      </span>
                    </span>
                  </button>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className={cn(
                        "intake-form-table-badge",
                        form.is_published ? "is-success" : "is-muted"
                      )}
                    >
                      {form.is_published
                        ? t("project_settings.features.intake.forms.published")
                        : t("project_settings.features.intake.forms.draft")}
                    </span>
                    {form.require_auth ? (
                      <span className="intake-form-table-badge is-muted">
                        {t("project_settings.features.intake.forms.auth_required_badge")}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="intake-form-table-meta">
                  {t("project_settings.features.intake.forms.fields_count", { count: fieldCount })}
                  {form.updated_at ? (
                    <>
                      <span className="intake-form-table-meta-sep" aria-hidden>
                        ·
                      </span>
                      {renderFormattedDate(form.updated_at)}
                    </>
                  ) : null}
                </td>
                <td>
                  {form.is_published ? (
                    <Tooltip tooltipContent={shortUrl.full} position="top">
                      <button
                        type="button"
                        className="intake-form-table-link"
                        onClick={() => onCopyLink(form)}
                      >
                        <span className="truncate font-mono text-11">{shortUrl.display}</span>
                        <Copy className="size-3.5 shrink-0 text-tertiary" />
                      </button>
                    </Tooltip>
                  ) : (
                    <span className="intake-form-table-draft-hint">
                      {t("project_settings.features.intake.forms.draft_hint")}
                    </span>
                  )}
                </td>
                <td>
                  <div className="intake-form-table-actions">
                    <Button variant="secondary" size="sm" className="h-8" onClick={() => onEdit(form)}>
                      <Pencil className="size-3.5" />
                      {t("edit")}
                    </Button>
                    <CustomMenu
                      closeOnSelect
                      placement="bottom-start"
                      maxHeight="2xl"
                      menuItemsClassName="z-[200]"
                      optionsClassName="py-1"
                      customButton={
                        <button
                          type="button"
                          className="inline-flex size-8 items-center justify-center rounded-md text-tertiary transition-colors hover:bg-layer-transparent-hover data-[state=open]:bg-layer-transparent-hover"
                          aria-label={t("project_settings.features.intake.forms.more_actions")}
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      }
                    >
                      {form.is_published ? (
                        <CustomMenu.MenuItem onClick={() => onCopyLink(form)}>
                          <span className="flex items-center gap-2">
                            <Copy className="size-3.5" />
                            {t("project_settings.features.intake.forms.copy_link")}
                          </span>
                        </CustomMenu.MenuItem>
                      ) : null}
                      {form.is_published ? (
                        <CustomMenu.MenuItem
                          onClick={() => window.open(publicUrl, "_blank", "noopener,noreferrer")}
                        >
                          <span className="flex items-center gap-2">
                            <ExternalLink className="size-3.5" />
                            {t("project_settings.features.intake.forms.open")}
                          </span>
                        </CustomMenu.MenuItem>
                      ) : null}
                      <CustomMenu.MenuItem onClick={() => onDelete(form)}>
                        <span className="flex items-center gap-2 text-danger-primary">
                          <Trash2 className="size-3.5" />
                          {t("remove")}
                        </span>
                      </CustomMenu.MenuItem>
                    </CustomMenu>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <footer className="intake-form-table-footer">
        {t("project_settings.features.intake.forms.table_footer", { count: forms.length })}
      </footer>
    </div>
  );
}
