import { useCallback, useState } from "react";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import { WorkspaceService } from "@/services/workspace.service";
import { BoardService } from "@/services/board/board.service";

const workspaceService = new WorkspaceService();
const boardService = new BoardService();

type Scope =
  | { kind: "workspace"; workspaceSlug: string; boardIds?: string }
  | { kind: "board"; workspaceSlug: string; boardSlug: string };

type Params = {
  scope: Scope;
  periodStart: string;
  periodEnd: string;
  weeks?: number;
  delimiter?: "comma" | "semicolon";
};

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function filenameFromDisposition(header: string | undefined, fallback: string): string {
  if (!header) return fallback;
  const match = /filename="?([^";]+)"?/.exec(header);
  return match?.[1] ?? fallback;
}

export function useClient360MatrixCsvExport(params: Params) {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  const exportCsv = useCallback(async () => {
    setExporting(true);
    try {
      const query = {
        period_start: params.periodStart,
        period_end: params.periodEnd,
        weeks: params.weeks ?? 8,
        export: "csv" as const,
        delimiter: params.delimiter === "semicolon" ? ("semicolon" as const) : undefined,
        ...(params.scope.kind === "workspace" && params.scope.boardIds ? { board_ids: params.scope.boardIds } : {}),
      };

      const result =
        params.scope.kind === "workspace"
          ? await workspaceService.downloadClient360MatrixCsv(params.scope.workspaceSlug, query)
          : await boardService.downloadClient360MatrixCsv(params.scope.workspaceSlug, params.scope.boardSlug, query);

      const filename = filenameFromDisposition(
        result.headers["content-disposition"],
        `visao-360-matriz-${params.periodEnd}.csv`
      );
      triggerDownload(result.data, filename.endsWith(".csv") ? filename : `${filename}.csv`);

      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.client_360.matrix_export_success_title"),
        message: t("boards.client_360.matrix_export_success_message"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("boards.client_360.matrix_export_error_title"),
        message: t("boards.client_360.matrix_export_error_message"),
      });
    } finally {
      setExporting(false);
    }
  }, [params, t]);

  return { exportCsv, exporting };
}
