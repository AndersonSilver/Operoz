import { Search, X } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { cn, CustomSelect } from "@operis/ui";
import type { BoardsSettingsFilters, BoardsSettingsSortKey, BoardsSettingsStatusFilter } from "./workspace-boards-settings-filter";
import { hasActiveBoardsSettingsFilters } from "./workspace-boards-settings-filter";

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-subtle bg-surface-1 pl-9 pr-3 text-13 text-primary placeholder:text-placeholder focus:border-strong focus:outline-none focus:ring-1 focus:ring-accent-primary";

const SELECT_CLASS =
  "h-9 min-w-[9.5rem] !rounded-md !border-subtle !bg-surface-1 !px-3 !py-0 !text-13 !font-normal shadow-none hover:!bg-layer-1-hover";

type Props = {
  filters: BoardsSettingsFilters;
  resultCount: number;
  onChange: (filters: BoardsSettingsFilters) => void;
};

export function WorkspaceBoardsSettingsToolbar(props: Props) {
  const { filters, resultCount, onChange } = props;
  const { t } = useTranslation();
  const showClear = hasActiveBoardsSettingsFilters(filters);

  const statusOptions: { value: BoardsSettingsStatusFilter; label: string }[] = [
    { value: "all", label: t("workspace_settings.settings.boards.filters.status_all") },
    { value: "active", label: t("workspace_settings.settings.boards.filters.status_active") },
    { value: "archived", label: t("workspace_settings.settings.boards.filters.status_archived") },
  ];

  const sortOptions: { value: BoardsSettingsSortKey; label: string }[] = [
    { value: "name", label: t("workspace_settings.settings.boards.filters.sort_name") },
    { value: "updated", label: t("workspace_settings.settings.boards.filters.sort_updated") },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-tertiary" />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => onChange({ ...filters, query: e.target.value })}
            placeholder={t("workspace_settings.settings.boards.filters.search_placeholder")}
            className={INPUT_CLASS}
          />
        </div>

        <CustomSelect
          input
          value={filters.status}
          onChange={(val: string) =>
            onChange({ ...filters, status: val as BoardsSettingsStatusFilter })
          }
          label={statusOptions.find((o) => o.value === filters.status)?.label}
          buttonClassName={SELECT_CLASS}
        >
          {statusOptions.map((opt) => (
            <CustomSelect.Option key={opt.value} value={opt.value}>
              {opt.label}
            </CustomSelect.Option>
          ))}
        </CustomSelect>

        <CustomSelect
          input
          value={filters.sort}
          onChange={(val: string) => onChange({ ...filters, sort: val as BoardsSettingsSortKey })}
          label={sortOptions.find((o) => o.value === filters.sort)?.label}
          buttonClassName={SELECT_CLASS}
        >
          {sortOptions.map((opt) => (
            <CustomSelect.Option key={opt.value} value={opt.value}>
              {opt.label}
            </CustomSelect.Option>
          ))}
        </CustomSelect>

        {showClear && (
          <button
            type="button"
            onClick={() =>
              onChange({ query: "", status: "active", sort: "name" })
            }
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-subtle px-3 text-12 text-secondary transition-colors hover:bg-layer-1-hover hover:text-primary"
          >
            <X className="size-3.5" />
            {t("workspace_settings.settings.boards.filters.clear")}
          </button>
        )}
      </div>

      <p className={cn("text-12 text-tertiary", resultCount === 0 && "text-warning-primary")}>
        {t("workspace_settings.settings.boards.filters.results", { count: resultCount })}
      </p>
    </div>
  );
}
