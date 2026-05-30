import { useTranslation } from "@plane/i18n";

export function ModuleListHeader() {
  const { t } = useTranslation();

  return (
    <div className="hidden border-b border-subtle bg-layer-2 px-4 py-2 text-11 font-medium uppercase tracking-wide text-tertiary lg:grid lg:grid-cols-[minmax(0,1fr)_11rem_6.5rem_2rem_4.5rem] lg:items-center lg:gap-3">
      <span>{t("project_modules.list.col_module")}</span>
      <span className="hidden lg:block">{t("project_modules.list.col_dates")}</span>
      <span className="hidden lg:block">{t("project_modules.list.col_status")}</span>
      <span className="hidden lg:block text-center">{t("project_modules.list.col_lead")}</span>
      <span className="hidden lg:block text-right">{t("project_modules.list.col_actions")}</span>
    </div>
  );
}
