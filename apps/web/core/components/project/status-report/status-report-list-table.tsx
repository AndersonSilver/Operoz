import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Copy,
  FileDown,
  FileText,
  ListChecks,
  ScrollText,
} from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { IconButton } from "@operis/propel/icon-button";
import { Tooltip } from "@operis/propel/tooltip";
import type { IBoardStatusReport } from "@operis/types";
import { Avatar } from "@operis/ui";
import { cn, getFileURL, renderFormattedDate } from "@operis/utils";
import { formatReportWeekLabel } from "@/components/project/status-report/format-status-report-week";
import {
  getReportProgressPct,
  getReportSummarySnippet,
  hasAttentionPoints,
  hasEmExecucao,
  isStaleDraft,
} from "@/components/project/status-report/status-report-utils";

const TH = "px-3 py-2.5 text-left text-13 font-medium text-tertiary first:pl-4 last:pr-4";
const TD = "px-3 py-2.5 align-middle first:pl-4 last:pr-4";

type Props = {
  reports: IBoardStatusReport[];
  onOpen: (reportId: string) => void;
  onPeek: (reportId: string) => void;
  onDuplicate?: (report: IBoardStatusReport) => void;
  onExportPdf?: (report: IBoardStatusReport) => void;
  canManage: boolean;
};

function formatPeriodLabel(start: string, end: string): string {
  try {
    return `${renderFormattedDate(start)} — ${renderFormattedDate(end)}`;
  } catch {
    return `${start} — ${end}`;
  }
}

