import type { IBoardStatusReport, IModule, TModuleStatus } from "@operis/types";
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

/** Filtro dos cards de cobertura / report da semana. */
export type StatusReportCoverageFilter = "all" | "published" | "draft" | "stale" | "pending";

export type WeekModuleCoverage = {
  moduleId: string;
  moduleName: string;
  moduleStatus?: TModuleStatus;
  stageName: string | null;
  stageColor: string | null;
  progressPct: number;
  status: ModuleWeekStatus;
  reportId?: string;
  projectId: string;
};

/** Filtro de status do módulo na lista «semana em curso». `active` = exclui concluídos (padrão). */
export type StatusReportWeekModuleFilter = "active" | "all" | TModuleStatus;

export function resolveModuleStatus(status: TModuleStatus | undefined): TModuleStatus {
  return status ?? "backlog";
}

export function matchesWeekModuleStatusFilter(
  moduleStatus: TModuleStatus | undefined,
  filter: StatusReportWeekModuleFilter
): boolean {
  const resolved = resolveModuleStatus(moduleStatus);
  if (filter === "all") return true;
  if (filter === "active") return resolved !== "completed";
  return resolved === filter;
}

export function matchesCoverageFilter(reportStatus: ModuleWeekStatus, filter: StatusReportCoverageFilter): boolean {
  if (filter === "all") return true;
  if (filter === "published") return reportStatus === "published";
  if (filter === "draft") return reportStatus === "draft";
  if (filter === "stale") return reportStatus === "stale_draft";
  if (filter === "pending") return reportStatus === "none";
  return true;
}

export function getModuleIssueProgressPct(module: IModule): number {
  const total =
    module.backlog_issues +
    module.unstarted_issues +
    module.started_issues +
    module.completed_issues +
    module.cancelled_issues;
  if (total <= 0) return 0;
  return Math.round((module.completed_issues / total) * 100);
}

export type ParsedModuleDisplayName = {
  client?: string;
  category?: string;
  code?: string;
  title: string;
  subtitle?: string;
};

/** Extrai cliente / categoria / código de nomes no formato `[ CLIENT ] [ CAT ] - [ ID ] - 'Título'`. */
export function parseModuleDisplayName(raw: string): ParsedModuleDisplayName {
  const bracketMatches = [...raw.matchAll(/\[\s*([^\]]+?)\s*\]/g)].map((m) => m[1].trim());
  const quoteMatch = raw.match(/['"]([^'"]+)['"]/);
  const quotedTitle = quoteMatch?.[1]?.trim();

  if (bracketMatches.length >= 3) {
    const subtitle = [bracketMatches[0], bracketMatches[1], bracketMatches[2]].join(" · ");
    return {
      client: bracketMatches[0],
      category: bracketMatches[1],
      code: bracketMatches[2],
      title: quotedTitle ?? raw,
      subtitle,
    };
  }
  if (bracketMatches.length === 2) {
    return {
      client: bracketMatches[0],
      category: bracketMatches[1],
      title: quotedTitle ?? raw,
      subtitle: `${bracketMatches[0]} · ${bracketMatches[1]}`,
    };
  }
  if (bracketMatches.length === 1) {
    return {
      client: bracketMatches[0],
      title: quotedTitle ?? raw,
      subtitle: bracketMatches[0],
    };
  }
  return { title: raw };
}

export function isSprintStatusReport(report: Pick<IBoardStatusReport, "content" | "title">): boolean {
  const kind = report.content?.report_kind;
  if (kind === "sprint") return true;
  if (kind === "multi_module" || kind === "module_single") return false;
  const sprintRows = report.content?.sections?.entregas_sprint;
  return Boolean(sprintRows && sprintRows.length > 1);
}

export function isMultiModuleStatusReport(report: Pick<IBoardStatusReport, "content">): boolean {
  return report.content?.report_kind === "multi_module";
}

export function isModuleRowsStatusReport(report: Pick<IBoardStatusReport, "content" | "title">): boolean {
  return isSprintStatusReport(report) || isMultiModuleStatusReport(report);
}

export function getStatusReportHeadline(report: Pick<IBoardStatusReport, "content" | "title" | "module_name">): string {
  if (isSprintStatusReport(report) && report.title?.trim()) {
    return report.title.trim();
  }
  if (isMultiModuleStatusReport(report)) {
    return report.title?.trim() || "";
  }
  return report.module_name?.trim() || report.title?.trim() || "";
}

export function getSprintModuleCount(report: Pick<IBoardStatusReport, "content">): number {
  const moduleIds = report.content?.module_ids;
  if (moduleIds?.length) return moduleIds.length;
  return report.content?.sections?.entregas_sprint?.length ?? 0;
}

export function mapWeekModuleCoverage(
  modules: IModule[],
  reports: IBoardStatusReport[],
  week: { start: string; end: string }
): WeekModuleCoverage[] {
  return buildModuleCoverage(modules, reports, week).map((row) => ({
    moduleId: row.module.id,
    moduleName: row.module.name,
    moduleStatus: row.module.status,
    stageName: row.module.stage_detail?.name ?? null,
    stageColor: row.module.stage_detail?.color ?? null,
    progressPct: getModuleIssueProgressPct(row.module),
    status: row.status,
    reportId: row.report?.id,
    projectId: row.module.project_id,
  }));
}

export function countActiveModules(modules: IModule[]): number {
  return modules.filter((m) => resolveModuleStatus(m.status) !== "completed").length;
}

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
