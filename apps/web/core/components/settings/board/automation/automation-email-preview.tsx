import { useTranslation } from "@operis/i18n";
import { sanitizeHtmlForRender } from "@operis/utils";

type Props = {
  subject: string;
  htmlBody: string;
};

export function AutomationEmailPreview(props: Props) {
  const { subject, htmlBody } = props;
  const { t } = useTranslation();

  return (
    <div className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-md border border-subtle bg-layer-1 shadow-raised-100">
      <div className="border-b border-subtle bg-layer-2 px-4 py-2.5">
        <p className="text-10 font-medium tracking-wide text-tertiary uppercase">
          {t("boards.settings.automation.emails.preview")}
        </p>
        <p className="mt-1 truncate text-13 font-medium text-primary">{subject || "—"}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-surface-1 p-4">
        {htmlBody.trim() ? (
          <div
            className="rounded-md border border-subtle bg-layer-1 p-4 text-13 text-primary [&_a]:text-accent-primary [&_h1]:text-18 [&_h1]:font-semibold [&_p]:mt-2"
            dangerouslySetInnerHTML={{ __html: sanitizeHtmlForRender(htmlBody) }}
          />
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center rounded-md border border-dashed border-subtle">
            <p className="text-12 text-tertiary">{t("boards.settings.automation.emails.preview_empty")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
