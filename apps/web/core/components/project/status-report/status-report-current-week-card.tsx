import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  ExternalLink,
  FilePlus2,
  ScrollText,
  Search,
} from "lucide-react";
import { MODULE_STATUS } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { ModuleStatusIcon } from "@operoz/propel/icons";
import { Button } from "@operoz/propel/button";
import { IconButton } from "@operoz/propel/icon-button";
import type { TModuleStatus } from "@operoz/types";
import { Checkbox, CustomSelect } from "@operoz/ui";
import { cn, renderFormattedDate } from "@operoz/utils";
import { BOARD_HUB_STATUS_REPORT_WEEK_PANEL } from "@/components/board/board-hub-background";
import { formatReportWeekLabel } from "@/components/project/status-report/format-status-report-week";
import {
  STATUS_REPORT_CURRENT_WEEK_PAGE_SIZE,
  STATUS_REPORT_CURRENT_WEEK_PAGINATE_FROM,
  matchesCoverageFilter,
  matchesWeekModuleStatusFilter,
  parseModuleDisplayName,
  resolveModuleStatus,
  type ModuleWeekStatus,
  type StatusReportCoverageFilter,
  type StatusReportWeekModuleFilter,
  type WeekModuleCoverage,
} from "@/components/project/status-report/status-report-utils";

type Props = {
  week: { start: string; end: string };
  isCurrentWeek: boolean;
  onShiftWeek: (delta: number) => void;
  coverage: WeekModuleCoverage[];
  canManage: boolean;
  onCreateReport?: (moduleIds?: string[]) => void;
  onContinue: (reportId: string) => void;
  onOpen: (reportId: string) => void;
  onOpenModule: (moduleId: string) => void;
  historySectionId?: string;
};

const STATUS_ORDER: Record<ModuleWeekStatus, number> = {
  stale_draft: 0,
  none: 1,
  draft: 2,
  published: 3,
};

const WEEK_TABLE_MIN_WIDTH = "min-w-[920px]";

const TH = "px-3 py-2.5 text-left text-10 font-semibold uppercase tracking-wide text-tertiary whitespace-nowrap";
const TD = "px-3 py-3 align-middle";

const MODULE_STATUS_TONE: Record<TModuleStatus, { chip: string }> = {
  backlog: { chip: "border-subtle bg-layer-2/80 text-secondary" },
  planned: { chip: "border-accent-primary/25 bg-accent-primary/10 text-accent-primary" },
  "in-progress": { chip: "border-warning-subtle/60 bg-warning-subtle/20 text-warning-primary" },
  paused: { chip: "border-subtle bg-layer-2 text-tertiary" },
  completed: { chip: "border-success-subtle/60 bg-success-subtle/20 text-success-primary" },
  cancelled: { chip: "border-danger-subtle/60 bg-danger-subtle/20 text-danger-primary" },
};

const REPORT_STATUS_META: Record<ModuleWeekStatus, { chip: string; labelKey: string; Icon: typeof CircleDashed }> = {
  none: {
    chip: "border border-dashed border-subtle/80 bg-layer-1/60 text-tertiary",
    labelKey: "project.status_report.module_missing",
    Icon: CircleDashed,
  },
  draft: {
    chip: "border border-subtle bg-layer-2/90 text-secondary",
    labelKey: "project.status_report.module_draft",
    Icon: ScrollText,
  },
  published: {
    chip: "border border-accent-primary/30 bg-accent-primary/10 text-accent-primary",
    labelKey: "project.status_report.module_published",
    Icon: CheckCircle2,
  },
  stale_draft: {
    chip: "border border-warning-subtle/60 bg-warning-subtle/25 text-warning-primary",
    labelKey: "project.status_report.stale_draft_badge",
    Icon: AlertTriangle,
  },
};

