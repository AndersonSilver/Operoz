import { useEffect, useRef, useState } from "react";
import { ArrowDownWideNarrow, LayoutGrid, List, ListFilter, Search, Table2 } from "lucide-react";
import { useOutsideClickDetector } from "@operis/hooks";
import { useTranslation } from "@operis/i18n";
import { CloseIcon } from "@operis/propel/icons";
import { IconButton } from "@operis/propel/icon-button";
import { Tooltip } from "@operis/propel/tooltip";
import type { IModule } from "@operis/types";
import { CustomSelect } from "@operis/ui";
import { cn } from "@operis/utils";
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
import {
  PROJECT_HUB_LAYOUT_TOGGLE_GROUP,
  ProjectHubToolbar,
  ProjectHubToolbarDivider,
  ProjectHubToolbarSegment,
} from "@/components/project/project-hub-toolbar";
import type {
  HistorySortOrder,
  StatusReportListView,
  StatusReportPeriodFilter,
  StatusReportStatusFilter,
} from "@/components/project/status-report/status-report-utils";

type Props = {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  historySort: HistorySortOrder;
  onToggleSort: () => void;
  filterModuleId: string;
  setFilterModuleId: (id: string) => void;
  statusFilter: StatusReportStatusFilter;
  setStatusFilter: (v: StatusReportStatusFilter) => void;
  periodFilter: StatusReportPeriodFilter;
  setPeriodFilter: (v: StatusReportPeriodFilter) => void;
  listView: StatusReportListView;
  setListView: (v: StatusReportListView) => void;
  modules: IModule[] | undefined;
  canManage: boolean;
  onBatchExport?: () => void;
  batchExporting?: boolean;
};

const VIEWS: { key: StatusReportListView; icon: typeof List; labelKey: string }[] = [
  { key: "list", icon: List, labelKey: "project.status_report.view_list" },
  { key: "modules", icon: LayoutGrid, labelKey: "project.status_report.view_modules" },
  { key: "timeline", icon: Table2, labelKey: "project.status_report.view_timeline" },
];

