import { Copy, ExternalLink, FileText, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { Tooltip } from "@operoz/propel/tooltip";
import type { TIntakeForm } from "@operoz/types";
import { CustomMenu } from "@operoz/ui";
import { cn, renderFormattedDate } from "@operoz/utils";
import { formatShortPublicUrl } from "./intake-url-utils";
import "./intake-settings.css";

export type IntakeFormTableRow = {
  id: string;
  name: string;
  header_title?: string;
  anchor: string;
  is_published: boolean;
  fields?: { id: string }[];
  require_auth?: boolean;
  updated_at?: string;
};

type Props<TForm extends IntakeFormTableRow = TIntakeForm> = {
  forms: TForm[];
  buildUrl: (anchor: string) => string;
  i18nPrefix?: string;
  embedded?: boolean;
  onEdit: (form: TForm) => void;
  onCopyLink: (form: TForm) => void;
  onDelete: (form: TForm) => void;
};

export function IntakeFormTable<TForm extends IntakeFormTableRow = TIntakeForm>(props: Props<TForm>) {
  const {
    forms,
    buildUrl,
    i18nPrefix = "project_settings.features.intake.forms",
    embedded = false,
    onEdit,
    onCopyLink,
    onDelete,
  } = props;
  const { t } = useTranslation();
  const label = (key: string, params?: Record<string, string | number>) => t(`${i18nPrefix}.${key}`, params);

  return (
    <div className={cn("intake-form-table-wrap", embedded && "border-0 bg-transparent shadow-none")}>
      <table className="intake-form-table">
        <thead>
          <tr>
            <th>{label("column_form")}</th>
            <th>{label("column_status")}</th>
            <th>{label("column_meta")}</th>
            <th>{label("column_link")}</th>
            <th className="intake-form-table-actions-head">{label("column_actions")}</th>
          </tr>
        </thead>
        <tbody>
          {forms.map((form) => {
            const publicUrl = buildUrl(form.anchor);
            const shortUrl = formatShortPublicUrl(publicUrl, form.anchor);
            const fieldCount = form.fields?.length ?? 0;
            const subtitle =
              form.header_title && form.header_title.trim().toLowerCase() !== form.name.trim().toLowerCase()
                ? form.header_title
                : null;

            return (
              <tr key={form.id} className={cn(form.is_published && "is-published")}>
                <td>
                  <button type="button" className="intake-form-table-name" onClick={() => onEdit(form)}>
                    <span className={cn("intake-form-table-icon", form.is_published ? "is-published" : "is-draft")}>
                      <FileText className="size-3.5" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-primary">{form.name}</span>
                      {subtitle ? (
                        <span className="mt-0.5 block truncate text-12 text-tertiary">{subtitle}</span>
                      ) : null}
                    </span>
                  </button>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={cn("intake-form-table-badge", form.is_published ? "is-success" : "is-muted")}>
                      {form.is_published ? label("published") : label("draft")}
                    </span>
                    {form.require_auth ? (
                      <span className="intake-form-table-badge is-muted">{label("auth_required_badge")}</span>
                    ) : null}
                  </div>
                </td>
                <td className="intake-form-table-meta">
                  {label("fields_count", { count: fieldCount })}
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
                      <button type="button" className="intake-form-table-link" onClick={() => onCopyLink(form)}>
                        <span className="min-w-0 flex-1 truncate text-13 font-medium text-primary">
                          {shortUrl.path}
                        </span>
                        <Copy className="size-3.5 shrink-0 text-tertiary" />
                      </button>
                    </Tooltip>
                  ) : (
                    <span className="intake-form-table-draft-hint">{label("draft_hint")}</span>
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
                          aria-label={label("more_actions")}
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      }
                    >
                      {form.is_published ? (
                        <CustomMenu.MenuItem onClick={() => onCopyLink(form)}>
                          <span className="flex items-center gap-2">
                            <Copy className="size-3.5" />
                            {label("copy_link")}
                          </span>
                        </CustomMenu.MenuItem>
                      ) : null}
                      {form.is_published ? (
                        <CustomMenu.MenuItem onClick={() => window.open(publicUrl, "_blank", "noopener,noreferrer")}>
                          <span className="flex items-center gap-2">
                            <ExternalLink className="size-3.5" />
                            {label("open")}
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
      <footer className="intake-form-table-footer">{label("table_footer", { count: forms.length })}</footer>
    </div>
  );
}
