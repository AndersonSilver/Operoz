import { useEffect } from "react";
import useSWR from "swr";
import { X, ExternalLink, FileDown } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { IconButton } from "@operis/propel/icon-button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import { Loader } from "@operis/ui";
import { cn, generateQueryParams } from "@operis/utils";
import { formatReportWeekLabel } from "@/components/project/status-report/format-status-report-week";
import { ObservationHtmlView } from "@/components/project/status-report/observation-html-view";
import { isObservationHtml } from "@/components/project/status-report/observation-content";
import {
  getReportProgressPct,
  getReportSummarySnippet,
  stripHtmlToText,
} from "@/components/project/status-report/status-report-utils";
import { ProjectStatusReportService } from "@/services/project/project-status-report.service";
import { useAppRouter } from "@/hooks/use-app-router";

const service = new ProjectStatusReportService();

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export function StatusReportPeekPanel(props: Props) {
  const { workspaceSlug, projectId } = props;
  const { t } = useTranslation();
  const router = useAppRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const peekReport = searchParams.get("peekReport");

  const { data: report, isLoading } = useSWR(
    peekReport && workspaceSlug && projectId
      ? `PEEK_STATUS_REPORT_${workspaceSlug}_${projectId}_${peekReport}`
      : null,
    () => service.retrieve(workspaceSlug, projectId, peekReport!),
    { revalidateOnFocus: false }
  );

  const handleClose = () => {
    const query = generateQueryParams(searchParams, ["peekReport"]);
    router.push(`${pathname}?${query}`);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && peekReport) handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!peekReport) return null;

  const detailHref = `/${workspaceSlug}/projects/${projectId}/status-report/${peekReport}`;
  const progress = report ? getReportProgressPct(report) : null;
  const summaryHtml = report?.content?.sections?.executive_summary?.html ?? "";
  const summaryPlain = report ? getReportSummarySnippet(report, 400) : "";

  const handleExportPdf = async () => {
    if (!report) return;
    try {
      const { data, mime, filename, pdfFallback } = await service.downloadExport(
        workspaceSlug,
        projectId,
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
      URL.revokeObjectURL(url);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  return (
    <div
      className={cn(
        "absolute inset-y-0 right-0 z-[12] flex h-full w-full max-w-md flex-col border-l border-subtle/60 bg-surface-1/95 shadow-xl backdrop-blur-xl",
        "md:relative md:max-w-sm"
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-subtle/60 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-13 font-semibold text-primary">
            {report?.module_name ?? report?.title ?? t("project.status_report.title")}
          </p>
          {report ? (
            <p className="text-11 text-tertiary">
              {formatReportWeekLabel(report.period_start, report.period_end, t)}
            </p>
          ) : null}
        </div>
        <IconButton variant="ghost" size="sm" icon={X} aria-label={t("common.close")} onClick={handleClose} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader />
          </div>
        ) : !report ? (
          <p className="text-13 text-tertiary">{t("something_went_wrong")}</p>
        ) : (
          <div className="space-y-4">
            {progress !== null ? (
              <div>
                <p className="mb-1 text-11 font-medium text-tertiary">{t("project.status_report.col_progress")}</p>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-layer-2">
                    <span
                      className="block h-full rounded-full bg-accent-primary"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-13 text-secondary">{progress}%</span>
                </div>
              </div>
            ) : null}

            <div>
              <p className="mb-1.5 text-11 font-medium text-tertiary">
                {t("project.status_report.executive_summary")}
              </p>
              {summaryHtml && isObservationHtml(summaryHtml) ? (
                <div className="rounded-md border border-subtle/50 bg-layer-2/30 p-3 text-13 text-secondary">
                  <ObservationHtmlView html={summaryHtml} />
                </div>
              ) : (
                <p className="text-13 leading-relaxed text-secondary">
                  {summaryPlain || stripHtmlToText(summaryHtml) || "—"}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap gap-2 border-t border-subtle/60 p-4">
        <Button variant="primary" size="sm" className="flex-1" onClick={() => router.push(detailHref)}>
          <ExternalLink className="mr-1.5 size-3.5" />
          {t("project.status_report.peek_open_full")}
        </Button>
        {report ? (
          <Button variant="secondary" size="sm" onClick={() => void handleExportPdf()}>
            <FileDown className="mr-1.5 size-3.5" />
            {t("project.status_report.export_pdf")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
