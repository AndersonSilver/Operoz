import { useCallback, useState } from "react";
import { useTranslation } from "@operoz/i18n";
import { setToast, TOAST_TYPE } from "@operoz/propel/toast";
import { BoardService } from "@/services/board/board.service";
import { WorkspaceService } from "@/services/workspace.service";
import {
  parseClient360QbrResponse,
  triggerClient360QbrDownload,
  type Client360QbrExportFormat,
} from "@/components/board/client-360/client-360-qbr-download";

type BaseParams = {
  periodStart: string;
  periodEnd: string;
  compare?: boolean;
  weeks?: number;
};

type WorkspacePortfolioParams = BaseParams & {
  scope: "workspace-portfolio";
  workspaceSlug: string;
};

type WorkspaceClientParams = BaseParams & {
  scope: "workspace-client";
  workspaceSlug: string;
  projectId: string;
};

type BoardPortfolioParams = BaseParams & {
  scope: "board-portfolio";
  workspaceSlug: string;
  boardSlug: string;
};

type BoardClientParams = BaseParams & {
  scope: "board-client";
  workspaceSlug: string;
  boardSlug: string;
  projectId: string;
};

export type Client360QbrExportParams =
  | WorkspacePortfolioParams
  | WorkspaceClientParams
  | BoardPortfolioParams
  | BoardClientParams;

const workspaceService = new WorkspaceService();
const boardService = new BoardService();

export function useClient360QbrExport(params: Client360QbrExportParams) {
  const { t } = useTranslation();
  const [exporting, setExporting] = useState(false);

  const exportQbr = useCallback(
    async (format: Client360QbrExportFormat) => {
      if (exporting) return;
      setExporting(true);
      try {
        const query = {
          period_start: params.periodStart,
          period_end: params.periodEnd,
          weeks: params.weeks ?? 13,
          export_format: format,
          ...(params.compare ? { compare: true } : {}),
        };

        let response: Awaited<ReturnType<typeof workspaceService.downloadClient360QbrPortfolio>>;
        let fallbackBase = `operoz-qbr-${params.periodEnd}`;

        if (params.scope === "workspace-portfolio") {
          response = await workspaceService.downloadClient360QbrPortfolio(params.workspaceSlug, query);
        } else if (params.scope === "workspace-client") {
          response = await workspaceService.downloadClient360QbrClient(params.workspaceSlug, params.projectId, query);
          fallbackBase = `operoz-qbr-client-${params.periodEnd}`;
        } else if (params.scope === "board-portfolio") {
          response = await boardService.downloadClient360QbrPortfolio(params.workspaceSlug, params.boardSlug, query);
        } else {
          response = await boardService.downloadClient360QbrClient(
            params.workspaceSlug,
            params.boardSlug,
            params.projectId,
            query
          );
          fallbackBase = `operoz-qbr-client-${params.periodEnd}`;
        }

        const parsed = await parseClient360QbrResponse(response, format, fallbackBase);
        triggerClient360QbrDownload(parsed);

        if (parsed.pdfFallback) {
          setToast({
            type: TOAST_TYPE.WARNING,
            title: t("boards.client_360.qbr_export_pdf_fallback_title"),
            message: t("boards.client_360.qbr_export_pdf_fallback_message"),
          });
        } else if (parsed.warnings.length) {
          setToast({
            type: TOAST_TYPE.WARNING,
            title: t("boards.client_360.qbr_export_warnings_title"),
            message: parsed.warnings.join(" "),
          });
        } else {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("boards.client_360.qbr_export_success_title"),
            message: t("boards.client_360.qbr_export_success_message"),
          });
        }
      } catch {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("boards.client_360.qbr_export_error_title"),
          message: t("boards.client_360.qbr_export_error_message"),
        });
      } finally {
        setExporting(false);
      }
    },
    [exporting, params, t]
  );

  return { exportQbr, exporting };
}