export function StatusReportListToolbar(props: Props) {
  const {
    searchQuery,
    onSearchChange,
    historySort,
    onToggleSort,
    filterModuleId,
    setFilterModuleId,
    statusFilter,
    setStatusFilter,
    periodFilter,
    setPeriodFilter,
    listView,
    setListView,
    modules,
    canManage,
    onBatchExport,
    batchExporting,
  } = props;
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(searchQuery !== "");

  useOutsideClickDetector(inputRef, () => {
    if (isSearchOpen && searchQuery.trim() === "") setIsSearchOpen(false);
  });

  useEffect(() => {
    if (searchQuery.trim()) setIsSearchOpen(true);
  }, [searchQuery]);

  const filtersApplied = statusFilter !== "all" || periodFilter !== "all" || Boolean(filterModuleId);

  return (
    <ProjectHubToolbar className="w-full max-w-full sm:w-auto">
        <ProjectHubToolbarSegment>
          {!isSearchOpen ? (
            <IconButton
              variant="ghost"
              size="sm"
              className="h-8 w-8 border-0 bg-transparent shadow-none hover:bg-layer-transparent-hover"
              onClick={() => {
                setIsSearchOpen(true);
                inputRef.current?.focus();
              }}
              icon={Search}
            />
          ) : (
            <div className="flex h-8 w-52 items-center gap-1.5 rounded-md border border-subtle/50 bg-layer-2/60 px-2.5">
              <Search className="size-3.5 shrink-0 text-tertiary" />
              <input
                ref={inputRef}
                className="w-full border-none bg-transparent text-13 text-primary placeholder:text-placeholder focus:outline-none"
                placeholder={t("project.status_report.search_placeholder")}
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    if (searchQuery.trim()) onSearchChange("");
                    else setIsSearchOpen(false);
                  }
                }}
              />
              <button
                type="button"
                className="grid place-items-center text-tertiary hover:text-primary"
                onClick={() => {
                  onSearchChange("");
                  setIsSearchOpen(false);
                }}
              >
                <CloseIcon className="size-3" />
              </button>
            </div>
          )}
          <FiltersDropdown
            icon={<ListFilter className="size-3.5" strokeWidth={1.75} />}
            title={t("common.filters")}
            placement="bottom-end"
            isFiltersApplied={filtersApplied}
            appearance="hub"
          >
            <div className="flex w-56 flex-col gap-3 p-3">
              <FilterSelect
                label={t("project.status_report.filter_status")}
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as StatusReportStatusFilter)}
                options={[
                  { value: "all", label: t("project.status_report.filter_status_all") },
                  { value: "draft", label: t("project.status_report.filter_status_draft") },
                  { value: "published", label: t("project.status_report.filter_status_published") },
                ]}
              />
              <FilterSelect
                label={t("project.status_report.filter_period")}
                value={periodFilter}
                onChange={(v) => setPeriodFilter(v as StatusReportPeriodFilter)}
                options={[
                  { value: "all", label: t("project.status_report.filter_period_all") },
                  { value: "current_week", label: t("project.status_report.filter_period_current") },
                  { value: "4w", label: t("project.status_report.filter_period_4w") },
                  { value: "8w", label: t("project.status_report.filter_period_8w") },
                ]}
              />
              {(modules?.length ?? 0) > 0 ? (
                <FilterSelect
                  label={t("project.status_report.filter_module")}
                  value={filterModuleId}
                  onChange={setFilterModuleId}
                  options={[
                    { value: "", label: t("project.status_report.all_modules") },
                    ...(modules ?? []).map((m) => ({ value: m.id, label: m.name })),
                  ]}
                />
              ) : null}
            </div>
          </FiltersDropdown>
          <Tooltip
            tooltipContent={
              historySort === "desc"
                ? t("project.status_report.sort_newest")
                : t("project.status_report.sort_oldest")
            }
          >
            <IconButton
              variant="ghost"
              size="sm"
              aria-label={t("project.status_report.sort_toggle")}
              icon={ArrowDownWideNarrow}
              className={cn(
                "h-8 w-8 border-0 bg-transparent shadow-none hover:bg-layer-transparent-hover",
                historySort === "asc" && "rotate-180"
              )}
              onClick={onToggleSort}
            />
          </Tooltip>
        </ProjectHubToolbarSegment>

        <ProjectHubToolbarDivider />

        <ProjectHubToolbarSegment>
          <div className={PROJECT_HUB_LAYOUT_TOGGLE_GROUP}>
            {VIEWS.map(({ key, icon: Icon, labelKey }) => (
              <Tooltip key={key} tooltipContent={t(labelKey)}>
                <button
                  type="button"
                  className={cn(
                    "grid h-7 w-8 place-items-center rounded-md transition-all hover:bg-layer-transparent-hover",
                    listView === key &&
                      "bg-layer-transparent-active shadow-sm ring-1 ring-inset ring-subtle/50"
                  )}
                  onClick={() => setListView(key)}
                  aria-label={t(labelKey)}
                >
                  <Icon className="size-3.5 text-secondary" strokeWidth={1.75} />
                </button>
              </Tooltip>
            ))}
          </div>
        </ProjectHubToolbarSegment>

        {canManage && onBatchExport ? (
          <>
            <ProjectHubToolbarDivider />
            <ProjectHubToolbarSegment>
              <button
                type="button"
                disabled={batchExporting}
                className="h-8 rounded-md px-2.5 text-13 font-medium text-secondary hover:bg-layer-transparent-hover hover:text-primary disabled:opacity-50"
                onClick={onBatchExport}
              >
                {batchExporting
                  ? t("project.status_report.batch_exporting")
                  : t("project.status_report.batch_export")}
              </button>
            </ProjectHubToolbarSegment>
          </>
        ) : null}
    </ProjectHubToolbar>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const selected = options.find((o) => o.value === value);
  return (
    <div>
      <p className="mb-1 text-11 font-medium text-tertiary">{label}</p>
      <CustomSelect value={value} onChange={onChange} label={selected?.label ?? ""} buttonClassName="w-full">
        {options.map((opt) => (
          <CustomSelect.Option key={opt.value || "_all"} value={opt.value}>
            {opt.label}
          </CustomSelect.Option>
        ))}
      </CustomSelect>
    </div>
  );
}
