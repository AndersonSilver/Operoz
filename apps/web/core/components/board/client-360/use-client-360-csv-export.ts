import { useCallback } from "react";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { TClient360Client } from "@operis/types";
import { downloadClient360Csv, type Client360CsvExportMode } from "@/components/board/client-360/client-360-csv-export";
import type { Client360TableColumnConfig } from "@/components/board/client-360/client-360-table-columns";

type Params = {
  workspaceSlug: string;
  periodStart: string;
  periodEnd: string;
  clients: TClient360Client[];
  tableColumns: Client360TableColumnConfig[];
  includeBoard: boolean;
  showPeriodCompare?: boolean;
};

export function useClient360CsvExport({
  workspaceSlug,
  periodStart,
  periodEnd,
  clients,
  tableColumns,
  includeBoard,
  showPeriodCompare = false,
}: Params) {
  const { t } = useTranslation();

  return useCallback(
    (mode: Client360CsvExportMode) => {
      if (clients.length === 0) return;

      const result = downloadClient360Csv({
        workspaceSlug,
        periodStart,
        periodEnd,
        clients,
        tableColumns,
        includeBoard,
        mode,
        t,
        showPeriodCompare,
      });

      if (result.truncated) {
        setToast({
          type: TOAST_TYPE.WARNING,
          title: t("boards.client_360.export_csv_truncated_title"),
          message: t("boards.client_360.export_csv_truncated_message", {
            exported: result.exportedCount,
            total: result.totalCount,
          }),
        });
      } else {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("boards.client_360.export_csv_success_title"),
          message: t("boards.client_360.export_csv_success_message", { count: result.exportedCount }),
        });
      }
    },
    [clients, includeBoard, periodEnd, periodStart, showPeriodCompare, tableColumns, t, workspaceSlug]
  );
}
