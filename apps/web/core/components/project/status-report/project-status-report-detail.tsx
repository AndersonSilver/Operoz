import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  AlertTriangle,
  Braces,
  CheckCircle2,
  Eye,
  FileDown,
  FileText,
  Layers3,
  ListChecks,
  Pencil,
  Plus,
  Printer,
  Save,
  ScrollText,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { IconButton } from "@operis/propel/icon-button";
import { Tooltip } from "@operis/propel/tooltip";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IProject, TStatusReportExportFormat } from "@operis/types";
import { AlertModalCore, CustomMenu } from "@operis/ui";
import { cn, renderFormattedPeriodDatesLong } from "@operis/utils";
import { buildExecutiveSummaryAiPayload } from "@/components/project/status-report/build-executive-summary-ai-payload";
import { formatReportWeekLabel } from "@/components/project/status-report/format-status-report-week";
import { useBoardHubNavigate } from "@/components/board/use-board-hub-navigate";
import { useStatusReportCapabilities } from "@/hooks/use-status-report-capabilities";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { StatusReportObservationComposer } from "@/components/project/status-report/status-report-observation-composer";
import { StatusReportObservationItem } from "@/components/project/status-report/status-report-observation-item";
import { ProjectStatusReportPreviewPanel } from "@/components/project/status-report/project-status-report-preview-panel";
import { ProjectStatusReportService } from "@/services/project/project-status-report.service";
import { AIService } from "@/services/ai.service";

const service = new ProjectStatusReportService();
const aiService = new AIService();

function ContextBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-placeholder">{label}</p>
      {children}
    </div>
  );
}

function ContextValueCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-subtle bg-layer-2/30 px-3 py-2.5">{children}</div>
  );
}

function ContextLinkCard({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-subtle bg-layer-2/30 px-3 py-2.5 text-[11px] leading-snug text-secondary transition-colors hover:border-strong hover:bg-layer-2/50 hover:text-primary"
    >
      {children}
    </Link>
  );
}

type ReportMetrics = {
  completed: number;
  total: number;
  pct: number;
  hasData: boolean;
};