export function StatusReportCurrentWeekCard(props: Props) {
  const {
    week,
    isCurrentWeek,
    onShiftWeek,
    coverage,
    canManage,
    onCreateReport,
    onContinue,
    onOpen,
    onOpenModule,
    historySectionId = "status-report-history",
  } = props;
  const { t } = useTranslation();
  const [pendingPage, setPendingPage] = useState(1);
  const [donePage, setDonePage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleStatusFilter, setModuleStatusFilter] = useState<StatusReportWeekModuleFilter>("active");
  const [reportFilter, setReportFilter] = useState<StatusReportCoverageFilter>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const weekLabel = formatReportWeekLabel(week.start, week.end, t);
  const dateRange = `${renderFormattedDate(week.start)} — ${renderFormattedDate(week.end)}`;

  const counts = useMemo(() => {
    const published = coverage.filter((c) => c.status === "published").length;
    const pending = coverage.filter((c) => c.status === "none").length;
    const open = coverage.filter((c) => resolveModuleStatus(c.moduleStatus) !== "completed").length;
    return { published, pending, open, total: coverage.length };
  }, [coverage]);

  const pct = counts.total > 0 ? Math.round((counts.published / counts.total) * 100) : 0;

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = coverage.filter((item) => {
      if (!matchesWeekModuleStatusFilter(item.moduleStatus, moduleStatusFilter)) return false;
      if (!matchesCoverageFilter(item.status, reportFilter)) return false;
      if (q) {
        const parsed = parseModuleDisplayName(item.moduleName);
        const haystack = [item.moduleName, parsed.title, parsed.subtitle, parsed.code]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
    return [...list].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  }, [coverage, moduleStatusFilter, reportFilter, searchQuery]);

  const statusFilterOptions = useMemo(() => {
    const base: { value: StatusReportWeekModuleFilter; label: string }[] = [
      { value: "active", label: t("project.status_report.current_week_module_status_active") },
      { value: "all", label: t("project.status_report.current_week_module_status_all") },
    ];
    for (const status of MODULE_STATUS) {
      base.push({ value: status.value, label: t(status.i18n_label) });
    }
    return base;
  }, [t]);

  const reportFilterOptions = useMemo(
    () => [
      { value: "all" as const, label: t("project.status_report.current_week_report_filter_all") },
      { value: "pending" as const, label: t("project.status_report.module_missing") },
      { value: "draft" as const, label: t("project.status_report.module_draft") },
      { value: "stale" as const, label: t("project.status_report.stale_draft_badge") },
      { value: "published" as const, label: t("project.status_report.module_published") },
    ],
    [t]
  );

  const selectedStatusFilter =
    statusFilterOptions.find((opt) => opt.value === moduleStatusFilter) ?? statusFilterOptions[0];
  const selectedReportFilter = reportFilterOptions.find((opt) => opt.value === reportFilter) ?? reportFilterOptions[0];

  const toggleSelection = useCallback((moduleId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  useEffect(() => {
    setPendingPage(1);
    setDonePage(1);
    clearSelection();
  }, [searchQuery, moduleStatusFilter, reportFilter, coverage.length, week.start, clearSelection]);

  if (counts.total === 0) return null;

  const pendingItems = filtered.filter((c) => c.status !== "published");
  const doneItems = filtered.filter((c) => c.status === "published");
  const isFiltering = searchQuery.trim().length > 0 || moduleStatusFilter !== "active" || reportFilter !== "all";
  const selectedCount = selectedIds.size;

  const handleGenerate = () => {
    if (!onCreateReport) return;
    if (selectedCount > 0) onCreateReport([...selectedIds]);
    else onCreateReport();
  };

  const emptyMessage = getEmptyStateMessage({
    t,
    searchQuery,
    reportFilter,
    moduleStatusFilter,
  });

  return (
    <section className={cn(BOARD_HUB_STATUS_REPORT_WEEK_PANEL, "mb-3 flex flex-col")}>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-accent-primary/80 via-accent-primary/40 to-transparent"
        aria-hidden
      />

      <div className="flex flex-col gap-3 border-b border-subtle/40 pb-4 pl-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <IconButton
            variant="ghost"
            size="sm"
            icon={ChevronLeft}
            aria-label={t("project.status_report.current_week_shift_prev")}
            className="mt-1 shrink-0"
            onClick={() => onShiftWeek(-1)}
          />
          <div className="flex min-w-0 items-center gap-3">
            <span className="border-accent-primary/25 grid size-9 shrink-0 place-items-center rounded-lg border bg-accent-primary/10 text-accent-primary">
              <CalendarDays className="size-4" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-11 font-semibold tracking-wide text-tertiary uppercase">
                {t("project.status_report.current_week_title")}
              </p>
              <h2 className="text-14 font-semibold text-primary">{weekLabel}</h2>
              <p className="text-11 text-tertiary">{dateRange}</p>
              {!isCurrentWeek ? (
                <p className="mt-0.5 text-11 font-medium text-warning-primary">
                  {t("project.status_report.current_week_not_current")}
                </p>
              ) : null}
            </div>
          </div>
          <IconButton
            variant="ghost"
            size="sm"
            icon={ChevronRight}
            aria-label={t("project.status_report.current_week_shift_next")}
            className="mt-1 shrink-0"
            disabled={isCurrentWeek}
            onClick={() => onShiftWeek(1)}
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={ChevronDown}
            aria-label={
              isCollapsed
                ? t("project.status_report.current_week_expand")
                : t("project.status_report.current_week_collapse")
            }
            className={cn("mt-1 shrink-0 transition-transform", isCollapsed && "-rotate-90")}
            onClick={() => setIsCollapsed((v) => !v)}
          />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5 sm:pt-1">
          <span className="text-20 font-semibold text-accent-primary tabular-nums">{pct}%</span>
          <span className="text-11 text-tertiary">
            {t("project.status_report.coverage_ratio", {
              published: counts.published,
              total: counts.total,
            })}
          </span>
          <span className="text-11 text-tertiary">
            {t("project.status_report.current_week_coverage_context", {
              open: counts.open,
              pending: counts.pending,
            })}
          </span>
        </div>
      </div>

      {isCollapsed ? (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-3">
          <p className="text-12 text-secondary">
            {t("project.status_report.current_week_pending", { count: pendingItems.length + doneItems.length })} ·{" "}
            {t("project.status_report.current_week_coverage_context", { open: counts.open, pending: counts.pending })}
          </p>
          <button
            type="button"
            className="text-12 font-medium text-accent-primary hover:underline"
            onClick={() =>
              document.getElementById(historySectionId)?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          >
            {t("project.status_report.current_week_scroll_history")}
          </button>
        </div>
      ) : (
        <>
          <CoverageSummary coverage={coverage} activeFilter={reportFilter} onFilterChange={setReportFilter} t={t} />

          <div className="mb-2 flex shrink-0 flex-col gap-2 pl-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-md border border-subtle/50 bg-layer-2/60 px-2.5 sm:max-w-xs">
                <Search className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />
                <input
                  className="w-full min-w-0 border-none bg-transparent text-13 text-primary placeholder:text-placeholder focus:outline-none"
                  placeholder={t("project.status_report.current_week_module_search_placeholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <CustomSelect
                value={moduleStatusFilter}
                onChange={(val: string) => setModuleStatusFilter(val as StatusReportWeekModuleFilter)}
                label={selectedStatusFilter.label}
                buttonClassName="h-8 w-full min-w-[9.5rem] sm:w-auto"
              >
                {statusFilterOptions.map((opt) => (
                  <CustomSelect.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </CustomSelect.Option>
                ))}
              </CustomSelect>
              <CustomSelect
                value={reportFilter}
                onChange={(val: string) => setReportFilter(val as StatusReportCoverageFilter)}
                label={selectedReportFilter.label}
                buttonClassName="h-8 w-full min-w-[9.5rem] sm:w-auto"
              >
                {reportFilterOptions.map((opt) => (
                  <CustomSelect.Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </CustomSelect.Option>
                ))}
              </CustomSelect>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:ml-2">
              {selectedCount > 0 ? (
                <>
                  <span className="text-11 font-medium text-secondary">
                    {t("project.status_report.current_week_selected_count", { count: selectedCount })}
                  </span>
                  <button
                    type="button"
                    className="text-11 font-medium text-tertiary hover:text-secondary"
                    onClick={clearSelection}
                  >
                    {t("project.status_report.current_week_clear_selection")}
                  </button>
                </>
              ) : null}
              {canManage && onCreateReport ? (
                <Button variant="primary" size="sm" className="h-8 px-3 text-12" onClick={handleGenerate}>
                  <FilePlus2 className="size-3.5" strokeWidth={1.75} />
                  {selectedCount > 0
                    ? selectedCount === 1
                      ? t("project.status_report.current_week_generate_single")
                      : t("project.status_report.current_week_generate_selection", { count: selectedCount })
                    : t("project.status_report.create_button")}
                </Button>
              ) : null}
            </div>
          </div>

          {isFiltering ? (
            <p className="mb-2 pl-1 text-11 text-tertiary">
              {t("project.status_report.current_week_filter_hint", {
                shown: filtered.length,
                total: counts.total,
              })}
            </p>
          ) : null}

          <div className="rounded-lg border border-subtle/50 bg-layer-1/40">
            {filtered.length === 0 ? (
              <WeekEmptyState
                message={emptyMessage}
                onViewPublished={
                  reportFilter === "pending" && counts.published > 0 ? () => setReportFilter("published") : undefined
                }
                t={t}
              />
            ) : null}
            {pendingItems.length > 0 ? (
              <ModuleGroup
                title={t("project.status_report.current_week_pending", { count: pendingItems.length })}
                items={pendingItems}
                page={pendingPage}
                onPageChange={setPendingPage}
                canManage={canManage}
                selectedIds={selectedIds}
                onToggleSelection={toggleSelection}
                onSelectPage={(ids) => setSelectedIds(new Set(ids))}
                t={t}
                onContinue={onContinue}
                onOpen={onOpen}
                onOpenModule={onOpenModule}
                onCreateReport={onCreateReport}
              />
            ) : null}
            {doneItems.length > 0 ? (
              <ModuleGroup
                title={t("project.status_report.current_week_done", { count: doneItems.length })}
                items={doneItems}
                page={donePage}
                onPageChange={setDonePage}
                canManage={false}
                selectedIds={selectedIds}
                onToggleSelection={toggleSelection}
                t={t}
                onContinue={onContinue}
                onOpen={onOpen}
                onOpenModule={onOpenModule}
                muted
              />
            ) : null}
          </div>

          <div className="mt-2 flex shrink-0 justify-end px-1 pb-1">
            <button
              type="button"
              className="text-11 font-medium text-accent-primary hover:underline"
              onClick={() =>
                document.getElementById(historySectionId)?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              {t("project.status_report.current_week_scroll_history")} ↓
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function getEmptyStateMessage(opts: {
  t: ReturnType<typeof useTranslation>["t"];
  searchQuery: string;
  reportFilter: StatusReportCoverageFilter;
  moduleStatusFilter: StatusReportWeekModuleFilter;
}): string {
  const { t, searchQuery, reportFilter, moduleStatusFilter } = opts;
  if (searchQuery.trim()) return t("project.status_report.current_week_no_match");
  if (reportFilter === "pending") return t("project.status_report.current_week_empty_all_have_report");
  if (reportFilter === "published") return t("project.status_report.current_week_empty_no_published");
  if (moduleStatusFilter === "active") return t("project.status_report.current_week_empty_no_active");
  return t("project.status_report.current_week_no_match");
}

function WeekEmptyState({
  message,
  onViewPublished,
  t,
}: {
  message: string;
  onViewPublished?: () => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <p className="max-w-md text-13 text-secondary">{message}</p>
      {onViewPublished ? (
        <Button variant="secondary" size="sm" onClick={onViewPublished}>
          {t("project.status_report.current_week_view_published")}
        </Button>
      ) : null}
    </div>
  );
}

function CoverageSummary({
  coverage,
  activeFilter,
  onFilterChange,
  t,
}: {
  coverage: WeekModuleCoverage[];
  activeFilter: StatusReportCoverageFilter;
  onFilterChange: (filter: StatusReportCoverageFilter) => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const total = coverage.length;
  if (total === 0) return null;

  const published = coverage.filter((c) => c.status === "published").length;
  const draft = coverage.filter((c) => c.status === "draft").length;
  const stale = coverage.filter((c) => c.status === "stale_draft").length;
  const pending = coverage.filter((c) => c.status === "none").length;

  const segments = [
    published > 0
      ? {
          key: "published",
          filter: "published" as const,
          count: published,
          barClass: "bg-accent-primary",
          chipClass: "border-accent-primary/30 bg-accent-primary/10 text-accent-primary",
          label: t("project.status_report.coverage_stat_published"),
          Icon: CheckCircle2,
        }
      : null,
    draft > 0
      ? {
          key: "draft",
          filter: "draft" as const,
          count: draft,
          barClass: "bg-secondary/80",
          chipClass: "border-subtle bg-layer-2/90 text-secondary",
          label: t("project.status_report.coverage_stat_draft"),
          Icon: ScrollText,
        }
      : null,
    stale > 0
      ? {
          key: "stale",
          filter: "stale" as const,
          count: stale,
          barClass: "bg-warning-primary",
          chipClass: "border-warning-subtle/60 bg-warning-subtle/25 text-warning-primary",
          label: t("project.status_report.coverage_stat_stale"),
          Icon: AlertTriangle,
        }
      : null,
    pending > 0
      ? {
          key: "pending",
          filter: "pending" as const,
          count: pending,
          barClass: "bg-layer-3",
          chipClass: "border border-dashed border-subtle/80 bg-layer-1/60 text-tertiary",
          label: t("project.status_report.coverage_stat_pending"),
          Icon: CircleDashed,
        }
      : null,
  ].filter(Boolean) as {
    key: string;
    filter: StatusReportCoverageFilter;
    count: number;
    barClass: string;
    chipClass: string;
    label: string;
    Icon: typeof CircleDashed;
  }[];

  const toggleFilter = (filter: StatusReportCoverageFilter) => {
    onFilterChange(activeFilter === filter ? "all" : filter);
  };

  return (
    <div className="mb-3 space-y-2.5 pl-1">
      <div className="flex h-2 overflow-hidden rounded-full bg-layer-2 ring-1 ring-subtle/30 ring-inset">
        {segments.map((seg) => (
          <button
            key={seg.key}
            type="button"
            className={cn("h-full min-w-[2px] transition-all hover:opacity-80", seg.barClass)}
            style={{ width: `${(seg.count / total) * 100}%` }}
            title={`${seg.label}: ${seg.count}`}
            onClick={() => toggleFilter(seg.filter)}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {segments.map((seg) => {
          const isActive = activeFilter === seg.filter;
          return (
            <button
              key={seg.key}
              type="button"
              onClick={() => toggleFilter(seg.filter)}
              className={cn(
                "inline-flex min-w-0 items-center gap-2 rounded-md border px-2.5 py-1.5 text-left transition-all",
                seg.chipClass,
                isActive && "ring-accent-primary/40 ring-2 ring-offset-1 ring-offset-transparent"
              )}
            >
              <span className="grid size-6 shrink-0 place-items-center rounded-sm border border-subtle/40 bg-layer-1/50">
                <seg.Icon className="size-3.5 shrink-0" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-11 font-medium">{seg.label}</p>
                <p className="text-13 font-semibold tabular-nums">{seg.count}</p>
              </div>
            </button>
          );
        })}
        {activeFilter !== "all" ? (
          <button
            type="button"
            className="self-center text-11 font-medium text-tertiary hover:text-secondary"
            onClick={() => onFilterChange("all")}
          >
            {t("project.status_report.current_week_report_filter_all")}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ModuleGroup({
  title,
  items,
  page,
  onPageChange,
  canManage,
  selectedIds,
  onToggleSelection,
  onSelectPage,
  t,
  onContinue,
  onOpen,
  onOpenModule,
  onCreateReport,
  muted = false,
}: {
  title: string;
  items: WeekModuleCoverage[];
  page: number;
  onPageChange: (page: number) => void;
  canManage: boolean;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onSelectPage?: (ids: string[]) => void;
  t: ReturnType<typeof useTranslation>["t"];
  onContinue: (id: string) => void;
  onOpen: (id: string) => void;
  onOpenModule: (moduleId: string) => void;
  onCreateReport?: (moduleIds?: string[]) => void;
  muted?: boolean;
}) {
  const usePagination = items.length >= STATUS_REPORT_CURRENT_WEEK_PAGINATE_FROM;
  const pageSize = STATUS_REPORT_CURRENT_WEEK_PAGE_SIZE;
  const totalPages = usePagination ? Math.max(1, Math.ceil(items.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) onPageChange(totalPages);
  }, [page, totalPages, onPageChange]);

  const visible = usePagination ? items.slice((safePage - 1) * pageSize, safePage * pageSize) : items;

  const selectableVisible = visible.filter((item) => item.status !== "published");
  const allPageSelected =
    selectableVisible.length > 0 && selectableVisible.every((item) => selectedIds.has(item.moduleId));

  return (
    <div className={cn("flex min-h-0 flex-col", muted && "border-t border-subtle/40 bg-layer-2/15")}>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-subtle/40 bg-layer-1/80 px-3 py-2">
        <p className="text-11 font-semibold tracking-wide text-tertiary uppercase">{title}</p>
        <div className="flex items-center gap-3">
          {items.length > 5 ? (
            <span className="text-11 text-tertiary">{t("project.status_report.current_week_scroll_hint")}</span>
          ) : null}
          {canManage && onSelectPage && selectableVisible.length > 0 ? (
            <button
              type="button"
              className="text-11 font-medium text-accent-primary hover:underline"
              onClick={() => {
                if (allPageSelected) onSelectPage([]);
                else onSelectPage(selectableVisible.map((i) => i.moduleId));
              }}
            >
              {allPageSelected
                ? t("project.status_report.current_week_clear_selection")
                : t("project.status_report.current_week_select_page")}
            </button>
          ) : null}
        </div>
      </div>
      {/* Mobile: cards empilhados — legível em telas estreitas */}
      <div className="max-h-[min(55vh,420px)] min-h-[220px] overflow-y-auto overscroll-y-contain lg:hidden">
        <ul className="divide-y divide-subtle/40">
          {visible.map((item) => (
            <ModuleMobileRow
              key={item.moduleId}
              item={item}
              canManage={canManage}
              selected={selectedIds.has(item.moduleId)}
              onToggleSelection={onToggleSelection}
              t={t}
              onContinue={onContinue}
              onOpen={onOpen}
              onOpenModule={onOpenModule}
              onCreateReport={onCreateReport}
            />
          ))}
        </ul>
      </div>
      {/* Desktop: tabela com scroll horizontal + vertical */}
      <div className="hidden max-h-[min(55vh,420px)] min-h-[220px] overflow-auto overscroll-contain lg:block">
        <table className={cn("w-full table-fixed border-collapse", WEEK_TABLE_MIN_WIDTH)}>
          <thead className="sticky top-0 z-[1] bg-layer-1/95 backdrop-blur-sm">
            <tr className="border-b border-subtle/30">
              {canManage ? (
                <th className={cn(TH, "w-10")} scope="col">
                  <span className="sr-only">{t("project.status_report.current_week_select_page")}</span>
                </th>
              ) : null}
              <th className={cn(TH, "w-[34%]")} scope="col">
                {t("project.status_report.current_week_col_module")}
              </th>
              <th className={cn(TH, "w-16 text-center")} scope="col">
                {t("project.status_report.current_week_col_progress")}
              </th>
              <th className={cn(TH, "w-28")} scope="col">
                {t("project.status_report.current_week_col_stage")}
              </th>
              <th className={cn(TH, "w-28")} scope="col">
                {t("project.status_report.current_week_module_status_col")}
              </th>
              <th className={cn(TH, "w-32")} scope="col">
                {t("project.status_report.current_week_col_report")}
              </th>
              <th className={cn(TH, "w-28 text-right")} scope="col">
                {t("project.status_report.current_week_col_actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle/40">
            {visible.map((item) => (
              <ModuleTableRow
                key={item.moduleId}
                item={item}
                canManage={canManage}
                selected={selectedIds.has(item.moduleId)}
                onToggleSelection={onToggleSelection}
                t={t}
                onContinue={onContinue}
                onOpen={onOpen}
                onOpenModule={onOpenModule}
                onCreateReport={onCreateReport}
              />
            ))}
          </tbody>
        </table>
      </div>
      {usePagination ? (
        <div className="shrink-0 border-t border-subtle/40 bg-layer-2/30">
          <ModuleGroupPagination
            page={safePage}
            totalPages={totalPages}
            total={items.length}
            pageSize={pageSize}
            onPageChange={onPageChange}
            t={t}
          />
        </div>
      ) : items.length > 5 ? (
        <p className="shrink-0 border-t border-subtle/40 bg-layer-2/20 px-3 py-1.5 text-center text-11 text-tertiary">
          {t("project.status_report.current_week_list_total", { total: items.length })}
        </p>
      ) : null}
    </div>
  );
}

function ModuleGroupPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  t,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-subtle/40 bg-layer-2/20 px-3 py-2">
      <p className="text-11 text-tertiary">
        {t("project.status_report.current_week_page_range", { start, end, total })}
      </p>
      <div className="flex items-center gap-1">
        <IconButton
          variant="ghost"
          size="sm"
          icon={ChevronLeft}
          aria-label={t("project.status_report.pagination_prev")}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        />
        <span className="min-w-[4rem] text-center text-11 font-medium text-secondary tabular-nums">
          {t("project.status_report.pagination_page", { page, totalPages })}
        </span>
        <IconButton
          variant="ghost"
          size="sm"
          icon={ChevronRight}
          aria-label={t("project.status_report.pagination_next")}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        />
      </div>
    </div>
  );
}

function ModuleMobileRow({
  item,
  canManage,
  selected,
  onToggleSelection,
  t,
  onContinue,
  onOpen,
  onOpenModule,
  onCreateReport,
}: {
  item: WeekModuleCoverage;
  canManage: boolean;
  selected: boolean;
  onToggleSelection: (id: string) => void;
  t: ReturnType<typeof useTranslation>["t"];
  onContinue: (id: string) => void;
  onOpen: (id: string) => void;
  onOpenModule: (moduleId: string) => void;
  onCreateReport?: (moduleIds?: string[]) => void;
}) {
  const parsed = parseModuleDisplayName(item.moduleName);
  const selectable = canManage && item.status !== "published";
  const fullTitle = parsed.subtitle ? `${parsed.title} — ${parsed.subtitle}` : parsed.title;

  return (
    <li className="px-3 py-3">
      <div className="flex gap-2.5">
        {canManage ? (
          <div className="pt-0.5">
            {selectable ? (
              <Checkbox
                checked={selected}
                onChange={() => onToggleSelection(item.moduleId)}
                aria-label={parsed.title}
              />
            ) : (
              <span className="size-4" aria-hidden />
            )}
          </div>
        ) : null}
        <div className="min-w-0 flex-1 space-y-2">
          <button
            type="button"
            className="w-full text-left"
            onClick={() => onOpenModule(item.moduleId)}
            title={fullTitle}
          >
            <p className="text-13 leading-snug font-medium text-primary">{parsed.title}</p>
            {parsed.subtitle ? <p className="mt-0.5 text-11 leading-snug text-tertiary">{parsed.subtitle}</p> : null}
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <ModuleProgressMini pct={item.progressPct} />
            <ModuleStageBadge stageName={item.stageName} stageColor={item.stageColor} t={t} />
            <ModuleStatusBadge moduleStatus={item.moduleStatus} t={t} />
            <ReportWeekStatusBadge status={item.status} t={t} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {item.status === "none" && canManage && onCreateReport ? (
              <Button
                variant="secondary"
                size="sm"
                className="h-7 px-2.5 text-12"
                onClick={() => onCreateReport([item.moduleId])}
              >
                {t("project.status_report.current_week_start_report")}
                <ChevronRight className="ml-0.5 size-3.5" />
              </Button>
            ) : null}
            {(item.status === "draft" || item.status === "stale_draft") && item.reportId ? (
              <Button
                variant={item.status === "stale_draft" ? "primary" : "secondary"}
                size="sm"
                className="h-7 px-2.5 text-12"
                onClick={() => (canManage ? onContinue(item.reportId!) : onOpen(item.reportId!))}
              >
                {canManage ? t("project.status_report.continue_draft") : t("project.status_report.view_report")}
                <ChevronRight className="ml-0.5 size-3.5" />
              </Button>
            ) : null}
            {item.status === "published" && item.reportId ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-12 text-secondary"
                onClick={() => onOpen(item.reportId!)}
              >
                {t("project.status_report.view_report")}
                <ChevronRight className="ml-0.5 size-3.5" />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-12 text-tertiary"
              onClick={() => onOpenModule(item.moduleId)}
            >
              <ExternalLink className="size-3.5" />
              {t("project.status_report.current_week_open_module")}
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}

function ModuleTableRow({
  item,
  canManage,
  selected,
  onToggleSelection,
  t,
  onContinue,
  onOpen,
  onOpenModule,
  onCreateReport,
}: {
  item: WeekModuleCoverage;
  canManage: boolean;
  selected: boolean;
  onToggleSelection: (id: string) => void;
  t: ReturnType<typeof useTranslation>["t"];
  onContinue: (id: string) => void;
  onOpen: (id: string) => void;
  onOpenModule: (moduleId: string) => void;
  onCreateReport?: (moduleIds?: string[]) => void;
}) {
  const parsed = parseModuleDisplayName(item.moduleName);
  const selectable = canManage && item.status !== "published";
  const fullTitle = parsed.subtitle ? `${parsed.title} — ${parsed.subtitle}` : parsed.title;

  return (
    <tr className="group transition-colors hover:bg-layer-2/40">
      {canManage ? (
        <td className={cn(TD, "w-10 text-center")}>
          {selectable ? (
            <Checkbox checked={selected} onChange={() => onToggleSelection(item.moduleId)} aria-label={parsed.title} />
          ) : null}
        </td>
      ) : null}
      <td className={TD}>
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={() => onOpenModule(item.moduleId)}
            title={fullTitle}
          >
            <p className="truncate text-13 font-medium whitespace-nowrap text-primary group-hover:text-accent-primary">
              {parsed.title}
            </p>
            {parsed.subtitle ? (
              <p className="truncate text-11 whitespace-nowrap text-tertiary">{parsed.subtitle}</p>
            ) : null}
          </button>
          <IconButton
            variant="ghost"
            size="sm"
            icon={ExternalLink}
            className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            aria-label={t("project.status_report.current_week_open_module")}
            onClick={() => onOpenModule(item.moduleId)}
          />
        </div>
      </td>
      <td className={cn(TD, "text-center")}>
        <ModuleProgressMini pct={item.progressPct} />
      </td>
      <td className={TD}>
        <ModuleStageBadge stageName={item.stageName} stageColor={item.stageColor} t={t} />
      </td>
      <td className={TD}>
        <ModuleStatusBadge moduleStatus={item.moduleStatus} t={t} />
      </td>
      <td className={TD}>
        <ReportWeekStatusBadge status={item.status} t={t} />
      </td>
      <td className={cn(TD, "text-right")}>
        <div className="flex justify-end">
          {item.status === "none" && canManage && onCreateReport ? (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 px-2.5 text-12 whitespace-nowrap"
              onClick={() => onCreateReport([item.moduleId])}
            >
              {t("project.status_report.current_week_start_report")}
              <ChevronRight className="ml-0.5 size-3.5" />
            </Button>
          ) : null}
          {(item.status === "draft" || item.status === "stale_draft") && item.reportId ? (
            <Button
              variant={item.status === "stale_draft" ? "primary" : "secondary"}
              size="sm"
              className="h-7 px-2.5 text-12 whitespace-nowrap"
              onClick={() => (canManage ? onContinue(item.reportId!) : onOpen(item.reportId!))}
            >
              {canManage ? t("project.status_report.continue_draft") : t("project.status_report.view_report")}
              <ChevronRight className="ml-0.5 size-3.5" />
            </Button>
          ) : null}
          {item.status === "published" && item.reportId ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-12 whitespace-nowrap text-secondary"
              onClick={() => onOpen(item.reportId!)}
            >
              {t("project.status_report.view_report")}
              <ChevronRight className="ml-0.5 size-3.5" />
            </Button>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function ModuleProgressMini({ pct }: { pct: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5" title={`${pct}%`}>
      <span className="text-10 font-medium text-tertiary tabular-nums">{pct}%</span>
      <div className="h-1 w-9 overflow-hidden rounded-full bg-layer-2 ring-1 ring-subtle/30 ring-inset">
        <div
          className="h-full rounded-full bg-accent-primary transition-all"
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
    </div>
  );
}

function ModuleStageBadge({
  stageName,
  stageColor,
  t,
}: {
  stageName: string | null;
  stageColor: string | null;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  if (!stageName) {
    return (
      <span className="inline-flex rounded-sm border border-dashed border-subtle/60 px-2 py-0.5 text-11 whitespace-nowrap text-tertiary">
        {t("project_modules.stage.no_stage")}
      </span>
    );
  }
  const resolved = stageColor?.startsWith("#") ? stageColor : null;
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 truncate rounded-sm border border-subtle px-2 py-0.5 text-11 font-medium whitespace-nowrap",
        !resolved && "bg-layer-2/80 text-secondary"
      )}
      style={resolved ? { color: resolved, backgroundColor: `${resolved}20`, borderColor: `${resolved}40` } : undefined}
      title={stageName}
    >
      <span
        className="bg-tertiary size-1.5 shrink-0 rounded-full"
        style={resolved ? { backgroundColor: resolved } : undefined}
      />
      <span className="truncate">{stageName}</span>
    </span>
  );
}

function ModuleStatusBadge({
  moduleStatus,
  t,
}: {
  moduleStatus: TModuleStatus | undefined;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const resolved = resolveModuleStatus(moduleStatus);
  const config = MODULE_STATUS.find((s) => s.value === resolved);
  const tone = MODULE_STATUS_TONE[resolved];
  if (!config || !tone) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-11 font-medium whitespace-nowrap",
        tone.chip
      )}
    >
      <ModuleStatusIcon status={resolved} />
      <span>{t(config.i18n_label)}</span>
    </span>
  );
}

function ReportWeekStatusBadge({ status, t }: { status: ModuleWeekStatus; t: ReturnType<typeof useTranslation>["t"] }) {
  const meta = REPORT_STATUS_META[status];
  const { Icon } = meta;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-11 font-medium whitespace-nowrap",
        meta.chip
      )}
    >
      <Icon className="size-3 shrink-0" strokeWidth={1.75} />
      <span>{t(meta.labelKey)}</span>
    </span>
  );
}
