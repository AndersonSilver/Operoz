import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  History,
  ScrollText,
} from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { IconButton } from "@operis/propel/icon-button";
import { Tooltip } from "@operis/propel/tooltip";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IBoardStatusReport, IProject } from "@operis/types";
import { cn, generateQueryParams } from "@operis/utils";
import {
  BOARD_HUB_HISTORY_PANEL,
  BOARD_HUB_METRICS_STRIP,
  BOARD_HUB_PROJECT_WORK_SURFACE_INNER,
} from "@/components/board/board-hub-background";
import { useBoardHubNavigate } from "@/components/board/use-board-hub-navigate";
import { formatReportWeekLabel } from "@/components/project/status-report/format-status-report-week";
import { ProjectStatusReportCreateModal } from "@/components/project/status-report/project-status-report-create-modal";
import { StatusReportCurrentWeekCard } from "@/components/project/status-report/status-report-current-week-card";
import { StatusReportListByModule } from "@/components/project/status-report/status-report-list-by-module";
import { StatusReportListTable } from "@/components/project/status-report/status-report-list-table";
import { StatusReportListTimeline } from "@/components/project/status-report/status-report-list-timeline";
import { StatusReportHistoryHeader } from "@/components/project/status-report/status-report-history-header";
import { StatusReportListToolbar } from "@/components/project/status-report/status-report-list-toolbar";
import { BOARD_HUB_STATUS_REPORT_METRIC } from "@/components/board/board-hub-background";
import { StatusReportPeekPanel } from "@/components/project/status-report/status-report-peek-panel";
import {
  StatusReportHubProvider,
  type OpenCreateModalOptions,
} from "@/components/project/status-report/status-report-hub-context";
import {
  buildModuleCoverage,
  defaultWeekPeriod,
  filterReportsList,
  getRecentWeekPeriods,
  groupReportsByModule,
  isStaleDraft,
  periodsMatch,
  shiftWeekPeriod,
  type HistorySortOrder,
  type StatusReportListView,
  type StatusReportPeriodFilter,
  type StatusReportStatusFilter,
} from "@/components/project/status-report/status-report-utils";
import { useStatusReportCapabilities } from "@/hooks/use-status-report-capabilities";
import { useAppRouter } from "@/hooks/use-app-router";
import { ModuleService } from "@/services/module.service";
import { ProjectStatusReportService } from "@/services/project/project-status-report.service";

const reportService = new ProjectStatusReportService();
const moduleService = new ModuleService();
const HISTORY_PAGE_SIZE = 10;
const TIMELINE_WEEKS = 8;

type Props = {
  workspaceSlug: string;
  project: IProject;
};

