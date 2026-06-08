import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  ScrollText,
  AlertTriangle,
} from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { IconButton } from "@operis/propel/icon-button";
import { cn, renderFormattedDate } from "@operis/utils";
import { BOARD_HUB_STATUS_REPORT_WEEK_PANEL } from "@/components/board/board-hub-background";
import { formatReportWeekLabel } from "@/components/project/status-report/format-status-report-week";
import {
  STATUS_REPORT_CURRENT_WEEK_PAGE_SIZE,
  STATUS_REPORT_CURRENT_WEEK_PAGINATE_FROM,
  type ModuleWeekStatus,
} from "@/components/project/status-report/status-report-utils";

type ModuleCoverage = {
  moduleId: string;
  moduleName: string;
  status: ModuleWeekStatus;
  reportId?: string;
};

type Props = {
  week: { start: string; end: string };
  coverage: ModuleCoverage[];
  /** Mesma busca da toolbar — filtra módulos nesta semana. */
  filterQuery?: string;
  canManage: boolean;
  onGenerate: (moduleId: string) => void;
  onContinue: (reportId: string) => void;
  onOpen: (reportId: string) => void;
};

const STATUS_ORDER: Record<ModuleWeekStatus, number> = {
  stale_draft: 0,
  none: 1,
  draft: 2,
  published: 3,
};

const STATUS_DOT: Record<ModuleWeekStatus, string> = {
  none: "bg-layer-3 ring-subtle/80",
  draft: "bg-secondary/60 ring-subtle",
  published: "bg-accent-primary ring-accent-primary/30",
  stale_draft: "bg-warning-primary ring-warning-subtle",
};

const STATUS_CHIP: Record<ModuleWeekStatus, string> = {
  none: "border-dashed border-subtle/70 bg-transparent text-tertiary",
  draft: "border-subtle bg-layer-2/80 text-secondary",
  published: "border-accent-primary/30 bg-accent-primary/10 text-accent-primary",
  stale_draft: "border-warning-subtle/60 bg-warning-subtle/20 text-warning-primary",
};

export function StatusReportCurrentWeekCard(props: Props) {
  const { week, coverage, filterQuery = "", canManage, onGenerate, onContinue, onOpen } = props;
  const { t } = useTranslation();
  const [pendingPage, setPendingPage] = useState(1);
  const [donePage, setDonePage] = useState(1);
  const weekLabel = formatReportWeekLabel(week.start, week.end, t);
  const dateRange = `${renderFormattedDate(week.start)} — ${renderFormattedDate(week.end)}`;

  const counts = useMemo(() => {
    const published = coverage.filter((c) => c.status === "published").length;
    return { published, total: coverage.length };
  }, [coverage]);

  const pct = counts.total > 0 ? Math.round((counts.published / counts.total) * 100) : 0;

  const filtered = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    const list = q
      ? coverage.filter((c) => c.moduleName.toLowerCase().includes(q))
      : coverage;
    return [...list].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  }, [coverage, filterQuery]);

  useEffect(() => {
    setPendingPage(1);
    setDonePage(1);
  }, [filterQuery, coverage.length]);

  if (counts.total === 0) return null;

  const pendingItems = filtered.filter((c) => c.status !== "published");
  const doneItems = filtered.filter((c) => c.status === "published");
  const isFiltering = filterQuery.trim().length > 0;

  return (
    <section className={cn(BOARD_HUB_STATUS_REPORT_WEEK_PANEL, "mb-4")}>
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-accent-primary/80 via-accent-primary/40 to-transparent"
        aria-hidden
      />

      <div className="flex flex-col gap-3 border-b border-subtle/40 pb-4 pl-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-accent-primary/25 bg-accent-primary/10 text-accent-primary">
            <CalendarDays className="size-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <p className="text-11 font-semibold uppercase tracking-wide text-tertiary">
              {t("project.status_report.current_week_title")}
            </p>
            <h2 className="text-14 font-semibold text-primary">{weekLabel}</h2>
            <p className="text-11 text-tertiary">{dateRange}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0">
          <span className="text-20 font-semibold tabular-nums text-accent-primary">{pct}%</span>
          <span className="text-11 text-tertiary">
            {t("project.status_report.coverage_ratio", {
              published: counts.published,
              total: counts.total,
            })}
          </span>
        </div>
      </div>

      <CoverageSegments coverage={coverage} t={t} />

      {isFiltering ? (
        <p className="mb-2 pl-1 text-11 text-tertiary">
          {t("project.status_report.current_week_filter_hint", {
            shown: filtered.length,
            total: counts.total,
          })}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-subtle/50 bg-layer-1/40">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-13 text-tertiary">
            {t("project.status_report.current_week_no_match")}
          </p>
        ) : null}
        {pendingItems.length > 0 ? (
          <ModuleGroup
            title={t("project.status_report.current_week_pending", { count: pendingItems.length })}
            items={pendingItems}
            page={pendingPage}
            onPageChange={setPendingPage}
            canManage={canManage}
            t={t}
            onGenerate={onGenerate}
            onContinue={onContinue}
            onOpen={onOpen}
          />
        ) : null}
        {doneItems.length > 0 ? (
          <ModuleGroup
            title={t("project.status_report.current_week_done", { count: doneItems.length })}
            items={doneItems}
            page={donePage}
            onPageChange={setDonePage}
            canManage={canManage}
            t={t}
            onGenerate={onGenerate}
            onContinue={onContinue}
            onOpen={onOpen}
            muted
          />
        ) : null}
      </div>
    </section>
  );
}

