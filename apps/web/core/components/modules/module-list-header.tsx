import { useTranslation } from "@operis/i18n";
import { cn } from "@operis/utils";

const MODULE_LIST_GRID =
  "lg:grid lg:grid-cols-[minmax(0,1fr)_10rem_7rem_2.5rem_3.5rem] lg:items-center lg:gap-3";

export function ModuleListHeader() {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "sticky top-0 z-[1] hidden border-b border-subtle/60 bg-layer-1/90 px-4 py-2.5 backdrop-blur-md",
        MODULE_LIST_GRID
      )}
    >
      <span className="text-13 font-medium text-tertiary">{t("project_modules.list.col_module")}</span>
      <span className="hidden text-13 font-medium text-tertiary lg:block">{t("project_modules.list.col_dates")}</span>
      <span className="hidden text-13 font-medium text-tertiary lg:block">{t("project_modules.list.col_status")}</span>
      <span className="hidden text-center text-13 font-medium text-tertiary lg:block">
        {t("project_modules.list.col_lead")}
      </span>
      <span className="hidden text-right text-13 font-medium text-tertiary lg:block">
        {t("project_modules.list.col_actions")}
      </span>
    </div>
  );
}

export const MODULE_LIST_ROW_GRID = MODULE_LIST_GRID;