function ReportContextPanel({
  weekLabel,
  periodDatesLabel,
  moduleName,
  moduleId,
  projectName,
  workspaceSlug,
  projectId,
  metrics,
  t,
}: {
  weekLabel: string;
  periodDatesLabel: string;
  moduleName?: string | null;
  moduleId?: string | null;
  projectName: string;
  workspaceSlug: string;
  projectId: string;
  metrics: ReportMetrics | null;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const projectHref = `/${workspaceSlug}/projects/${projectId}/issues`;
  const moduleHref = moduleId ? `/${workspaceSlug}/projects/${projectId}/modules/${moduleId}` : null;
  return (
    <>
      <div className="mb-4 flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-md border border-subtle bg-layer-2/60 text-accent-primary">
          <Layers3 className="size-3.5" strokeWidth={1.75} />
        </span>
        <h3 className="text-body-sm-medium text-primary">{t("project.status_report.detail_context")}</h3>
      </div>
      <div className="space-y-4">
        <ContextBlock label={t("project.status_report.period_week_label")}>
          <ContextValueCard>
            <p className="text-body-xs-medium text-primary">{weekLabel}</p>
            <p className="mt-0.5 text-caption-sm-regular text-tertiary">{periodDatesLabel}</p>
          </ContextValueCard>
        </ContextBlock>
        {moduleName && (
          <ContextBlock label={t("project.status_report.module_label")}>
            <ContextValueCard>
              <p className="leading-snug text-body-xs-regular text-secondary">{moduleName}</p>
            </ContextValueCard>
          </ContextBlock>
        )}
        <ContextBlock label={t("project.status_report.section_project")}>
          <ContextValueCard>
            <p className="leading-snug text-body-xs-regular text-secondary">{projectName}</p>
          </ContextValueCard>
        </ContextBlock>
        {metrics?.hasData && (
          <ContextBlock label={t("project.status_report.section_highlights")}>
            <ContextValueCard>
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <span className="tabular-nums text-body-sm-medium text-primary">
                  {metrics.completed}/{metrics.total}
                </span>
                <span className="text-caption-sm-regular text-tertiary">{metrics.pct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-layer-3">
                <div
                  className="h-full rounded-full bg-accent-primary transition-all"
                  style={{ width: `${metrics.pct}%` }}
                />
              </div>
            </ContextValueCard>
          </ContextBlock>
        )}
      </div>
    </>
  );
}

type Props = {
  workspaceSlug: string;
  project: IProject;
  reportId: string;
};

export function ProjectStatusReportDetail(props: Props) {
  const { workspaceSlug, project, reportId } = props;
  const { t } = useTranslation();
  const navigate = useBoardHubNavigate();
  const { getWorkspaceBySlug } = useWorkspace();
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id ?? "";
  const { canManage: canManageReports, canDelete: canDeleteReports } = useStatusReportCapabilities(project.id);
  const canManage = canManageReports();
  const canDelete = canDeleteReports();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: report, isLoading, mutate } = useSWR(
    workspaceSlug && project.id && reportId
      ? `PROJECT_STATUS_REPORT_${workspaceSlug}_${project.id}_${reportId}`
      : null,
    () => service.retrieve(workspaceSlug, project.id, reportId),
    { revalidateOnFocus: false }
  );

  const [summary, setSummary] = useState<string | null>(null);
  const [emExecucao, setEmExecucao] = useState<string | null>(null);
  const [pontosAtencao, setPontosAtencao] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [printingPdf, setPrintingPdf] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<TStatusReportExportFormat | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");
  const [generatingSummary, setGeneratingSummary] = useState(false);

  const linesToText = (items?: string[]) => (items?.length ? items.join("\n") : "");

  const effectiveSummary =
    summary ?? report?.content?.sections?.executive_summary?.html ?? "";

  const effectiveEmExecucao =
    emExecucao ?? linesToText(report?.content?.sections?.observacoes?.em_execucao);

  const effectivePontosAtencao =
    pontosAtencao ?? linesToText(report?.content?.sections?.observacoes?.pontos_atencao);

  const textToLines = (text: string) =>
    text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const moduleName =
    report?.module_name ??
    (report?.content?.sections?.module as { name?: string } | undefined)?.name ??
    "";

  const moduleId =
    report?.module ?? (report?.content?.sections?.module as { id?: string } | undefined)?.id ?? null;

  const buildExportDraft = () => ({
    executive_summary_html: effectiveSummary,
    em_execucao: textToLines(effectiveEmExecucao),
    pontos_atencao: textToLines(effectivePontosAtencao),
  });

  const generateExecutiveSummaryText = async (
    execLines: string[],
    attLines: string[]
  ): Promise<string | null> => {
    if (!report || (!execLines.length && !attLines.length)) return null;

    const weekLabel = formatReportWeekLabel(report.period_start, report.period_end, t);
    const periodDatesLabel = renderFormattedPeriodDatesLong(report.period_start, report.period_end);
    const { task, prompt } = buildExecutiveSummaryAiPayload({
      weekLabel,
      periodDatesLabel,
      moduleName: moduleName || undefined,
      projectName: project.name,
      emExecucaoLines: execLines,
      pontosAtencaoLines: attLines,
    });

    const res = await aiService.createGptTask(workspaceSlug, { task, prompt });
    const text = res.response?.trim() ?? "";
    return text || null;
  };

  const handleSave = async (extra?: { publish?: boolean; unpublish?: boolean }) => {
    if (!report) return;
    setSaving(true);

    const execLines = textToLines(effectiveEmExecucao);
    const attLines = textToLines(effectivePontosAtencao);
    let summaryToSave = effectiveSummary;
    let summaryGeneratedByAi = false;

    try {
      if (execLines.length || attLines.length) {
        setGeneratingSummary(true);
        try {
          const generated = await generateExecutiveSummaryText(execLines, attLines);
          if (generated) {
            summaryToSave = generated;
            summaryGeneratedByAi = true;
          } else {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: t("toast.error"),
              message: t("issue_modal_ai_invalid_response"),
            });
          }
        } catch (err: unknown) {
          const error = (err as { data?: { error?: string }; status?: number })?.data?.error;
          const status = (err as { status?: number })?.status;
          const errorMessage =
            status === 429
              ? error || t("issue_modal_ai_error_rate_limit")
              : error || t("issue_modal_ai_error_generic");
          setToast({ type: TOAST_TYPE.ERROR, title: t("error"), message: errorMessage });
        } finally {
          setGeneratingSummary(false);
        }
      }

      await service.update(workspaceSlug, project.id, reportId, {
        executive_summary_html: summaryToSave,
        em_execucao: execLines,
        pontos_atencao: attLines,
        ...extra,
      });
      await mutate();
      setSummary(null);
      setEmExecucao(null);
      setPontosAtencao(null);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: summaryGeneratedByAi
          ? t("project.status_report.save_success")
          : t("project.status_report.save_success_plain"),
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!report) return;
    setDeleting(true);
    try {
      await service.remove(workspaceSlug, project.id, reportId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("project.status_report.delete_success"),
      });
      navigate(`/${workspaceSlug}/projects/${project.id}/status-report`);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("project.status_report.delete_error"),
      });
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const handleExport = async (format: "html" | "md") => {
    if (!report) return;
    setExportingFormat(format);
    try {
      const { data, mime, filename } = await service.downloadExport(
        workspaceSlug,
        project.id,
        reportId,
        format,
        buildExportDraft()
      );
      const blob = new Blob([data], { type: mime });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setExportingFormat(null);
    }
  };

  const metrics = useMemo(() => {
    if (!report) return null;
    const sections = report.content?.sections ?? {};
    const byProject = (sections.by_project ?? []) as Array<Record<string, unknown>>;
    const highlights = (sections.highlights ?? []) as Array<Record<string, unknown>>;
    const risks = (sections.risks ?? {}) as Record<string, unknown>;
    const row = byProject[0];
    const completed = Number(row?.completed_in_period ?? 0);
    const total = Number(row?.total_issues ?? 0);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      byProject,
      highlights,
      risks,
      completed,
      total,
      pct,
      hasData: byProject.length > 0 || highlights.length > 0,
    };
  }, [report]);

  const previewDraft = useMemo(
    () => ({
      executive_summary_html: effectiveSummary,
      em_execucao: textToLines(effectiveEmExecucao),
      pontos_atencao: textToLines(effectivePontosAtencao),
    }),
    [effectiveEmExecucao, effectivePontosAtencao, effectiveSummary]
  );

  if (isLoading || !report) {
    return <p className="p-8 text-13 text-tertiary">{t("loading")}</p>;
  }

  const handlePrintPdf = async () => {
    if (!report) return;
    setPrintingPdf(true);
    try {
      const { data, mime, filename, pdfFallback } = await service.downloadExport(
        workspaceSlug,
        project.id,
        reportId,
        "pdf",
        previewDraft
      );
      const blob = new Blob([data], { type: mime });
      const url = URL.createObjectURL(blob);

      if (pdfFallback) {
        const win = window.open(url, "_blank");
        if (win) {
          win.addEventListener("load", () => {
            win.print();
          });
        }
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("toast.success"),
          message: t("project.status_report.pdf_print_hint"),
        });
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        return;
      }

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setPrintingPdf(false);
    }
  };

  const weekLabel = formatReportWeekLabel(report.period_start, report.period_end, t);
  const periodDatesLabel = renderFormattedPeriodDatesLong(report.period_start, report.period_end);
  const pageTitle = moduleName?.trim() || report.title?.trim() || weekLabel;
  const detailHeader = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="line-clamp-2 text-h4-medium text-primary sm:text-h3-medium">{pageTitle}</h1>
          <StatusBadge published={report.is_published} t={t} />
        </div>
      </div>
      <ReportDetailToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        canManage={canManage}
        canDelete={canDelete}
        isPublished={report.is_published}
        saving={saving || generatingSummary}
        exportingFormat={exportingFormat}
        printingPdf={printingPdf}
        onSave={() => handleSave()}
        onPublish={() => handleSave({ publish: true })}
        onUnpublish={() => handleSave({ unpublish: true })}
        onDelete={() => setDeleteModalOpen(true)}
        onExportHtml={() => void handleExport("html")}
        onExportMd={() => void handleExport("md")}
        onPrint={() => void handlePrintPdf()}
        t={t}
      />
    </div>
  );

  const contextPanel = (
    <ReportContextPanel
      weekLabel={weekLabel}
      periodDatesLabel={periodDatesLabel}
      moduleName={moduleName}
      moduleId={moduleId}
      projectName={project.name}
      workspaceSlug={workspaceSlug}
      projectId={project.id}
      metrics={metrics}
      t={t}
    />
  );

  return (
    <div className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-layer-1">
      {viewMode === "preview" ? (
        <>
          <div className="shrink-0 border-b border-subtle bg-layer-1">
            <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">{detailHeader}</div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
              <div className="overflow-hidden rounded-lg border border-subtle bg-layer-1">
                <ProjectStatusReportPreviewPanel
                  workspaceSlug={workspaceSlug}
                  projectId={project.id}
                  reportId={reportId}
                  draft={previewDraft}
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-subtle bg-layer-1 px-4 py-5 sm:px-6 lg:px-8">
              {detailHeader}
            </div>
            <div
              className={cn(
                "min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8",
                canManage && "pb-20 xl:pb-6"
              )}
            >
              <div className="flex w-full min-w-0 flex-col gap-6 xl:max-w-[calc(100%-2rem)]">
                <section className="space-y-5">
                  <div className="flex items-start gap-3 rounded-lg border border-accent-primary/20 bg-accent-primary/5 px-4 py-3.5">
                    <ListChecks className="mt-0.5 size-5 shrink-0 text-accent-primary" strokeWidth={1.75} />
                    <div className="min-w-0">
                      <h2 className="text-body-sm-medium text-primary">
                        {t("project.status_report.detail_step_weekly")}
                      </h2>
                      <p className="mt-0.5 text-body-xs-regular text-tertiary">
                        {t("project.status_report.observations_hint")}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
                    <ObservationField
                      variant="exec"
                      label={t("project.status_report.em_execucao")}
                      value={effectiveEmExecucao}
                      onChange={canManage ? setEmExecucao : undefined}
                      emptyHint={t("project.status_report.em_execucao_placeholder")}
                      readOnly={!canManage}
                      workspaceSlug={workspaceSlug}
                      workspaceId={workspaceId}
                      projectId={project.id}
                      reportId={reportId}
                      t={t}
                    />
                    <ObservationField
                      variant="attention"
                      label={t("project.status_report.pontos_atencao")}
                      value={effectivePontosAtencao}
                      onChange={canManage ? setPontosAtencao : undefined}
                      emptyHint={t("project.status_report.pontos_atencao_placeholder")}
                      readOnly={!canManage}
                      workspaceSlug={workspaceSlug}
                      workspaceId={workspaceId}
                      projectId={project.id}
                      reportId={reportId}
                      t={t}
                    />
                  </div>
                </section>

                {!canManage && effectiveSummary ? (
                  <section className="overflow-hidden rounded-xl border border-subtle bg-layer-1 shadow-sm">
                    <PanelSectionHeader
                      icon={FileText}
                      iconClassName="border-violet-500/20 bg-violet-500/10 text-violet-400"
                      title={t("project.status_report.executive_summary")}
                    />
                    <div className="p-4 sm:p-5">
                      <ReadOnlyBlock value={effectiveSummary} />
                    </div>
                  </section>
                ) : null}
              </div>
              <div className="mt-8 border-t border-subtle pt-6 xl:hidden">{contextPanel}</div>
            </div>
          </div>

          <aside className="hidden min-h-0 w-[min(100%,380px)] shrink-0 flex-col border-l border-subtle bg-layer-1 xl:flex xl:w-[380px]">
            <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{contextPanel}</div>
          </aside>
        </div>
      )}

      {canManage && viewMode === "edit" && (
        <footer className="shrink-0 border-t border-subtle bg-layer-1 lg:hidden">
          <div className="mx-auto flex max-w-[1440px] gap-2 px-4 py-3 sm:px-6">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => handleSave()}
              loading={saving || generatingSummary}
            >
              {t("save")}
            </Button>
            {report.is_published ? (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => handleSave({ unpublish: true })}
                loading={saving || generatingSummary}
              >
                {t("project.status_report.unpublish")}
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={() => handleSave({ publish: true })}
                loading={saving || generatingSummary}
                prependIcon={<Send className="size-4" />}
              >
                {t("project.status_report.publish")}
              </Button>
            )}
          </div>
        </footer>
      )}

      <AlertModalCore
        isOpen={deleteModalOpen}
        handleClose={() => setDeleteModalOpen(false)}
        handleSubmit={() => void handleDelete()}
        isSubmitting={deleting}
        title={t("project.status_report.delete_confirm_title")}
        content={
          <p className="text-body-sm-regular text-secondary">
            {report.is_published
              ? t("project.status_report.delete_confirm_published")
              : t("project.status_report.delete_confirm_draft")}
          </p>
        }
      />

    </div>
  );
}

