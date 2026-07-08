import { ArrowDownWideNarrow, Search, X } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { Input, cn } from "@operoz/ui";
import type {
  AutomationRulesFilterState,
  AutomationRulesSort,
  AutomationRulesStatusFilter,
} from "./automation-rules-filter";

type TriggerOption = { key: string; label: string };

type Props = {
  filters: AutomationRulesFilterState;
  onChange: (patch: Partial<AutomationRulesFilterState>) => void;
  onClear: () => void;
  triggerOptions: TriggerOption[];
  totalCount: number;
  filteredCount: number;
  hasActiveFilters: boolean;
};

function FilterChip(props: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const { active, onClick, children } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-11 font-medium transition-colors",
        active
          ? "border-accent-subtle bg-accent-subtle/50 text-accent-primary"
          : "border-subtle text-tertiary hover:border-strong hover:bg-layer-2 hover:text-secondary"
      )}
    >
      {children}
    </button>
  );
}

export function AutomationRulesListToolbar(props: Props) {
  const { filters, onChange, onClear, triggerOptions, totalCount, filteredCount, hasActiveFilters } = props;
  const { t } = useTranslation();

  const statusOptions: { value: AutomationRulesStatusFilter; label: string }[] = [
    { value: "all", label: t("boards.settings.automation.rules_list.filters.status_all") },
    { value: "active", label: t("boards.settings.automation.rules_list.filters.status_active") },
    { value: "inactive", label: t("boards.settings.automation.rules_list.filters.status_inactive") },
  ];

  const sortOptions: { value: AutomationRulesSort; label: string }[] = [
    { value: "updated_desc", label: t("boards.settings.automation.rules_list.filters.sort_updated_desc") },
    { value: "updated_asc", label: t("boards.settings.automation.rules_list.filters.sort_updated_asc") },
    { value: "name_asc", label: t("boards.settings.automation.rules_list.filters.sort_name_asc") },
    { value: "name_desc", label: t("boards.settings.automation.rules_list.filters.sort_name_desc") },
  ];

  return (
    <div className="mb-4 space-y-3 rounded-xl border border-subtle bg-layer-1 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-placeholder" />
          <Input
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder={t("boards.settings.automation.rules_list.filters.search_placeholder")}
            className="w-full rounded-lg border-subtle bg-surface-1 pr-8 pl-8 text-13"
          />
          {filters.search && (
            <button
              type="button"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-tertiary hover:text-primary"
              onClick={() => onChange({ search: "" })}
              aria-label={t("boards.settings.automation.rules_list.filters.clear")}
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <label className="flex shrink-0 items-center gap-2 text-11 text-tertiary">
          <ArrowDownWideNarrow className="size-3.5" strokeWidth={1.75} />
          <span className="whitespace-nowrap">{t("boards.settings.automation.rules_list.filters.sort_label")}</span>
          <select
            value={filters.sort}
            onChange={(e) => onChange({ sort: e.target.value as AutomationRulesSort })}
            className="rounded-lg border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-11 font-medium text-placeholder">
          {t("boards.settings.automation.rules_list.filters.status_label")}
        </span>
        {statusOptions.map((opt) => (
          <FilterChip
            key={opt.value}
            active={filters.status === opt.value}
            onClick={() => onChange({ status: opt.value })}
          >
            {opt.label}
          </FilterChip>
        ))}

        {triggerOptions.length > 1 && (
          <>
            <span className="ml-1 text-11 font-medium text-placeholder">
              {t("boards.settings.automation.rules_list.filters.trigger_label")}
            </span>
            <FilterChip active={filters.triggerKey === "all"} onClick={() => onChange({ triggerKey: "all" })}>
              {t("boards.settings.automation.rules_list.filters.trigger_all")}
            </FilterChip>
            {triggerOptions.map((opt) => (
              <FilterChip
                key={opt.key}
                active={filters.triggerKey === opt.key}
                onClick={() => onChange({ triggerKey: opt.key })}
              >
                {opt.label}
              </FilterChip>
            ))}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-subtle pt-2">
        <p className="text-11 text-tertiary">
          {t("boards.settings.automation.rules_list.filters.results_count", {
            count: filteredCount,
            total: totalCount,
          })}
        </p>
        {hasActiveFilters && (
          <Button variant="link" size="sm" onClick={onClear}>
            {t("boards.settings.automation.rules_list.filters.clear")}
          </Button>
        )}
      </div>
    </div>
  );
}
