import { ChevronRight } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import type { IBoardStatusReport } from "@operis/types";
import { cn, renderFormattedDate } from "@operis/utils";
import { formatReportWeekLabel } from "@/components/project/status-report/format-status-report-week";
import { BOARD_HUB_CYCLE_SECTION_HEADER } from "@/components/board/board-hub-background";
import { getReportSummarySnippet, isStaleDraft } from "@/components/project/status-report/status-report-utils";

type Group = {
  module: { id: string; name: string };
  reports: IBoardStatusReport[];
};

type Props = {
  groups: Group[];
  onPeek: (reportId: string) => void;
};

export function StatusReportListByModule(props: Props) {
  const { groups, onPeek } = props;
  const { t } = useTranslation();

  return (
    <div className="divide-y divide-subtle/60">
      {groups.map(({ module, reports }) => (
        <section key={module.id}>
          <div className={cn(BOARD_HUB_CYCLE_SECTION_HEADER, "px-4 py-2.5")}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-13 font-semibold text-primary">{module.name}</h3>
              <span className="shrink-0 rounded-md bg-layer-2 px-1.5 py-0.5 text-11 tabular-nums text-tertiary">
                {reports.length}
              </span>
            </div>
          </div>
          <ul>
            {reports.map((report) => {
              const week = formatReportWeekLabel(report.period_start, report.period_end, t);
              const snippet = getReportSummarySnippet(report, 80);
              const stale = isStaleDraft(report);
              return (
                <li key={report.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 border-b border-subtle/40 px-4 py-3 text-left transition-colors hover:bg-layer-2/40 last:border-b-0"
                    onClick={() => onPeek(report.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-13 font-medium text-secondary">{week}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-11 font-medium",
                            report.is_published
                              ? "bg-accent-primary/15 text-accent-primary"
                              : stale
                                ? "bg-warning-subtle/40 text-warning-primary"
                                : "border border-subtle text-tertiary"
                          )}
                        >
                          {report.is_published
                            ? t("project.status_report.published")
                            : stale
                              ? t("project.status_report.stale_draft_badge")
                              : t("project.status_report.draft")}
                        </span>
                      </div>
                      <p className="mt-0.5 text-11 text-tertiary">
                        {renderFormattedDate(report.period_start)} — {renderFormattedDate(report.period_end)}
                      </p>
                      {snippet ? (
                        <p className="mt-1 line-clamp-1 text-13 text-tertiary">{snippet}</p>
                      ) : null}
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-placeholder" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