const REPORT_TOOLBAR_BTN_CLASS =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-tertiary transition-colors hover:bg-layer-1/60 hover:text-secondary disabled:pointer-events-none disabled:opacity-40";

function ReportDetailToolbar({
  viewMode,
  onViewModeChange,
  canManage,
  canDelete,
  isPublished,
  saving,
  exportingFormat,
  printingPdf,
  onSave,
  onPublish,
  onUnpublish,
  onDelete,
  onExportHtml,
  onExportMd,
  onPrint,
  t,
}: {
  viewMode: "edit" | "preview";
  onViewModeChange: (mode: "edit" | "preview") => void;
  canManage: boolean;
  canDelete: boolean;
  isPublished: boolean;
  saving: boolean;
  exportingFormat: TStatusReportExportFormat | null;
  printingPdf: boolean;
  onSave: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onDelete: () => void;
  onExportHtml: () => void;
  onExportMd: () => void;
  onPrint: () => void;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const editLabel = t("project.status_report.tab_edit");
  const previewLabel = t("project.status_report.tab_preview");
  const exportLabel = t("project.status_report.detail_export");
  const saveLabel = t("save");
  const publishLabel = t("project.status_report.publish");
  const unpublishLabel = t("project.status_report.unpublish");
  const exportBusy = Boolean(exportingFormat || printingPdf);

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-0.5 rounded-lg border border-subtle bg-layer-2 p-0.5 sm:justify-end">
      <div className="flex gap-0.5" role="tablist">
        <Tooltip tooltipContent={editLabel}>
          <button
            type="button"
            role="tab"
            aria-label={editLabel}
            aria-selected={viewMode === "edit"}
            onClick={() => onViewModeChange("edit")}
            className={REPORT_TOOLBAR_BTN_CLASS}
          >
            <Pencil className="size-3.5" strokeWidth={1.75} />
          </button>
        </Tooltip>
        <Tooltip tooltipContent={previewLabel}>
          <button
            type="button"
            role="tab"
            aria-label={previewLabel}
            aria-selected={viewMode === "preview"}
            onClick={() => onViewModeChange("preview")}
            className={REPORT_TOOLBAR_BTN_CLASS}
          >
            <Eye className="size-3.5" strokeWidth={1.75} />
          </button>
        </Tooltip>
      </div>

      <span className="mx-0.5 h-4 w-px shrink-0 bg-subtle" aria-hidden />

      <ReportExportMenu
        onExportHtml={onExportHtml}
        onExportMd={onExportMd}
        onPrint={onPrint}
        disabled={exportBusy}
        triggerLabel={exportLabel}
        triggerClassName={REPORT_TOOLBAR_BTN_CLASS}
        t={t}
      />

      {canManage && (
        <>
          <Tooltip tooltipContent={saveLabel}>
            <button
              type="button"
              aria-label={saveLabel}
              disabled={saving}
              onClick={onSave}
              className={REPORT_TOOLBAR_BTN_CLASS}
            >
              <Save className="size-3.5" strokeWidth={1.75} />
            </button>
          </Tooltip>
          {isPublished ? (
            <Tooltip tooltipContent={unpublishLabel}>
              <button
                type="button"
                aria-label={unpublishLabel}
                disabled={saving}
                onClick={onUnpublish}
                className={REPORT_TOOLBAR_BTN_CLASS}
              >
                <Undo2 className="size-3.5" strokeWidth={1.75} />
              </button>
            </Tooltip>
          ) : (
            <Tooltip tooltipContent={publishLabel}>
              <button
                type="button"
                aria-label={publishLabel}
                disabled={saving}
                onClick={onPublish}
                className={REPORT_TOOLBAR_BTN_CLASS}
              >
                <Send className="size-3.5" strokeWidth={1.75} />
              </button>
            </Tooltip>
          )}
        </>
      )}

      {canDelete && (
        <>
          <span className="mx-0.5 h-4 w-px shrink-0 bg-subtle" aria-hidden />
          <Tooltip tooltipContent={t("project.status_report.delete")}>
            <button
              type="button"
              aria-label={t("project.status_report.delete")}
              onClick={onDelete}
              className={cn(REPORT_TOOLBAR_BTN_CLASS, "text-danger-primary hover:text-danger-primary")}
            >
              <Trash2 className="size-3.5" strokeWidth={1.75} />
            </button>
          </Tooltip>
        </>
      )}
    </div>
  );
}