export function ProjectStatusReportList(props: Props) {
  const { workspaceSlug, project } = props;
  const { t } = useTranslation();
  const navigate = useBoardHubNavigate();
  const router = useAppRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { canManage: canManageReports } = useStatusReportCapabilities(project.id);
  const canManage = canManageReports();

  const currentWeek = useMemo(() => defaultWeekPeriod(), []);
  const [periodStart, setPeriodStart] = useState(currentWeek.start);
  const [periodEnd, setPeriodEnd] = useState(currentWeek.end);
  const [summary, setSummary] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [filterModuleId, setFilterModuleId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusReportStatusFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<StatusReportPeriodFilter>("all");
  const [listView, setListView] = useState<StatusReportListView>("list");
  const [historyPage, setHistoryPage] = useState(1);
  const [historySort, setHistorySort] = useState<HistorySortOrder>("desc");
  const [creating, setCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [batchExporting, setBatchExporting] = useState(false);

  const createWeekLabel = useMemo(
    () => formatReportWeekLabel(periodStart, periodEnd, t),
    [periodEnd, periodStart, t]
  );

  const { data: modules } = useSWR(
    workspaceSlug && project.id ? `PROJECT_MODULES_${workspaceSlug}_${project.id}` : null,
    () => moduleService.getModules(workspaceSlug, project.id),
    { revalidateOnFocus: false }
  );

  const { data: reports, isLoading, mutate } = useSWR(
    workspaceSlug && project.id ? `PROJECT_STATUS_REPORTS_${workspaceSlug}_${project.id}` : null,
    () => reportService.list(workspaceSlug, project.id),
    { revalidateOnFocus: false }
  );

  const defaultModuleId = modules?.[0]?.id;

  useEffect(() => {
    if (!moduleId && defaultModuleId) setModuleId(defaultModuleId);
  }, [defaultModuleId, moduleId]);

  const filteredReports = useMemo(
    () =>
      filterReportsList(reports ?? [], {
        searchQuery,
        filterModuleId,
        statusFilter,
        periodFilter,
      }),
    [filterModuleId, periodFilter, reports, searchQuery, statusFilter]
  );

  const sortedReports = useMemo(() => {
    const list = [...filteredReports];
    list.sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return historySort === "desc" ? bTime - aTime : aTime - bTime;
    });
    return list;
  }, [filteredReports, historySort]);

  const totalHistoryPages = Math.max(1, Math.ceil(sortedReports.length / HISTORY_PAGE_SIZE));
  const paginatedReports = useMemo(() => {
    const start = (historyPage - 1) * HISTORY_PAGE_SIZE;
    return sortedReports.slice(start, start + HISTORY_PAGE_SIZE);
  }, [historyPage, sortedReports]);

  useEffect(() => {
    setHistoryPage(1);
  }, [filterModuleId, historySort, searchQuery, statusFilter, periodFilter, listView]);

  useEffect(() => {
    if (historyPage > totalHistoryPages) setHistoryPage(totalHistoryPages);
  }, [historyPage, totalHistoryPages]);

  const moduleCoverage = useMemo(() => {
    if (!modules?.length) return [];
    return buildModuleCoverage(modules, reports ?? [], currentWeek).map((row) => ({
      moduleId: row.module.id,
      moduleName: row.module.name,
      status: row.status,
      reportId: row.report?.id,
    }));
  }, [currentWeek, modules, reports]);

  const stats = useMemo(() => {
    const list = reports ?? [];
    const modCount = modules?.length ?? 0;
    const publishedThisWeek = moduleCoverage.filter((c) => c.status === "published").length;
    return {
      total: list.length,
      drafts: list.filter((r) => !r.is_published).length,
      published: list.filter((r) => r.is_published).length,
      coveragePct: modCount > 0 ? Math.round((publishedThisWeek / modCount) * 100) : 0,
      staleDrafts: list.filter(isStaleDraft).length,
    };
  }, [moduleCoverage, modules?.length, reports]);

  const groupedByModule = useMemo(() => {
    if (!modules?.length) return [];
    return groupReportsByModule(sortedReports, modules);
  }, [modules, sortedReports]);

  const timelineWeeks = useMemo(() => getRecentWeekPeriods(TIMELINE_WEEKS), []);

  const openCreateModal = useCallback(
    (opts?: OpenCreateModalOptions) => {
      const week =
        opts?.periodStart && opts?.periodEnd
          ? { start: opts.periodStart, end: opts.periodEnd }
          : defaultWeekPeriod();
      setPeriodStart(week.start);
      setPeriodEnd(week.end);
      setSummary("");
      if (opts?.moduleId) setModuleId(opts.moduleId);
      else if (filterModuleId) setModuleId(filterModuleId);
      else if (!moduleId && modules?.length) setModuleId(modules[0].id);
      setIsCreateModalOpen(true);
    },
    [filterModuleId, moduleId, modules]
  );

  const openPeek = useCallback(
    (reportId: string) => {
      const query = generateQueryParams(searchParams, ["peekReport"]);
      router.push(`${pathname}?${query && `${query}&`}peekReport=${reportId}`);
    },
    [pathname, router, searchParams]
  );

  const openDetail = useCallback(
    (reportId: string) => {
      navigate(`/${workspaceSlug}/projects/${project.id}/status-report/${reportId}`);
    },
    [navigate, project.id, workspaceSlug]
  );

  const handleShiftWeek = (delta: number) => {
    const next = shiftWeekPeriod(periodStart, delta);
    setPeriodStart(next.start);
    setPeriodEnd(next.end);
  };

  const handleCreate = async () => {
    if (!moduleId) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("project.status_report.module_required"),
      });
      return;
    }
    setCreating(true);
    try {
      const report = await reportService.create(workspaceSlug, project.id, {
        module_id: moduleId,
        period_start: periodStart,
        period_end: periodEnd,
        executive_summary_html: summary,
      });
      await mutate();
      setIsCreateModalOpen(false);
      navigate(`/${workspaceSlug}/projects/${project.id}/status-report/${report.id}`);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setCreating(false);
    }
  };

  const handleDuplicate = async (source: IBoardStatusReport) => {
    if (!source.module) return;
    const week = defaultWeekPeriod();
    const exists = (reports ?? []).some((r) => r.module === source.module && periodsMatch(r, week));
    if (exists) {
      setToast({
        type: TOAST_TYPE.WARNING,
        title: t("warning"),
        message: t("project.status_report.duplicate_exists"),
      });
      return;
    }
    try {
      const html = source.content?.sections?.executive_summary?.html ?? "";
      const created = await reportService.create(workspaceSlug, project.id, {
        module_id: source.module,
        period_start: week.start,
        period_end: week.end,
        executive_summary_html: html,
      });
      const em = source.content?.sections?.observacoes?.em_execucao ?? [];
      const pontos = source.content?.sections?.observacoes?.pontos_atencao ?? [];
      if (em.length || pontos.length) {
        await reportService.update(workspaceSlug, project.id, created.id, {
          em_execucao: em,
          pontos_atencao: pontos,
        });
      }
      await mutate();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("project.status_report.duplicate_success"),
      });
      navigate(`/${workspaceSlug}/projects/${project.id}/status-report/${created.id}`);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  const handleExportPdf = async (report: IBoardStatusReport) => {
    try {
      const { data, mime, filename, pdfFallback } = await reportService.downloadExport(
        workspaceSlug,
        project.id,
        report.id,
        "pdf"
      );
      const blob = new Blob([data], { type: mime });
      const url = URL.createObjectURL(blob);
      if (pdfFallback) {
        const win = window.open(url, "_blank");
        win?.addEventListener("load", () => win.print());
      } else {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  const handleBatchExport = async () => {
    const published = sortedReports.filter((r) => r.is_published);
    if (!published.length) {
      setToast({
        type: TOAST_TYPE.WARNING,
        title: t("warning"),
        message: t("project.status_report.batch_export_empty"),
      });
      return;
    }
    setBatchExporting(true);
    try {
      for (const report of published.slice(0, 15)) {
        await handleExportPdf(report);
        await new Promise((r) => setTimeout(r, 400));
      }
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("project.status_report.batch_export_success", { count: Math.min(published.length, 15) }),
      });
    } finally {
      setBatchExporting(false);
    }
  };

  const displayReports = listView === "list" ? paginatedReports : sortedReports;

  return (
    <StatusReportHubProvider value={{ openCreateModal }}>
      <div
        className={cn(
          "flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden",
          BOARD_HUB_PROJECT_WORK_SURFACE_INNER
        )}
      >
        <div className={BOARD_HUB_METRICS_STRIP}>
          <StatMetrics
            items={[
              {
                label: t("project.status_report.stat_total"),
                value: stats.total,
                icon: History,
              },
              {
                label: t("project.status_report.stat_drafts"),
                value: stats.drafts,
                sub: stats.staleDrafts > 0 ? t("project.status_report.stale_count", { count: stats.staleDrafts }) : undefined,
                icon: ScrollText,
                warn: stats.staleDrafts > 0,
              },
              {
                label: t("project.status_report.stat_published"),
                value: stats.published,
                sub: t("project.status_report.stat_coverage_sub", { pct: stats.coveragePct }),
                icon: CheckCircle2,
                accent: true,
              },
            ]}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4 md:p-5">
          {modules && modules.length > 0 ? (
            <StatusReportCurrentWeekCard
              week={currentWeek}
              coverage={moduleCoverage}
              filterQuery={searchQuery}
              canManage={canManage}
              onGenerate={(id) => openCreateModal({ moduleId: id, ...currentWeek })}
              onContinue={openDetail}
              onOpen={openPeek}
            />
          ) : null}

          <div className="relative flex min-h-0 flex-1 gap-0">
            <div className={cn(BOARD_HUB_HISTORY_PANEL, "min-h-0 min-w-0 flex-1")}>
              <StatusReportHistoryHeader
                count={filteredReports.length}
                toolbar={
                  <StatusReportListToolbar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    historySort={historySort}
                    onToggleSort={() => setHistorySort((c) => (c === "desc" ? "asc" : "desc"))}
                    filterModuleId={filterModuleId}
                    setFilterModuleId={setFilterModuleId}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    periodFilter={periodFilter}
                    setPeriodFilter={setPeriodFilter}
                    listView={listView}
                    setListView={setListView}
                    modules={modules}
                    canManage={canManage}
                    onBatchExport={() => void handleBatchExport()}
                    batchExporting={batchExporting}
                  />
                }
              />

              {isLoading && (
                <div className="flex flex-1 flex-col">
                  {[1, 2, 3, 4, 5, 6].map((key) => (
                    <div key={key} className="h-11 animate-pulse border-b border-subtle/60 bg-layer-2/40" />
                  ))}
                </div>
              )}

              {!isLoading && filteredReports.length === 0 && (
                <EmptyHistoryState
                  t={t}
                  showCreateHint={canManage}
                  className="m-4 flex-1"
                  onCreateClick={canManage ? () => openCreateModal() : undefined}
                />
              )}

              {!isLoading && sortedReports.length > 0 && listView === "list" && (
                <div className="flex min-h-0 flex-1 flex-col px-1 pb-2">
                  <StatusReportListTable
                    reports={displayReports}
                    onOpen={openDetail}
                    onPeek={openPeek}
                    onDuplicate={canManage ? handleDuplicate : undefined}
                    onExportPdf={handleExportPdf}
                    canManage={canManage}
                  />
                  <HistoryPagination
                    page={historyPage}
                    totalPages={totalHistoryPages}
                    total={sortedReports.length}
                    onPageChange={setHistoryPage}
                    t={t}
                  />
                </div>
              )}

              {!isLoading && sortedReports.length > 0 && listView === "modules" && (
                <StatusReportListByModule groups={groupedByModule} onPeek={openPeek} />
              )}

              {!isLoading && sortedReports.length > 0 && listView === "timeline" && modules && (
                <StatusReportListTimeline
                  modules={modules}
                  reports={filteredReports}
                  weeks={timelineWeeks}
                  onPeek={openPeek}
                />
              )}
            </div>

            <StatusReportPeekPanel workspaceSlug={workspaceSlug} projectId={project.id} />
          </div>
        </div>
      </div>

      {canManage && (
        <ProjectStatusReportCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => !creating && setIsCreateModalOpen(false)}
          modules={modules}
          moduleId={moduleId}
          setModuleId={setModuleId}
          periodStart={periodStart}
          periodEnd={periodEnd}
          onShiftWeek={handleShiftWeek}
          weekLabel={createWeekLabel}
          summary={summary}
          setSummary={setSummary}
          creating={creating}
          onCreate={handleCreate}
        />
      )}
    </StatusReportHubProvider>
  );
}

