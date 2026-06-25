import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Braces, FileText, Printer, RefreshCw } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import { LogoSpinner } from "@/components/common/logo-spinner";
import { cn } from "@operis/utils";
import { ProjectStatusReportService } from "@/services/project/project-status-report.service";

const service = new ProjectStatusReportService();

type PreviewFormat = "html" | "md";

type PreviewDraft = {
  executive_summary_html: string;
  em_execucao: string[];
  pontos_atencao: string[];
  proximos_passos: string[];
};

type Props = {
  workspaceSlug: string;
  projectId: string;
  reportId: string;
  draft: PreviewDraft;
};

export function ProjectStatusReportPreviewPanel(props: Props) {
  const { workspaceSlug, projectId, reportId, draft } = props;
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;

  const [format, setFormat] = useState<PreviewFormat>("html");
  const [html, setHtml] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const loadPreview = useCallback(
    async (options?: { forceIframeRemount?: boolean }) => {
      const currentDraft = draftRef.current;
      setLoading(true);
      try {
        const result = await service.preview(workspaceSlug, projectId, reportId, {
          format,
          executive_summary_html: currentDraft.executive_summary_html,
          em_execucao: currentDraft.em_execucao,
          pontos_atencao: currentDraft.pontos_atencao,
          proximos_passos: currentDraft.proximos_passos,
        });

        if (format === "md") {
          setMarkdown(result.text);
          setHtml(null);
          return;
        }

        setMarkdown(null);
        setHtml(result.text);
        if (options?.forceIframeRemount) {
          setIframeKey((key) => key + 1);
        }
      } catch (error) {
        const message =
          error instanceof Error && error.message && error.message !== "preview_failed"
            ? error.message
            : tRef.current("something_went_wrong");
        setToast({ type: TOAST_TYPE.ERROR, title: tRef.current("toast.error"), message });
      } finally {
        setLoading(false);
      }
    },
    [format, projectId, reportId, workspaceSlug]
  );

  const handlePrintPdf = async () => {
    const currentDraft = draftRef.current;
    setPrinting(true);
    try {
      const result = await service.preview(workspaceSlug, projectId, reportId, {
        format: "pdf",
        executive_summary_html: currentDraft.executive_summary_html,
        em_execucao: currentDraft.em_execucao,
        pontos_atencao: currentDraft.pontos_atencao,
        proximos_passos: currentDraft.proximos_passos,
      });

      if (result.blob && !result.pdfFallback) {
        const url = URL.createObjectURL(result.blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "status-report.pdf";
        anchor.click();
        URL.revokeObjectURL(url);
        return;
      }

      const blob = new Blob([result.text], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, "_blank");
      if (win) {
        win.addEventListener("load", () => {
          win.print();
        });
      }
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: tRef.current("toast.success"),
        message: tRef.current("project.status_report.pdf_print_hint"),
      });
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: tRef.current("toast.error"),
        message: tRef.current("something_went_wrong"),
      });
    } finally {
      setPrinting(false);
    }
  };

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  const formatTabs: { key: PreviewFormat; label: string; icon: LucideIcon }[] = [
    { key: "html", label: t("project.status_report.preview_html"), icon: Braces },
    { key: "md", label: t("project.status_report.preview_md"), icon: FileText },
  ];

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle px-4 py-3 sm:px-5">
        <div className="flex gap-1 rounded-lg border border-subtle bg-layer-2 p-1" role="tablist">
          {formatTabs.map((tab) => (
            <FormatTab
              key={tab.key}
              active={format === tab.key}
              icon={tab.icon}
              label={tab.label}
              onClick={() => setFormat(tab.key)}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void loadPreview({ forceIframeRemount: true })}
            loading={loading}
          >
            <RefreshCw className="size-3.5" />
            {t("project.status_report.preview_refresh")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void handlePrintPdf()} loading={printing}>
            <Printer className="size-3.5" />
            {t("project.status_report.export_print")}
          </Button>
        </div>
      </div>

      <div className="relative min-h-[480px] overflow-hidden bg-[#eceff1]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-layer-1/60">
            <LogoSpinner />
          </div>
        )}

        {format === "md" && markdown !== null && (
          <pre className="max-h-[70vh] overflow-auto bg-layer-1 p-5 text-body-xs-regular leading-relaxed whitespace-pre-wrap text-secondary">
            {markdown}
          </pre>
        )}

        {format === "html" && html !== null && (
          <iframe
            key={`html-preview-${iframeKey}`}
            title={t("project.status_report.preview_html")}
            className="h-[70vh] w-full border-0 bg-white"
            srcDoc={html}
            sandbox="allow-same-origin"
          />
        )}
      </div>
    </div>
  );
}

function FormatTab({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-body-xs-medium transition-colors",
        active ? "shadow-sm bg-layer-1 text-primary" : "text-tertiary hover:bg-layer-1/60 hover:text-primary"
      )}
      onClick={onClick}
    >
      <Icon className="size-3.5" strokeWidth={1.75} />
      {label}
    </button>
  );
}
