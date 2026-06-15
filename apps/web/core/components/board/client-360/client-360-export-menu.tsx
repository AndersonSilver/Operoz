import { Download } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { IconButton } from "@operis/propel/icon-button";
import { Tooltip } from "@operis/propel/tooltip";
import { CustomMenu } from "@operis/ui";
import { cn } from "@operis/utils";
import type { TClient360Client } from "@operis/types";
import { useClient360CsvExport } from "@/components/board/client-360/use-client-360-csv-export";
import { Client360QbrExportMenu } from "@/components/board/client-360/client-360-qbr-export-menu";
import type { Client360QbrExportParams } from "@/components/board/client-360/use-client-360-qbr-export";
import type { Client360TableColumnConfig } from "@/components/board/client-360/client-360-table-columns";

type Props = {
  workspaceSlug: string;
  periodStart: string;
  periodEnd: string;
  clients: TClient360Client[];
  tableColumns: Client360TableColumnConfig[];
  includeBoard: boolean;
  showPeriodCompare?: boolean;
  qbrParams?: Client360QbrExportParams;
  disabled?: boolean;
  className?: string;
};

export function Client360ExportMenu({
  workspaceSlug,
  periodStart,
  periodEnd,
  clients,
  tableColumns,
  includeBoard,
  showPeriodCompare = false,
  qbrParams,
  disabled = false,
  className,
}: Props) {
  const { t } = useTranslation();
  const label = t("boards.client_360.export_csv_label");
  const exportCsv = useClient360CsvExport({
    workspaceSlug,
    periodStart,
    periodEnd,
    clients,
    tableColumns,
    includeBoard,
    showPeriodCompare,
  });

  return (
    <CustomMenu
      className={className}
      placement="bottom-end"
      customButton={
        <Tooltip tooltipContent={disabled ? t("boards.client_360.export_csv_disabled") : label}>
          <span className="inline-flex">
            <IconButton
              variant="secondary"
              size="xl"
              icon={Download}
              aria-label={label}
              disabled={disabled}
              className={cn("shrink-0 rounded-sm", disabled && "opacity-50")}
            />
          </span>
        </Tooltip>
      }
    >
      <div className="border-b border-subtle px-3 py-2 text-11 font-medium tracking-wide text-tertiary uppercase">
        {label}
      </div>
      <CustomMenu.MenuItem className="flex items-center gap-2" onClick={() => exportCsv("visible")}>
        <Download className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />
        <span className="min-w-0 flex-1 truncate">{t("boards.client_360.export_csv_visible")}</span>
      </CustomMenu.MenuItem>
      <CustomMenu.MenuItem className="flex items-center gap-2" onClick={() => exportCsv("all")}>
        <Download className="size-3.5 shrink-0 text-tertiary" strokeWidth={1.75} />
        <span className="min-w-0 flex-1 truncate">{t("boards.client_360.export_csv_all")}</span>
      </CustomMenu.MenuItem>
      {qbrParams ? <Client360QbrExportMenu params={qbrParams} disabled={disabled} variant="menu-items" /> : null}
    </CustomMenu>
  );
}