function HistoryPagination({
  page,
  totalPages,
  total,
  onPageChange,
  t,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * HISTORY_PAGE_SIZE + 1;
  const end = Math.min(page * HISTORY_PAGE_SIZE, total);

  return (
    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-subtle/60 px-3 pt-3">
      <p className="text-13 text-tertiary">
        {t("project.status_report.pagination_range", { start, end, total })}
      </p>
      <div className="flex items-center gap-1">
        <Tooltip tooltipContent={t("project.status_report.pagination_prev")}>
          <IconButton
            variant="ghost"
            size="sm"
            aria-label={t("project.status_report.pagination_prev")}
            icon={ChevronLeft}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          />
        </Tooltip>
        <span className="min-w-[4.5rem] text-center text-13 font-medium text-secondary">
          {t("project.status_report.pagination_page", { page, totalPages })}
        </span>
        <Tooltip tooltipContent={t("project.status_report.pagination_next")}>
          <IconButton
            variant="ghost"
            size="sm"
            aria-label={t("project.status_report.pagination_next")}
            icon={ChevronRight}
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          />
        </Tooltip>
      </div>
    </div>
  );
}

type StatItem = {
  label: string;
  value: number;
  sub?: string;
  accent?: boolean;
  warn?: boolean;
  icon: typeof History;
};

function StatMetrics({ items }: { items: StatItem[] }) {
  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.label}
            className={cn(
              BOARD_HUB_STATUS_REPORT_METRIC,
              item.accent && "border-accent-primary/25 bg-accent-primary/8",
              item.warn && !item.accent && "border-warning-subtle/40 bg-warning-subtle/10"
            )}
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-md border border-subtle/40 bg-layer-2/70",
                item.accent && "border-accent-primary/20 text-accent-primary",
                item.warn && "text-warning-primary"
              )}
            >
              <Icon className="size-3.5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <span className="text-11 font-medium text-tertiary">{item.label}</span>
              <p
                className={cn(
                  "tabular-nums text-18 font-semibold leading-tight tracking-tight",
                  item.accent ? "text-accent-primary" : "text-primary"
                )}
              >
                {item.value}
              </p>
              {item.sub ? (
                <p className={cn("text-11 leading-snug", item.warn ? "text-warning-primary" : "text-tertiary")}>
                  {item.sub}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </>
  );
}

function EmptyHistoryState({
  t,
  showCreateHint,
  className,
  onCreateClick,
}: {
  t: ReturnType<typeof useTranslation>["t"];
  showCreateHint: boolean;
  className?: string;
  onCreateClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-subtle/60 bg-layer-2/30 px-6 py-12 text-center",
        className
      )}
    >
      <div className="grid size-12 place-items-center rounded-xl border border-subtle bg-layer-2 text-placeholder">
        <History className="size-5" strokeWidth={1.5} />
      </div>
      <p className="mt-3 text-13 font-medium text-primary">{t("project.status_report.empty")}</p>
      <p className="mt-1.5 max-w-md text-13 text-tertiary">
        {showCreateHint ? t("project.status_report.empty_description") : t("project.status_report.empty_readonly")}
      </p>
      {showCreateHint && onCreateClick && (
        <Button variant="primary" className="mt-5" onClick={onCreateClick} prependIcon={<FilePlus2 className="size-4" />}>
          {t("project.status_report.create_button")}
        </Button>
      )}
    </div>
  );
}