export function StatusReportListTable(props: Props) {
  const { reports, onOpen, onPeek, onDuplicate, onExportPdf, canManage } = props;
  const { t } = useTranslation();

  return (
    <div className="min-h-0 w-full flex-1 overflow-x-auto">
      <table className="w-full min-w-[52rem] table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-[24%]" />
          <col className="w-[14%]" />
          <col className="w-[10%]" />
          <col className="w-[24%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[4rem]" />
        </colgroup>
        <thead>
          <tr className="sticky top-0 z-[1] border-b border-subtle/60 bg-layer-2/50 backdrop-blur-md">
            <th className={TH}>{t("project.status_report.history_col_module")}</th>
            <th className={TH}>{t("project.status_report.history_col_period")}</th>
            <th className={TH}>{t("project.status_report.col_progress")}</th>
            <th className={TH}>{t("project.status_report.col_summary")}</th>
            <th className={TH}>{t("project.status_report.history_col_status")}</th>
            <th className={TH}>{t("project.status_report.history_col_author")}</th>
            <th className={cn(TH, "w-16")} aria-hidden />
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              t={t}
              canManage={canManage}
              onOpen={onOpen}
              onPeek={onPeek}
              onDuplicate={onDuplicate}
              onExportPdf={onExportPdf}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportRow({
  report,
  t,
  canManage,
  onOpen,
  onPeek,
  onDuplicate,
  onExportPdf,
}: {
  report: IBoardStatusReport;
  t: ReturnType<typeof useTranslation>["t"];
  canManage: boolean;
  onOpen: (id: string) => void;
  onPeek: (id: string) => void;
  onDuplicate?: (report: IBoardStatusReport) => void;
  onExportPdf?: (report: IBoardStatusReport) => void;
}) {
  const period = formatReportWeekLabel(report.period_start, report.period_end, t);
  const periodDates = formatPeriodLabel(report.period_start, report.period_end);
  const headline = report.module_name ?? report.title;
  const published = Boolean(report.is_published);
  const stale = isStaleDraft(report);
  const progress = getReportProgressPct(report);
  const snippet = getReportSummarySnippet(report);
  const author = report.created_by_name ?? "—";

  return (
    <tr
      className="group cursor-pointer border-b border-subtle/50 transition-colors last:border-b-0 even:bg-layer-2/15 hover:bg-layer-2/45"
      onClick={() => onPeek(report.id)}
    >
      <td className={cn(TD, "py-3")}>
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border border-subtle/50 bg-layer-2/80 text-tertiary">
            <FileText className="size-3.5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <span className="block truncate text-13 font-medium text-primary" title={headline}>
              {headline}
            </span>
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {hasEmExecucao(report) ? (
                <SignalIcon icon={ListChecks} label={t("project.status_report.signal_in_progress")} />
              ) : null}
              {hasAttentionPoints(report) ? (
                <SignalIcon icon={AlertTriangle} label={t("project.status_report.signal_attention")} warn />
              ) : null}
            </div>
          </div>
        </div>
      </td>
      <td className={cn(TD, "py-3 whitespace-nowrap")}>
        <span className="rounded-md bg-layer-2/60 px-2 py-1 text-13 font-medium text-secondary" title={periodDates}>
          {period}
        </span>
      </td>
      <td className={cn(TD, "py-3")}>
        {progress !== null ? (
          <div className="flex min-w-0 flex-col gap-1">
            <div className="h-2 w-full min-w-[4rem] overflow-hidden rounded-full bg-layer-2 ring-1 ring-inset ring-subtle/30">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-accent-primary/80 to-accent-primary"
                style={{ width: `${Math.max(progress, 6)}%` }}
              />
            </div>
            <span className="tabular-nums text-11 font-medium text-tertiary">{progress}%</span>
          </div>
        ) : (
          <span className="text-11 text-placeholder">—</span>
        )}
      </td>
      <td className={cn(TD, "py-3")}>
        {snippet ? (
          <p
            className="line-clamp-2 rounded-md border border-subtle/40 bg-layer-2/35 px-2 py-1.5 text-13 leading-snug text-secondary"
            title={snippet}
          >
            {snippet}
          </p>
        ) : (
          <span className="text-11 italic text-placeholder">{t("project.status_report.summary_empty")}</span>
        )}
      </td>
      <td className={TD}>
        <StatusBadge published={published} stale={stale} t={t} />
      </td>
      <td className={TD}>
        <div className="flex min-w-0 items-center gap-2">
          <Avatar
            name={author}
            src={report.created_by_avatar ? getFileURL(report.created_by_avatar) : undefined}
            size="sm"
            showTooltip={false}
            className="shrink-0"
          />
          <span className="truncate text-13 text-tertiary">{author}</span>
        </div>
      </td>
      <td className={cn(TD, "text-right")} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100">
          {canManage && onDuplicate ? (
            <Tooltip tooltipContent={t("project.status_report.duplicate_week")}>
              <IconButton
                variant="ghost"
                size="sm"
                icon={Copy}
                aria-label={t("project.status_report.duplicate_week")}
                onClick={() => onDuplicate(report)}
              />
            </Tooltip>
          ) : null}
          {onExportPdf ? (
            <Tooltip tooltipContent={t("project.status_report.export_pdf")}>
              <IconButton
                variant="ghost"
                size="sm"
                icon={FileDown}
                aria-label={t("project.status_report.export_pdf")}
                onClick={() => onExportPdf(report)}
              />
            </Tooltip>
          ) : null}
          <Tooltip tooltipContent={t("project.status_report.peek_open_full")}>
            <IconButton
              variant="ghost"
              size="sm"
              icon={ChevronRight}
              aria-label={t("project.status_report.peek_open_full")}
              onClick={() => onOpen(report.id)}
            />
          </Tooltip>
        </div>
      </td>
    </tr>
  );
}

function SignalIcon({
  icon: Icon,
  label,
  warn,
}: {
  icon: typeof ListChecks;
  label: string;
  warn?: boolean;
}) {
  return (
    <Tooltip tooltipContent={label}>
      <span
        className={cn(
          "grid size-5 place-items-center rounded-sm",
          warn ? "text-warning-primary" : "text-tertiary"
        )}
      >
        <Icon className="size-3" strokeWidth={1.75} />
      </span>
    </Tooltip>
  );
}

function StatusBadge({
  published,
  stale,
  t,
}: {
  published: boolean;
  stale: boolean;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const Icon = published ? CheckCircle2 : stale ? AlertTriangle : ScrollText;
  const label = published
    ? t("project.status_report.published")
    : stale
      ? t("project.status_report.stale_draft_badge")
      : t("project.status_report.draft");

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-11 font-medium",
        published
          ? "bg-accent-primary/15 text-accent-primary"
          : stale
            ? "bg-warning-subtle/40 text-warning-primary"
            : "border border-subtle bg-layer-2 text-tertiary"
      )}
    >
      <Icon className="size-3" strokeWidth={2} />
      {label}
    </span>
  );
}