function PanelSectionHeader({
  icon: Icon,
  title,
  description,
  className,
  iconClassName,
  actions,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  iconClassName?: string;
  actions?: ReactNode;
}) {
  return (
    <div className={cn("border-b border-subtle bg-layer-2/25 px-4 py-3.5 sm:px-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-md border border-subtle bg-layer-1 text-accent-primary",
              iconClassName
            )}
          >
            <Icon className="size-3.5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h2 className="text-body-sm-medium text-primary">{title}</h2>
            {description && (
              <p className="mt-0.5 text-caption-sm-regular leading-relaxed text-tertiary">{description}</p>
            )}
          </div>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}

function ReportExportMenu({
  onExportHtml,
  onExportMd,
  onPrint,
  disabled,
  triggerLabel,
  triggerClassName,
  t,
}: {
  onExportHtml: () => void;
  onExportMd: () => void;
  onPrint: () => void;
  disabled?: boolean;
  triggerLabel: string;
  triggerClassName?: string;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  return (
    <CustomMenu
      placement="bottom-end"
      closeOnSelect
      customButton={
        <Tooltip tooltipContent={triggerLabel}>
          <button type="button" aria-label={triggerLabel} disabled={disabled} className={triggerClassName}>
            <FileDown className="size-3.5" strokeWidth={1.75} />
          </button>
        </Tooltip>
      }
    >
      <CustomMenu.MenuItem className="flex items-center gap-2" onClick={onExportHtml}>
        <Braces className="size-3.5 shrink-0" />
        {t("project.status_report.export_html")}
      </CustomMenu.MenuItem>
      <CustomMenu.MenuItem className="flex items-center gap-2" onClick={onExportMd}>
        <FileText className="size-3.5 shrink-0" />
        {t("project.status_report.export_md")}
      </CustomMenu.MenuItem>
      <CustomMenu.MenuItem className="flex items-center gap-2" onClick={onPrint}>
        <Printer className="size-3.5 shrink-0" />
        {t("project.status_report.export_print")}
      </CustomMenu.MenuItem>
    </CustomMenu>
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
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-caption-sm-medium",
        published ? "bg-accent-primary/15 text-accent-primary" : "border border-subtle bg-layer-2 text-tertiary"
      )}
    >
      <Icon className="size-3" strokeWidth={2} />
      {published ? t("project.status_report.published") : t("project.status_report.draft")}
    </span>
  );
}

