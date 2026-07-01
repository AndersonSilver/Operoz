import { API_BASE_URL } from "@operoz/constants";
import type {
  IBoardStatusReport,
  TBoardStatusReportUpdateData,
  TProjectStatusReportCreateData,
  TStatusReportExportFormat,
  TStatusReportPreviewData,
} from "@operoz/types";
import { APIService } from "@/services/api.service";

export class ProjectStatusReportService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string, projectId: string): Promise<IBoardStatusReport[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/status-reports/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(
    workspaceSlug: string,
    projectId: string,
    data: TProjectStatusReportCreateData
  ): Promise<IBoardStatusReport> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/status-reports/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retrieve(workspaceSlug: string, projectId: string, reportId: string): Promise<IBoardStatusReport> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/status-reports/${reportId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    projectId: string,
    reportId: string,
    data: TBoardStatusReportUpdateData
  ): Promise<IBoardStatusReport> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/status-reports/${reportId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async remove(workspaceSlug: string, projectId: string, reportId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/status-reports/${reportId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async preview(
    workspaceSlug: string,
    projectId: string,
    reportId: string,
    data: TStatusReportPreviewData
  ): Promise<{ text: string; mime: string; pdfFallback: boolean; blob?: Blob }> {
    const format = data.format ?? "html";
    const url = `/api/workspaces/${workspaceSlug}/projects/${projectId}/status-reports/${reportId}/preview/`;
    return this.post(url, data, { responseType: "blob" })
      .then(async (response) => {
        const blob = response?.data as Blob;
        const mime = (response?.headers?.["content-type"] as string) || "text/html";
        const pdfFallback = response?.headers?.["x-status-report-pdf-fallback"] === "html-print";

        if (format === "pdf" && !pdfFallback && mime.includes("pdf")) {
          return { text: "", mime, pdfFallback: false, blob };
        }

        const text = await blob.text();
        if (mime.includes("json") || text.trimStart().startsWith("{")) {
          const parsed = JSON.parse(text) as { error?: string };
          throw new Error(parsed.error ?? "preview_failed");
        }

        return { text, mime, pdfFallback, blob: undefined };
      })
      .catch(async (error) => {
        const data = error?.response?.data;
        if (data instanceof Blob) {
          const text = await data.text();
          try {
            const parsed = JSON.parse(text) as { error?: string };
            throw new Error(parsed.error ?? "preview_failed");
          } catch {
            throw new Error(text || "preview_failed");
          }
        }
        throw error;
      });
  }

  async downloadExport(
    workspaceSlug: string,
    projectId: string,
    reportId: string,
    format: TStatusReportExportFormat = "md",
    draft?: Pick<
      TStatusReportPreviewData,
      "executive_summary_html" | "em_execucao" | "pontos_atencao" | "proximos_passos"
    >
  ): Promise<{ data: BlobPart; mime: string; filename: string; pdfFallback?: boolean }> {
    const result = await this.preview(workspaceSlug, projectId, reportId, {
      format,
      executive_summary_html: draft?.executive_summary_html ?? "",
      em_execucao: draft?.em_execucao ?? [],
      pontos_atencao: draft?.pontos_atencao ?? [],
      proximos_passos: draft?.proximos_passos ?? [],
    });

    const stamp = new Date().toISOString().slice(0, 10);
    const base = `status-report-${stamp}`;

    if (format === "pdf") {
      if (result.blob && !result.pdfFallback) {
        const buffer = await result.blob.arrayBuffer();
        return {
          data: buffer,
          mime: "application/pdf",
          filename: `${base}.pdf`,
          pdfFallback: false,
        };
      }
      return {
        data: result.text,
        mime: "text/html; charset=utf-8",
        filename: `${base}-print.html`,
        pdfFallback: true,
      };
    }

    if (format === "html") {
      return {
        data: result.text,
        mime: "text/html; charset=utf-8",
        filename: `${base}.html`,
      };
    }

    return {
      data: result.text,
      mime: "text/markdown; charset=utf-8",
      filename: `${base}.md`,
    };
  }
}
