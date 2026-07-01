/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import {
  ArrowDownWideNarrow,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  History,
  ScrollText,
} from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { Tooltip } from "@plane/propel/tooltip";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IBoardStatusReport, IModule, IProject } from "@plane/types";
import { Avatar, CustomSelect } from "@plane/ui";
import { cn, getFileURL, renderFormattedDate } from "@plane/utils";
import { formatReportWeekLabel } from "@/components/project/status-report/format-status-report-week";
import { ProjectStatusReportCreateModal } from "@/components/project/status-report/project-status-report-create-modal";
import { useBoardHubNavigate } from "@/components/board/use-board-hub-navigate";
import { useStatusReportCapabilities } from "@/hooks/use-status-report-capabilities";
import { ModuleService } from "@/services/module.service";
import { ProjectStatusReportService } from "@/services/project/project-status-report.service";

const reportService = new ProjectStatusReportService();
const moduleService = new ModuleService();

/** Tamanho fixo — evita loop ResizeObserver ↔ altura da tabela. */
const HISTORY_PAGE_SIZE = 10;

type HistorySortOrder = "desc" | "asc";

function shiftWeekPeriod(start: string, deltaWeeks: number): { start: string; end: string } {
  const monday = new Date(`${start}T12:00:00`);
  monday.setDate(monday.getDate() + deltaWeeks * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

function defaultWeekPeriod(): { start: string; end: string } {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

function formatPeriodLabel(start: string, end: string): string {
  try {
    return `${renderFormattedDate(start)} — ${renderFormattedDate(end)}`;
  } catch {
    return `${start} — ${end}`;
  }
}

type Props = {
  workspaceSlug: string;
  project: IProject;
};

export function ProjectStatusReportList(props: Props) {
  const { workspaceSlug, project } = props;
  const { t } = useTranslation();
  const navigate = useBoardHubNavigate();
  const { canManage: canManageReports } = useStatusReportCapabilities(project.id);
  const canManage = canManageReports();

  const defaults = defaultWeekPeriod();
  const [periodStart, setPeriodStart] = useState(defaults.start);
  const [periodEnd, setPeriodEnd] = useState(defaults.end);
  const [summary, setSummary] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [filterModuleId, setFilterModuleId] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const [historySort, setHistorySort] = useState<HistorySortOrder>("desc");
  const [creating, setCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
    if (!moduleId && defaultModuleId) {
      setModuleId(defaultModuleId);
    }
  }, [defaultModuleId, moduleId]);

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    if (!filterModuleId) return reports;
    return reports.filter((report) => report.module === filterModuleId);
  }, [filterModuleId, reports]);

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
  }, [filterModuleId, historySort]);

  useEffect(() => {
    if (historyPage > totalHistoryPages) {
      setHistoryPage(totalHistoryPages);
    }
  }, [historyPage, totalHistoryPages]);

  const stats = useMemo(() => {
    const list = reports ?? [];
    return {
      total: list.length,
      drafts: list.filter((r) => !r.is_published).length,
      published: list.filter((r) => r.is_published).length,
    };
  }, [reports]);

  const openCreateModal = () => {
    const week = defaultWeekPeriod();
    setPeriodStart(week.start);
    setPeriodEnd(week.end);
    setSummary("");
    if (!moduleId && modules?.length) {
      setModuleId(modules[0].id);
    }
    setIsCreateModalOpen(true);
  };

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

  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-x-hidden overflow-y-auto bg-layer-1">
      <div className="border-b border-subtle bg-layer-1">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-h3-medium text-primary">{t("project.status_report.title")}</h1>
              <p className="mt-1 max-w-2xl text-body-xs-regular text-tertiary">
                {t("project.status_report.subtitle")}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <StatPills
                items={[
                  { label: t("project.status_report.stat_total"), value: stats.total },
                  { label: t("project.status_report.stat_drafts"), value: stats.drafts },
                  {
                    label: t("project.status_report.stat_published"),
                    value: stats.published,
                    accent: true,
                  },
                ]}
              />
              {canManage && (
                <Button
                  variant="primary"
                  className="shrink-0"
                  onClick={openCreateModal}
                  prependIcon={<FilePlus2 className="size-4" />}
                >
                  {t("project.status_report.create_button")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-1 flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <section className="flex min-h-0 w-full min-w-0 flex-col">
            <div className="flex min-h-[280px] w-full flex-col overflow-hidden rounded-lg border border-subtle bg-layer-1">
              <HistoryToolbar
                t={t}
                count={filteredReports.length}
                historySort={historySort}
                onToggleSort={() => setHistorySort((current) => (current === "desc" ? "asc" : "desc"))}
                filterModuleId={filterModuleId}
                setFilterModuleId={setFilterModuleId}
                modules={modules}
              />

              {isLoading && (
                <div className="flex flex-1 flex-col">
                  {[1, 2, 3, 4, 5, 6].map((key) => (
                    <div key={key} className="h-11 animate-pulse border-b border-subtle bg-layer-2/40" />
                  ))}
                </div>
              )}

              {!isLoading && filteredReports.length === 0 && (
                <EmptyHistoryState
                  t={t}
                  showCreateHint={canManage}
                  className="m-4 flex-1"
                  onCreateClick={canManage ? openCreateModal : undefined}
                />
              )}

              {!isLoading && sortedReports.length > 0 && (
                <div className="flex min-h-0 flex-1 flex-col px-1 pb-1">
                  <HistoryReportsTable
                    reports={paginatedReports}
                    onOpen={(reportId) =>
                      navigate(`/${workspaceSlug}/projects/${project.id}/status-report/${reportId}`)
                    }
                    t={t}
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
            </div>
        </section>
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
    </div>
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
    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-subtle pt-3">
      <p className="text-caption-md-regular text-tertiary">
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
        <span className="min-w-[4.5rem] text-center text-caption-md-medium text-secondary">
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

type StatPillItem = {
  label: string;
  value: number;
  accent?: boolean;
};

function StatPills({ items }: { items: StatPillItem[] }) {
  return (
    <div className="flex flex-wrap gap-2" role="group">
      {items.map((item) => (
        <div
          key={item.label}
          className={cn(
            "flex items-center gap-2 rounded-md border border-subtle px-3 py-1.5",
            item.accent ? "bg-accent-primary/10" : "bg-layer-2/50"
          )}
        >
          <span className="text-caption-sm-regular text-tertiary">{item.label}</span>
          <span
            className={cn(
              "tabular-nums text-body-sm-medium",
              item.accent ? "text-accent-primary" : "text-primary"
            )}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function HistoryToolbar({
  t,
  count,
  historySort,
  onToggleSort,
  filterModuleId,
  setFilterModuleId,
  modules,
}: {
  t: ReturnType<typeof useTranslation>["t"];
  count: number;
  historySort: HistorySortOrder;
  onToggleSort: () => void;
  filterModuleId: string;
  setFilterModuleId: (id: string) => void;
  modules: IModule[] | undefined;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-subtle bg-layer-2/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-body-sm-medium text-primary">{t("project.status_report.history_title")}</h2>
        <p className="text-caption-sm-regular text-tertiary">
          {t("project.status_report.history_count", { count })}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
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
            className={cn(historySort === "asc" && "rotate-180")}
            onClick={onToggleSort}
          />
        </Tooltip>
        {(modules?.length ?? 0) > 0 && (
          <div className="min-w-[11rem]">
            <CustomSelect
              value={filterModuleId}
              onChange={(value: string) => setFilterModuleId(value)}
              label={
                filterModuleId
                  ? modules?.find((m) => m.id === filterModuleId)?.name ??
                    t("project.status_report.all_modules")
                  : t("project.status_report.all_modules")
              }
              buttonClassName="w-full rounded-md"
            >
              <CustomSelect.Option value="">{t("project.status_report.all_modules")}</CustomSelect.Option>
              {(modules ?? []).map((module: IModule) => (
                <CustomSelect.Option key={module.id} value={module.id}>
                  {module.name}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          </div>
        )}
      </div>
    </div>
  );
}

const HISTORY_TH =
  "px-4 py-2 text-left text-caption-sm-medium font-medium text-tertiary first:pl-4 last:pr-4";
const HISTORY_TD = "px-4 py-2.5 align-middle first:pl-4 last:pr-4";

function HistoryReportsTable({
  reports,
  onOpen,
  t,
}: {
  reports: IBoardStatusReport[];
  onOpen: (reportId: string) => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  return (
    <div className="min-h-0 w-full flex-1 overflow-x-auto">
      <table className="w-full min-w-[44rem] table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-[38%]" />
          <col className="w-[22%]" />
          <col className="w-[14%]" />
          <col className="w-[22%]" />
          <col className="w-10" />
        </colgroup>
        <thead>
          <tr className="border-b border-subtle bg-layer-2/20">
            <th className={HISTORY_TH}>{t("project.status_report.history_col_module")}</th>
            <th className={HISTORY_TH}>{t("project.status_report.history_col_period")}</th>
            <th className={HISTORY_TH}>{t("project.status_report.history_col_status")}</th>
            <th className={cn(HISTORY_TH, "min-w-[11rem]")}>{t("project.status_report.history_col_author")}</th>
            <th className={cn(HISTORY_TH, "w-10 shrink-0")} aria-hidden />
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const period = formatReportWeekLabel(report.period_start, report.period_end, t);
            const periodDates = formatPeriodLabel(report.period_start, report.period_end);
            const headline = report.module_name ?? report.title;
            const published = Boolean(report.is_published);
            const author = report.created_by_name ?? "—";
            const authorAvatar = report.created_by_avatar;

            return (
              <tr
                key={report.id}
                className="group cursor-pointer border-b border-subtle transition-colors last:border-b-0 hover:bg-layer-2/50"
                onClick={() => onOpen(report.id)}
              >
                <td className={cn(HISTORY_TD, "text-body-xs-medium text-primary")}>
                  <span className="block truncate" title={headline}>
                    {headline}
                  </span>
                </td>
                <td className={cn(HISTORY_TD, "whitespace-nowrap text-body-xs-regular text-tertiary")}>
                  <span title={periodDates}>{period}</span>
                </td>
                <td className={cn(HISTORY_TD, "w-28 shrink-0")}>
                  <StatusBadge published={published} t={t} />
                </td>
                <td className={HISTORY_TD}>
                  <div className="flex min-w-0 items-center gap-2">
                    <Avatar
                      name={author}
                      src={authorAvatar ? getFileURL(authorAvatar) : undefined}
                      size="sm"
                      showTooltip={false}
                      className="shrink-0"
                    />
                    <span className="whitespace-nowrap text-body-xs-regular text-tertiary">{author}</span>
                  </div>
                </td>
                <td className={cn(HISTORY_TD, "w-10 text-right")}>
                  <ChevronRight
                    className="inline-block size-4 text-placeholder transition-transform group-hover:translate-x-0.5 group-hover:text-secondary"
                    aria-hidden
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-subtle bg-layer-2/40 px-6 py-12 text-center",
        className
      )}
    >
      <div className="grid size-12 place-items-center rounded-xl border border-subtle bg-layer-2 text-placeholder">
        <History className="size-5" strokeWidth={1.5} />
      </div>
      <p className="mt-3 text-body-sm-medium text-primary">{t("project.status_report.empty")}</p>
      <p className="mt-1.5 max-w-md text-body-xs-regular text-tertiary">
        {showCreateHint ? t("project.status_report.empty_description") : t("project.status_report.empty_readonly")}
      </p>
      {showCreateHint && onCreateClick && (
        <Button
          variant="primary"
          className="mt-5"
          onClick={onCreateClick}
          prependIcon={<FilePlus2 className="size-4" />}
        >
          {t("project.status_report.create_button")}
        </Button>
      )}
    </div>
  );
}

function StatusBadge({
  published,
  t,
}: {
  published: boolean;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const Icon = published ? CheckCircle2 : ScrollText;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-caption-sm-medium",
        published
          ? "bg-accent-primary/15 text-accent-primary"
          : "border border-subtle bg-layer-2 text-tertiary"
      )}
    >
      <Icon className="size-3" strokeWidth={2} />
      {published ? t("project.status_report.published") : t("project.status_report.draft")}
    </span>
  );
}
