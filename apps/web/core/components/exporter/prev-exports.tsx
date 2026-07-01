import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR, { mutate } from "swr";
import { MoveLeft, MoveRight, RefreshCw } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { EmptyStateCompact } from "@operoz/propel/empty-state";
import type { IExportData } from "@operoz/types";
import { Table } from "@operoz/ui";
import { ImportExportSettingsLoader } from "@/components/ui/loader/settings/import-and-export";
import { EXPORT_SERVICES_LIST } from "@/constants/fetch-keys";
import { IntegrationService } from "@/services/integrations";
import { useExportColumns } from "./column";
import "./workspace-exports-settings.css";

const integrationService = new IntegrationService();

type Props = {
  workspaceSlug: string;
  cursor: string | undefined;
  per_page: number;
  setCursor: (cursor: string) => void;
};
type RowData = IExportData;

export const PrevExports = observer(function PrevExports(props: Props) {
  const { workspaceSlug, cursor, per_page, setCursor } = props;
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useTranslation();
  const columns = useExportColumns();

  const { data: exporterServices } = useSWR(
    workspaceSlug && cursor ? EXPORT_SERVICES_LIST(workspaceSlug, cursor, `${per_page}`) : null,
    workspaceSlug && cursor ? () => integrationService.getExportsServicesList(workspaceSlug, cursor, per_page) : null
  );

  const handleRefresh = () => {
    setRefreshing(true);
    mutate(EXPORT_SERVICES_LIST(workspaceSlug, `${cursor}`, `${per_page}`)).then(() => setRefreshing(false));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (exporterServices?.results?.some((service) => service.status === "processing")) {
        handleRefresh();
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [exporterServices]);

  const hasResults = !!exporterServices?.results?.length;

  return (
    <section className="workspace-exports-history-panel overflow-hidden rounded-xl border border-subtle bg-layer-1">
      <div className="flex flex-col gap-3 border-b border-subtle px-5 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-6">
        <div className="min-w-0">
          <h3 className="text-13 font-semibold text-primary">
            {t("workspace_settings.settings.exports.previous_exports")}
          </h3>
          <p className="mt-0.5 text-12 text-tertiary">
            {t("workspace_settings.settings.exports.previous_exports_hint")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="workspace-exports-refresh-btn" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`size-3 ${refreshing ? "animate-spin" : ""}`} strokeWidth={1.75} />
            {refreshing ? t("refreshing") : t("refresh_status")}
          </button>

          {hasResults && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={!exporterServices?.prev_page_results}
                onClick={() => exporterServices?.prev_page_results && setCursor(exporterServices?.prev_cursor)}
                prependIcon={<MoveLeft />}
              >
                {t("prev")}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!exporterServices?.next_page_results}
                onClick={() => exporterServices?.next_page_results && setCursor(exporterServices?.next_cursor)}
                appendIcon={<MoveRight />}
              >
                {t("next")}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        {exporterServices && exporterServices?.results ? (
          exporterServices?.results?.length > 0 ? (
            <div className="divide-y divide-subtle-1 overflow-x-auto">
              <Table
                columns={columns}
                data={exporterServices?.results ?? []}
                keyExtractor={(rowData: RowData) => rowData?.id ?? ""}
                tHeadClassName="border-b border-subtle bg-layer-2/40"
                thClassName="text-left font-medium divide-x-0 text-placeholder text-11 uppercase tracking-wide"
                tBodyClassName="divide-y-0"
                tBodyTrClassName="divide-x-0 px-4 h-[44px] text-secondary hover:bg-layer-1-hover/50"
                tHeadTrClassName="divide-x-0"
              />
            </div>
          ) : (
            <div className="flex w-full items-center justify-center px-4 py-12">
              <EmptyStateCompact
                assetKey="export"
                title={t("settings_empty_state.exports.title")}
                description={t("settings_empty_state.exports.description")}
                align="center"
                rootClassName="py-8"
              />
            </div>
          )
        ) : (
          <ImportExportSettingsLoader />
        )}
      </div>
    </section>
  );
});
