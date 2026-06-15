export type Client360QbrExportFormat = "md" | "pdf";

export type Client360QbrDownloadResult = {
  blob: Blob;
  filename: string;
  mime: string;
  pdfFallback: boolean;
  warnings: string[];
};

function filenameFromDisposition(header: string | undefined, fallback: string): string {
  if (!header) return fallback;
  const match = /filename="([^"]+)"/i.exec(header);
  return match?.[1] ?? fallback;
}

export function triggerClient360QbrDownload(result: Client360QbrDownloadResult): void {
  const url = URL.createObjectURL(result.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = result.filename;
  if (result.pdfFallback) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function parseClient360QbrResponse(
  response: { data: Blob; headers?: Record<string, string | undefined> },
  format: Client360QbrExportFormat,
  fallbackBase: string
): Promise<Client360QbrDownloadResult> {
  const mime = (response.headers?.["content-type"] as string) || "application/octet-stream";
  const pdfFallback = response.headers?.["x-client360-qbr-pdf-fallback"] === "html-print";
  const warningsHeader = response.headers?.["x-client360-qbr-warnings"];
  const warnings = warningsHeader ? warningsHeader.split("; ").filter(Boolean) : [];
  const disposition = response.headers?.["content-disposition"] as string | undefined;
  const defaultExt = format === "pdf" && !pdfFallback ? "pdf" : format === "pdf" ? "html" : "md";
  const filename = filenameFromDisposition(disposition, `${fallbackBase}.${defaultExt}`);

  return {
    blob: response.data,
    filename,
    mime,
    pdfFallback,
    warnings,
  };
}