function ReadOnlyBlock({ value }: { value: string }) {
  return (
    <p className="min-h-[72px] whitespace-pre-wrap rounded-xl border border-subtle bg-layer-2/30 px-4 py-3 text-body-sm-regular leading-relaxed text-secondary">
      {value || "—"}
    </p>
  );
}

const OBS_FIELD_THEME = {
  exec: {
    Icon: CheckCircle2,
    iconClass: "text-emerald-400",
    composerBorder: "border-emerald-500/40",
    submitBtn: "bg-emerald-600 text-on-color hover:bg-emerald-700",
    rowHover: "hover:border-emerald-500/40",
  },
  attention: {
    Icon: AlertTriangle,
    iconClass: "text-amber-400",
    composerBorder: "border-amber-500/40",
    submitBtn: "bg-amber-600 text-on-color hover:bg-amber-700",
    rowHover: "hover:border-amber-500/40",
  },
} as const;

function parseObservationLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function observationLinesToValue(lines: string[]): string {
  return lines.join("\n");
}

function addObservationLine(value: string, line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return value;
  const lines = parseObservationLines(value);
  return observationLinesToValue([...lines, trimmed]);
}

function removeObservationLineAt(value: string, index: number): string {
  const lines = parseObservationLines(value);
  if (index < 0 || index >= lines.length) return value;
  lines.splice(index, 1);
  return observationLinesToValue(lines);
}