function CoverageSegments({
  coverage,
  t,
}: {
  coverage: ModuleCoverage[];
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const total = coverage.length;
  if (total === 0) return null;

  const segments = [
    {
      key: "published",
      count: coverage.filter((c) => c.status === "published").length,
      className: "bg-accent-primary",
      label: t("project.status_report.module_published"),
    },
    {
      key: "draft",
      count: coverage.filter((c) => c.status === "draft" || c.status === "stale_draft").length,
      className: "bg-secondary/70",
      label: t("project.status_report.module_draft"),
    },
    {
      key: "none",
      count: coverage.filter((c) => c.status === "none").length,
      className: "bg-layer-3",
      label: t("project.status_report.module_missing"),
    },
  ].filter((s) => s.count > 0);

  return (
    <div className="mb-3 space-y-2 pl-1">
      <div className="flex h-2 overflow-hidden rounded-full bg-layer-2 ring-1 ring-inset ring-subtle/30">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className={cn("h-full min-w-[2px] transition-all", seg.className)}
            style={{ width: `${(seg.count / total) * 100}%` }}
            title={`${seg.label}: ${seg.count}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {segments.map((seg) => (
          <span key={seg.key} className="inline-flex items-center gap-1.5 text-11 text-tertiary">
            <span className={cn("size-2 rounded-full", seg.className)} />
            {seg.label} ({seg.count})
          </span>
        ))}
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
  t,
  onGenerate,
  onContinue,
  onOpen,
  muted = false,
}: {
  title: string;
  items: ModuleCoverage[];
  page: number;
  onPageChange: (page: number) => void;
  canManage: boolean;
  t: ReturnType<typeof useTranslation>["t"];
  onGenerate: (id: string) => void;
  onContinue: (id: string) => void;
  onOpen: (id: string) => void;
  muted?: boolean;
}) {
  const usePagination = items.length >= STATUS_REPORT_CURRENT_WEEK_PAGINATE_FROM;
  const pageSize = STATUS_REPORT_CURRENT_WEEK_PAGE_SIZE;
  const totalPages = usePagination ? Math.max(1, Math.ceil(items.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) onPageChange(totalPages);
  }, [page, totalPages, onPageChange]);

  const visible = usePagination
    ? items.slice((safePage - 1) * pageSize, safePage * pageSize)
    : items;

  return (
    <div className={cn(muted && "border-t border-subtle/40 bg-layer-2/15")}>
      <p className="sticky top-0 z-[1] border-b border-subtle/40 bg-layer-1/80 px-3 py-1.5 text-11 font-semibold uppercase tracking-wide text-tertiary backdrop-blur-sm">
        {title}
      </p>
      <ul className="divide-y divide-subtle/40">
        {visible.map((item) => (
          <ModuleRow
            key={item.moduleId}
            item={item}
            canManage={canManage}
            t={t}
            onGenerate={onGenerate}
            onContinue={onContinue}
            onOpen={onOpen}
          />
        ))}
      </ul>
      {usePagination ? (
        <ModuleGroupPagination
          page={safePage}
          totalPages={totalPages}
          total={items.length}
          pageSize={pageSize}
          onPageChange={onPageChange}
          t={t}
        />
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
        <span className="min-w-[4rem] text-center text-11 font-medium tabular-nums text-secondary">
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

function ModuleRow({
  item,
  canManage,
  t,
  onGenerate,
  onContinue,
  onOpen,
}: {
  item: ModuleCoverage;
  canManage: boolean;
  t: ReturnType<typeof useTranslation>["t"];
  onGenerate: (id: string) => void;
  onContinue: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const labelKey =
    item.status === "published"
      ? "project.status_report.module_published"
      : item.status === "stale_draft"
        ? "project.status_report.stale_draft_badge"
        : item.status === "draft"
          ? "project.status_report.module_draft"
          : "project.status_report.module_missing";

  return (
    <li className="group flex items-center gap-2 px-3 py-2 transition-colors hover:bg-layer-2/40 sm:gap-3">
      <span
        className={cn("size-2 shrink-0 rounded-full ring-2 ring-offset-1 ring-offset-transparent", STATUS_DOT[item.status])}
        aria-hidden
      />

      <p className="min-w-0 flex-1 truncate text-13 font-medium text-primary" title={item.moduleName}>
        {item.moduleName}
      </p>

      <span
        className={cn(
          "hidden shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-11 font-medium sm:inline-flex",
          STATUS_CHIP[item.status]
        )}
      >
        <StatusIcon status={item.status} />
        {t(labelKey)}
      </span>

      <div className="flex shrink-0 items-center">
        {item.status === "none" && canManage ? (
          <Button
            variant="primary"
            size="sm"
            className="h-7 px-2.5 text-12"
            onClick={() => onGenerate(item.moduleId)}
          >
            <FilePlus2 className="mr-1 size-3.5 sm:hidden" />
            <span className="hidden sm:inline">{t("project.status_report.generate_short")}</span>
            <span className="sm:hidden">{t("add")}</span>
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
      </div>
    </li>
  );
}

function StatusIcon({ status }: { status: ModuleWeekStatus }) {
  const cls = "size-3 shrink-0";
  if (status === "published") return <CheckCircle2 className={cls} strokeWidth={2} />;
  if (status === "stale_draft") return <AlertTriangle className={cls} strokeWidth={2} />;
  if (status === "draft") return <ScrollText className={cls} strokeWidth={2} />;
  return null;
}
