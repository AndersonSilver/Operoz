import type { IBoardStatusReport, IModule } from "@operis/types";
import { observationLineToPlainText } from "@/components/project/status-report/observation-content";

export type HistorySortOrder = "desc" | "asc";

/** Módulos por página na lista “semana em curso”. */
export const STATUS_REPORT_CURRENT_WEEK_PAGE_SIZE = 12;

/** A partir deste total, a lista da semana usa paginação em vez de scroll longo. */
export const STATUS_REPORT_CURRENT_WEEK_PAGINATE_FROM = 8;
export type StatusReportListView = "list" | "modules" | "timeline";
export type StatusReportStatusFilter = "all" | "draft" | "published";
export type StatusReportPeriodFilter = "all" | "4w" | "8w" | "current_week";

export type ModuleWeekStatus = "none" | "draft" | "published" | "stale_draft";

export function defaultWeekPeriod(): { start: string; end: string } {
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

export function shiftWeekPeriod(start: string, deltaWeeks: number): { start: string; end: string } {
  const monday = new Date(`${start}T12:00:00`);
  monday.setDate(monday.getDate() + deltaWeeks * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

export function periodsMatch(
  a: { period_start: string; period_end?: string },
  b: { start: string; end: string }
): boolean {
  return a.period_start === b.start;
}

export function getRecentWeekPeriods(count: number): { start: string; end: string }[] {
  const periods: { start: string; end: string }[] = [];
  let current = defaultWeekPeriod();
  for (let i = 0; i < count; i++) {
    periods.unshift(current);
    current = shiftWeekPeriod(current.start, -1);
  }
  return periods;
}

export function isPeriodEnded(periodEnd: string): boolean {
  const end = new Date(`${periodEnd}T23:59:59`);
  return end.getTime() < Date.now();
}

export function stripHtmlToText(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return "";
  return observationLineToPlainText(trimmed);
}

export function getReportProgressPct(report: IBoardStatusReport): number | null {
  const pct = report.content?.sections?.progress?.pct;
  if (typeof pct === "number" && !Number.isNaN(pct)) return Math.min(100, Math.max(0, Math.round(pct)));
  return null;
}

export function getReportSummarySnippet(report: IBoardStatusReport, maxLen = 120): string {
  const html = report.content?.sections?.executive_summary?.html ?? "";
  const text = stripHtmlToText(html);
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen).trim()}…`;
}

export function hasAttentionPoints(report: IBoardStatusReport): boolean {
  const items = report.content?.sections?.observacoes?.pontos_atencao;
  return Boolean(items?.length);
}

export function hasEmExecucao(report: IBoardStatusReport): boolean {
  const items = report.content?.sections?.observacoes?.em_execucao;
  return Boolean(items?.length);
}

export function isStaleDraft(report: IBoardStatusReport): boolean {
  return !report.is_published && isPeriodEnded(report.period_end);
}

export function getModuleWeekStatus(report: IBoardStatusReport | undefined): ModuleWeekStatus {
  if (!report) return "none";
  if (report.is_published) return "published";
  if (isStaleDraft(report)) return "stale_draft";
  return "draft";
}

export function buildModuleCoverage(
  modules: IModule[],
  reports: IBoardStatusReport[],
  week: { start: string; end: string }
) {
  return modules.map((module) => {
    const report = reports.find((r) => r.module === module.id && periodsMatch(r, week));
    return {
      module,
      report,
      status: getModuleWeekStatus(report),
    };
  });
}

export function filterReportsList(
  reports: IBoardStatusReport[],
  opts: {
    searchQuery: string;
    filterModuleId: string;
    statusFilter: StatusReportStatusFilter;
    periodFilter: StatusReportPeriodFilter;
  }
): IBoardStatusReport[] {
  const currentWeek = defaultWeekPeriod();
  const weeks4 = getRecentWeekPeriods(4).map((w) => w.start);
  const weeks8 = getRecentWeekPeriods(8).map((w) => w.start);
  const q = opts.searchQuery.trim().toLowerCase();

  return reports.filter((report) => {
    if (opts.filterModuleId && report.module !== opts.filterModuleId) return false;
    if (opts.statusFilter === "draft" && report.is_published) return false;
    if (opts.statusFilter === "published" && !report.is_published) return false;

    if (opts.periodFilter === "current_week" && !periodsMatch(report, currentWeek)) return false;
    if (opts.periodFilter === "4w" && !weeks4.includes(report.period_start)) return false;
    if (opts.periodFilter === "8w" && !weeks8.includes(report.period_start)) return false;

    if (!q) return true;
    const snippet = getReportSummarySnippet(report, 500).toLowerCase();
    const moduleName = (report.module_name ?? report.title ?? "").toLowerCase();
    const author = (report.created_by_name ?? "").toLowerCase();
    return moduleName.includes(q) || author.includes(q) || snippet.includes(q);
  });
}

export function groupReportsByModule(
  reports: IBoardStatusReport[],
  modules: IModule[]
): { module: IModule; reports: IBoardStatusReport[] }[] {
  const byModule = new Map<string, IBoardStatusReport[]>();
  for (const report of reports) {
    const key = report.module ?? "_unknown";
    const list = byModule.get(key) ?? [];
    list.push(report);
    byModule.set(key, list);
  }

  const ordered: { module: IModule; reports: IBoardStatusReport[] }[] = [];
  for (const module of modules) {
    const list = byModule.get(module.id);
    if (list?.length) ordered.push({ module, reports: list });
  }
  const unknown = byModule.get("_unknown");
  if (unknown?.length) {
    ordered.push({
      module: { id: "_unknown", name: "—" } as IModule,
      reports: unknown,
    });
  }
  return ordered;
}