function renderObservationBoldText(text: string) {
  const segments = text.split(/(\*\*[^*]+\*\*)/g).filter((part) => part.length > 0);
  return segments.map((segment, index) => {
    const bold = segment.match(/^\*\*(.+)\*\*$/);
    if (bold) {
      return (
        <strong key={index} className="font-semibold">
          {bold[1]}
        </strong>
      );
    }
    return <span key={index}>{segment}</span>;
  });
}

function ObservationField({
  variant,
  label,
  value,
  onChange,
  emptyHint,
  readOnly,
  workspaceSlug,
  workspaceId,
  projectId,
  reportId,
  t,
}: {
  variant: keyof typeof OBS_FIELD_THEME;
  label: string;
  value: string;
  onChange?: (value: string) => void;
  emptyHint: string;
  readOnly?: boolean;
  workspaceSlug: string;
  workspaceId: string;
  projectId: string;
  reportId: string;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const theme = OBS_FIELD_THEME[variant];
  const Icon = theme.Icon;
  const lines = parseObservationLines(value);
  const lineCount = lines.length;
  const [showComposer, setShowComposer] = useState(false);
  const canUseRichEditor = Boolean(workspaceId && projectId && reportId);

  const openComposer = () => {
    setShowComposer(true);
  };

  const closeComposer = () => {
    setShowComposer(false);
  };

  const commitHtml = (html: string) => {
    if (!onChange) return;
    const normalized = html.replace(/\r?\n/g, "").trim();
    if (!normalized) return;
    onChange(addObservationLine(value, normalized));
    closeComposer();
  };

  const removeAt = (index: number) => {
    onChange?.(removeObservationLineAt(value, index));
  };

  return (
    <div className="flex max-h-[min(52vh,480px)] flex-col overflow-hidden rounded-lg border border-subtle bg-layer-1">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-subtle bg-layer-2/40 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className={cn("size-3.5 shrink-0", theme.iconClass)} strokeWidth={1.75} />
          <h3 className="truncate text-body-xs-medium text-primary">{label}</h3>
          <span className="shrink-0 text-caption-sm-regular text-tertiary">
            {t("project.status_report.detail_items", { count: lineCount })}
          </span>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={openComposer}
            className="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-caption-sm-regular text-tertiary transition-colors hover:bg-layer-3 hover:text-primary"
          >
            <Plus className="size-3.5" strokeWidth={1.75} />
            {t("project.status_report.detail_add_short")}
          </button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
        {lineCount === 0 && !showComposer ? (
          <div className="flex flex-1 flex-col items-center justify-center px-2 py-8 text-center">
            <p className="mb-3 max-w-md text-caption-sm-regular leading-relaxed text-tertiary">
              {renderObservationBoldText(emptyHint)}
            </p>
            {!readOnly && (
              <button
                type="button"
                onClick={openComposer}
                className="text-body-sm-medium text-accent-primary hover:underline"
              >
                {t("project.status_report.detail_add_first_item")}
              </button>
            )}
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5">
            <div className="divide-y divide-subtle">
              {lines.map((line, index) => (
                <StatusReportObservationItem
                  key={`${index}-${line.slice(0, 24)}`}
                  line={line}
                  variant={variant}
                  onRemove={readOnly ? undefined : () => removeAt(index)}
                />
              ))}
            </div>
            {showComposer && !readOnly && canUseRichEditor && (
              <StatusReportObservationComposer
                workspaceSlug={workspaceSlug}
                workspaceId={workspaceId}
                projectId={projectId}
                reportId={reportId}
                theme={theme}
                onCommit={commitHtml}
                onCancel={closeComposer}
                t={t}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

