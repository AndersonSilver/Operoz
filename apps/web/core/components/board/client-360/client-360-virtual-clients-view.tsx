import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { useTranslation } from "@operis/i18n";
import type { TClient360Client } from "@operis/types";
import type { Client360SortState } from "@/components/board/client-360/client-360-client-sort";
import {
  Client360ClientsTableHeader,
  ClientGridCard,
  ClientListRow,
  ClientTableRow,
} from "@/components/board/client-360/client-360-clients-view";
import {
  client360GridRowClients,
  client360GridRowCount,
  CLIENT_360_VIRTUAL_OVERSCAN,
  CLIENT_360_VIRTUAL_SCROLL_MAX_HEIGHT,
} from "@/components/board/client-360/client-360-virtual-scroll";
import {
  client360VirtualRowHeight,
  type Client360RowDensity,
} from "@/components/board/client-360/client-360-row-density";
import {
  client360TableMinWidth,
  visibleClient360TableColumns,
  type Client360TableColumnConfig,
} from "@/components/board/client-360/client-360-table-columns";
import { useClient360GridColumns } from "@/components/board/client-360/use-client-360-grid-columns";

type TFn = ReturnType<typeof useTranslation>["t"];

type VirtualScrollProps = {
  clients: TClient360Client[];
  basePath: string;
  showBoard?: boolean;
  density?: Client360RowDensity;
  showHealthSparkline?: boolean;
  showHealthScore?: boolean;
  t: TFn;
};

export function VirtualClient360List({
  clients,
  basePath,
  showBoard,
  density = "comfortable",
  showHealthSparkline = false,
  showHealthScore = false,
  t,
}: VirtualScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: clients.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => client360VirtualRowHeight(density, "list"),
    overscan: CLIENT_360_VIRTUAL_OVERSCAN.list,
  });

  return (
    <div
      ref={scrollRef}
      className="overflow-auto"
      style={{ maxHeight: CLIENT_360_VIRTUAL_SCROLL_MAX_HEIGHT }}
      aria-label={t("boards.client_360.virtual_scroll_list_label", { count: clients.length })}
    >
      <ul className="relative divide-y divide-subtle" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const client = clients[virtualRow.index];
          if (!client) return null;

          return (
            <li
              key={client.project_id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              <ClientListRow
                client={client}
                href={`${basePath}/${client.project_id}`}
                showBoard={showBoard}
                density={density}
                showHealthSparkline={showHealthSparkline}
                showHealthScore={showHealthScore}
                t={t}
                unwrapped
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function VirtualClient360Grid({
  clients,
  basePath,
  showBoard,
  density = "comfortable",
  showHealthSparkline = false,
  showHealthScore = false,
  t,
}: VirtualScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const columns = useClient360GridColumns();
  const rowCount = client360GridRowCount(clients.length, columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => client360VirtualRowHeight(density, "grid"),
    overscan: CLIENT_360_VIRTUAL_OVERSCAN.grid,
  });

  const gridClassName =
    columns === 4
      ? "grid grid-cols-4 gap-3"
      : columns === 3
        ? "grid grid-cols-3 gap-3"
        : columns === 2
          ? "grid grid-cols-2 gap-3"
          : "grid grid-cols-1 gap-3";

  return (
    <div
      ref={scrollRef}
      className="overflow-auto p-4"
      style={{ maxHeight: CLIENT_360_VIRTUAL_SCROLL_MAX_HEIGHT }}
      aria-label={t("boards.client_360.virtual_scroll_grid_label", { count: clients.length })}
    >
      <div className="relative" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const rowClients = client360GridRowClients(clients, virtualRow.index, columns);

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className={`absolute top-0 left-0 w-full ${gridClassName}`}
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              {rowClients.map((client) => (
                <ClientGridCard
                  key={client.project_id}
                  client={client}
                  href={`${basePath}/${client.project_id}`}
                  showBoard={showBoard}
                  showHealthSparkline={showHealthSparkline}
                  showHealthScore={showHealthScore}
                  t={t}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

type VirtualTableProps = {
  clients: TClient360Client[];
  basePath: string;
  sort: Client360SortState;
  onSortChange: (sort: Client360SortState) => void;
  tableColumns: Client360TableColumnConfig[];
  density?: Client360RowDensity;
  showHealthSparkline?: boolean;
  showHealthScore?: boolean;
  showPeriodCompare?: boolean;
  t: TFn;
};

export function VirtualClient360Table({
  clients,
  basePath,
  sort,
  onSortChange,
  tableColumns,
  density = "comfortable",
  showHealthSparkline = false,
  showHealthScore = false,
  showPeriodCompare = false,
  t,
}: VirtualTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const visibleColumns = visibleClient360TableColumns(tableColumns);
  const visibleColumnIds = visibleColumns.map((column) => column.id);
  const minWidth = client360TableMinWidth(tableColumns);

  const virtualizer = useVirtualizer({
    count: clients.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => client360VirtualRowHeight(density, "table"),
    overscan: CLIENT_360_VIRTUAL_OVERSCAN.table,
  });

  return (
    <div
      ref={scrollRef}
      className="overflow-auto"
      style={{ maxHeight: CLIENT_360_VIRTUAL_SCROLL_MAX_HEIGHT }}
      aria-label={t("boards.client_360.virtual_scroll_table_label", { count: clients.length })}
    >
      <table className="w-full table-fixed text-left text-13" style={{ minWidth: `${minWidth}px` }}>
        <Client360ClientsTableHeader
          sort={sort}
          onSortChange={onSortChange}
          tableColumns={tableColumns}
          density={density}
          t={t}
        />
      </table>
      <div className="relative" style={{ height: `${virtualizer.getTotalSize()}px`, minWidth: `${minWidth}px` }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const client = clients[virtualRow.index];
          if (!client) return null;

          return (
            <div
              key={client.project_id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute top-0 left-0 w-full border-b border-subtle"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              <table className="w-full table-fixed text-left text-13" style={{ minWidth: `${minWidth}px` }}>
                <tbody>
                  <ClientTableRow
                    client={client}
                    href={`${basePath}/${client.project_id}`}
                    visibleColumns={visibleColumnIds}
                    density={density}
                    showHealthSparkline={showHealthSparkline}
                    showHealthScore={showHealthScore}
                    showPeriodCompare={showPeriodCompare}
                    t={t}
                  />
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
