import { useTranslation } from "@operis/i18n";
import type { IBoardStatusReport, IModule } from "@operis/types";
import { cn } from "@operis/utils";
import { formatReportWeekLabel } from "@/components/project/status-report/format-status-report-week";
import { getModuleWeekStatus, periodsMatch } from "@/components/project/status-report/status-report-utils";

type Props = {
  modules: IModule[];
  reports: IBoardStatusReport[];
  weeks: { start: string; end: string }[];
  onPeek: (reportId: string) => void;
};

const CELL: Record<ReturnType<typeof getModuleWeekStatus>, string> = {
  none: "bg-layer-2/30 border-dashed border-subtle/60",
  draft: "bg-layer-2/80 border-subtle hover:bg-layer-transparent-hover",
  published: "bg-accent-primary/20 border-accent-primary/40 hover:bg-accent-primary/30",
  stale_draft: "bg-warning-subtle/30 border-warning-subtle hover:bg-warning-subtle/50",
};

export function StatusReportListTimeline(props: Props) {
  const { modules, reports, weeks, onPeek } = props;
  const { t } = useTranslation();

  if (modules.length === 0) {
    return (
      <p className="p-6 text-center text-13 text-tertiary">{t("project.status_report.timeline_empty")}</p>
    );
  }

  return (
    <div className="overflow-x-auto p-3">
      <table className="w-full min-w-[36rem] border-collapse text-left">
        <thead>
          <tr>
            <th className="sticky left-0 z-[2] min-w-[10rem] border-b border-subtle/60 bg-layer-1/95 px-3 py-2 text-13 font-medium text-tertiary backdrop-blur-sm">
              {t("project.status_report.history_col_module")}
            </th>
            {weeks.map((week) => (
              <th
                key={week.start}
                className="min-w-[5.5rem] border-b border-subtle/60 px-2 py-2 text-center text-11 font-medium text-tertiary"
              >
                <span className="block truncate" title={formatReportWeekLabel(week.start, week.end, t)}>
                  {formatReportWeekLabel(week.start, week.end, t)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {modules.map((module) => (
            <tr key={module.id} className="border-b border-subtle/40 last:border-b-0">
              <td className="sticky left-0 z-[1] max-w-[14rem] truncate border-r border-subtle/40 bg-layer-1/90 px-3 py-2 text-13 font-medium text-primary backdrop-blur-sm">
                {module.name}
              </td>
              {weeks.map((week) => {
                const report = reports.find((r) => r.module === module.id && periodsMatch(r, week));
                const status = getModuleWeekStatus(report);
                return (
                  <td key={week.start} className="p-1 text-center">
                    <button
                      type="button"
                      disabled={status === "none"}
                      className={cn(
                        "mx-auto flex h-8 w-full min-w-[2.5rem] max-w-[4.5rem] items-center justify-center rounded-md border text-11 font-medium transition-colors",
                        CELL[status],
                        status === "none" && "cursor-default"
                      )}
                      title={
                        status === "none"
                          ? t("project.status_report.module_missing")
                          : report?.is_published
                            ? t("project.status_report.published")
                            : t("project.status_report.draft")
                      }
                      onClick={() => report && onPeek(report.id)}
                    >
                      {status === "none" ? "·" : status === "published" ? "✓" : "…"}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
