import { Search, X } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { cn, CustomSelect } from "@operoz/ui";

export type DiscordCommandsFilters = {
  query: string;
  status: "all" | "synced" | "pending" | "failed";
};

export const DEFAULT_DISCORD_COMMANDS_FILTERS: DiscordCommandsFilters = {
  query: "",
  status: "all",
};

export function hasActiveDiscordCommandsFilters(filters: DiscordCommandsFilters): boolean {
  return filters.query.trim().length > 0 || filters.status !== "all";
}

const INPUT_CLASS =
  "h-9 w-full rounded-md border border-subtle bg-surface-1 pl-9 pr-3 text-13 text-primary placeholder:text-placeholder focus:border-strong focus:outline-none focus:ring-1 focus:ring-accent-primary";

const SELECT_CLASS =
  "h-9 min-w-[9.5rem] !rounded-md !border-subtle !bg-surface-1 !px-3 !py-0 !text-13 !font-normal shadow-none hover:!bg-layer-1-hover";

type Props = {
  filters: DiscordCommandsFilters;
  resultCount: number;
  onChange: (filters: DiscordCommandsFilters) => void;
};

export function DiscordSlashCommandsToolbar(props: Props) {
  const { filters, resultCount, onChange } = props;
  const { t } = useTranslation();
  const showClear = hasActiveDiscordCommandsFilters(filters);

  const statusOptions = [
    { value: "all" as const, label: t("workspace_settings.settings.discord.filters.status_all") },
    { value: "synced" as const, label: t("workspace_settings.settings.discord.filters.status_synced") },
    { value: "pending" as const, label: t("workspace_settings.settings.discord.filters.status_pending") },
    { value: "failed" as const, label: t("workspace_settings.settings.discord.filters.status_failed") },
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
            placeholder={t("workspace_settings.settings.discord.filters.search_placeholder")}
            className={INPUT_CLASS}
          />
        </div>

        <CustomSelect
          input
          value={filters.status}
          onChange={(val: string) => onChange({ ...filters, status: val as DiscordCommandsFilters["status"] })}
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
            onClick={() => onChange(DEFAULT_DISCORD_COMMANDS_FILTERS)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-subtle px-3 text-12 text-secondary transition-colors hover:bg-layer-1-hover hover:text-primary"
          >
            <X className="size-3.5" />
            {t("workspace_settings.settings.discord.filters.clear")}
          </button>
        )}
      </div>

      <p className={cn("text-12 text-tertiary", resultCount === 0 && "text-warning-primary")}>
        {t("workspace_settings.settings.discord.filters.results", { count: resultCount })}
      </p>
    </div>
  );
}
