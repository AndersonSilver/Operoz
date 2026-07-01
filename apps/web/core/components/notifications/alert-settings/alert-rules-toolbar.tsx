import { Search, X } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { cn, CustomSelect } from "@operoz/ui";
import type { AlertRulesFilters } from "./alert-rules-filter";
import { hasActiveAlertRulesFilters } from "./alert-rules-filter";

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-subtle bg-surface-1 pl-9 pr-3 text-13 text-primary placeholder:text-placeholder focus:border-strong focus:outline-none focus:ring-1 focus:ring-accent-primary";

const SELECT_CLASS =
  "h-9 min-w-[9.5rem] !rounded-md !border-subtle !bg-surface-1 !px-3 !py-0 !text-13 !font-normal shadow-none hover:!bg-layer-1-hover";

type Props = {
  filters: AlertRulesFilters;
  resultCount: number;
  onChange: (filters: AlertRulesFilters) => void;
};

export function AlertRulesToolbar(props: Props) {
  const { filters, resultCount, onChange } = props;
  const { t } = useTranslation();
  const showClear = hasActiveAlertRulesFilters(filters);

  const statusOptions = [
    { value: "all" as const, label: t("alert.rules.filters.status_all") },
    { value: "enabled" as const, label: t("alert.rules.filters.status_enabled") },
    { value: "disabled" as const, label: t("alert.rules.filters.status_disabled") },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-tertiary" />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder={t("alert.rules.filters.search_placeholder")}
            className={INPUT_CLASS}
          />
        </div>

        <CustomSelect
          input
          value={filters.status}
          onChange={(val: string) => onChange({ ...filters, status: val as AlertRulesFilters["status"] })}
          label={statusOptions.find((o) => o.value === filters.status)?.label}
          buttonClassName={SELECT_CLASS}
        >
          {statusOptions.map((opt) => (
            <CustomSelect.Option key={opt.value} value={opt.value}>
              {opt.label}
            </CustomSelect.Option>
          ))}
        </CustomSelect>

        {showClear && (
          <button
            type="button"
            onClick={() => onChange({ query: "", status: "all" })}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-subtle px-3 text-12 text-secondary transition-colors hover:bg-layer-1-hover hover:text-primary"
          >
            <X className="size-3.5" />
            {t("alert.rules.filters.clear")}
          </button>
        )}
      </div>

      <p className={cn("text-12 text-tertiary", resultCount === 0 && "text-warning-primary")}>
        {t("alert.rules.filters.results", { count: resultCount })}
      </p>
    </div>
  );
}
