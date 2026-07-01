import type { CSSProperties, ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  Ban,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Gauge,
  Headphones,
  Inbox,
} from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Logo } from "@operoz/propel/emoji-icon-picker";
import type { TClient360Client } from "@operoz/types";
import { CustomMenu } from "@operoz/ui";
import { cn } from "@operoz/utils";
import { BoardHubNavLink } from "@/components/board/board-hub-nav-link";
import { useBoardHubNavigate } from "@/components/board/use-board-hub-navigate";
import {
  client360SortStatesEqual,
  getClient360SortOptionsForColumn,
  type Client360SortColumn,
  type Client360SortState,
} from "@/components/board/client-360/client-360-client-sort";
import { Client360ClientHealthWithSparkline } from "@/components/board/client-360/client-360-health-with-sparkline";
import {
  Client360ClientPeople,
  Client360MetaChip,
  Client360ReportProgress,
} from "@/components/board/client-360/client-360-ui";
import { Client360PeriodDelta } from "@/components/board/client-360/client-360-period-delta";
import { reportCoverageLabelKey } from "@/components/board/client-360/client-360-utils";
import {
  CLIENT_360_TABLE_COLUMN_META,
  client360TableMinWidth,
  defaultClient360TableColumns,
  visibleClient360TableColumns,
  type Client360TableColumnConfig,
  type Client360TableColumnId,
} from "@/components/board/client-360/client-360-table-columns";
import type { Client360ViewMode } from "@/components/board/client-360/client-360-view-toggle";
import {
  VirtualClient360Grid,
  VirtualClient360List,
  VirtualClient360Table,
} from "@/components/board/client-360/client-360-virtual-clients-view";
import { shouldClient360Virtualize } from "@/components/board/client-360/client-360-virtual-scroll";
import {
  client360DensityCellClass,
  client360ListRowLogoSize,
  client360ListRowPadding,
  client360TableLogoBoxClass,
  client360TableLogoSize,
  client360TableRowPadding,
  type Client360RowDensity,
} from "@/components/board/client-360/client-360-row-density";

type Props = {
  view: Client360ViewMode;
  clients: TClient360Client[];
  basePath: string;
  sort: Client360SortState;
  onSortChange: (sort: Client360SortState) => void;
  showBoardColumn?: boolean;
  tableColumns?: Client360TableColumnConfig[];
  density?: Client360RowDensity;
  showHealthSparkline?: boolean;
  showHealthScore?: boolean;
  showPeriodCompare?: boolean;
};

export function Client360ClientsView({
  view,
  clients,
  basePath,
  sort,
  onSortChange,
  showBoardColumn = false,
  tableColumns,
  density = "comfortable",
  showHealthSparkline = false,
  showHealthScore = false,
  showPeriodCompare = false,
}: Props) {
  const { t } = useTranslation();

  if (view === "grid") {
    if (shouldClient360Virtualize(clients.length)) {
      return (
        <VirtualClient360Grid
          clients={clients}
          basePath={basePath}
          showBoard={showBoardColumn}
          density={density}
          showHealthSparkline={showHealthSparkline}
          showHealthScore={showHealthScore}
          t={t}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {clients.map((client) => (
          <ClientGridCard
            key={client.project_id}
            client={client}
            href={`${basePath}/${client.project_id}`}
            showBoard={showBoardColumn}
            showHealthSparkline={showHealthSparkline}
            showHealthScore={showHealthScore}
            t={t}
          />
        ))}
      </div>
    );
  }

  if (view === "table") {
    const resolvedColumns =
      tableColumns && tableColumns.length > 0 ? tableColumns : defaultClient360TableColumns(showBoardColumn);

    if (shouldClient360Virtualize(clients.length)) {
      return (
        <VirtualClient360Table
          clients={clients}
          basePath={basePath}
          sort={sort}
          onSortChange={onSortChange}
          tableColumns={resolvedColumns}
          density={density}
          showHealthSparkline={showHealthSparkline}
          showHealthScore={showHealthScore}
          showPeriodCompare={showPeriodCompare}
          t={t}
        />
      );
    }

    return (
      <ClientsTable
        clients={clients}
        basePath={basePath}
        sort={sort}
        onSortChange={onSortChange}
        tableColumns={resolvedColumns}
        density={density}
        showHealthSparkline={showHealthSparkline}
        showHealthScore={showHealthScore}
        showPeriodCompare={showPeriodCompare}
        t={t}
      />
    );
  }

  if (shouldClient360Virtualize(clients.length)) {
    return (
      <VirtualClient360List
        clients={clients}
        basePath={basePath}
        showBoard={showBoardColumn}
        density={density}
        showHealthSparkline={showHealthSparkline}
        showHealthScore={showHealthScore}
        t={t}
      />
    );
  }

  return (
    <ul className="divide-y divide-subtle">
      {clients.map((client) => (
        <ClientListRow
          key={client.project_id}
          client={client}
          href={`${basePath}/${client.project_id}`}
          showBoard={showBoardColumn}
          density={density}
          showHealthSparkline={showHealthSparkline}
          showHealthScore={showHealthScore}
          t={t}
        />
      ))}
    </ul>
  );
}

function ClientsTable({
  clients,
  basePath,
  sort,
  onSortChange,
  tableColumns,
  density,
  showHealthSparkline = false,
  showHealthScore = false,
  showPeriodCompare = false,
  t,
}: {
  clients: TClient360Client[];
  basePath: string;
  sort: Client360SortState;
  onSortChange: (sort: Client360SortState) => void;
  tableColumns: Client360TableColumnConfig[];
  density: Client360RowDensity;
  showHealthSparkline?: boolean;
  showHealthScore?: boolean;
  showPeriodCompare?: boolean;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const visibleColumns = visibleClient360TableColumns(tableColumns);
  const minWidth = client360TableMinWidth(tableColumns);

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed text-left text-13" style={{ minWidth: `${minWidth}px` }}>
        <Client360ClientsTableHeader
          sort={sort}
          onSortChange={onSortChange}
          tableColumns={tableColumns}
          density={density}
          t={t}
        />
        <tbody className="divide-y divide-subtle">
          {clients.map((client) => (
            <ClientTableRow
              key={client.project_id}
              client={client}
              href={`${basePath}/${client.project_id}`}
              visibleColumns={visibleColumns.map((column) => column.id)}
              density={density}
              showHealthSparkline={showHealthSparkline}
              showHealthScore={showHealthScore}
              showPeriodCompare={showPeriodCompare}
              t={t}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Client360ClientsTableHeader({
  sort,
  onSortChange,
  tableColumns,
  density = "comfortable",
  t,
}: {
  sort: Client360SortState;
  onSortChange: (sort: Client360SortState) => void;
  tableColumns: Client360TableColumnConfig[];
  density?: Client360RowDensity;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const visibleColumns = visibleClient360TableColumns(tableColumns);
  const rowPadding = client360TableRowPadding(density);

  return (
    <thead>
      <tr className="border-b border-subtle bg-layer-2 text-11 font-medium tracking-wide text-tertiary uppercase">
        <Client360SortableTh column="name" sort={sort} onSort={onSortChange} className={cn("px-4", rowPadding)} t={t}>
          {t("boards.client_360.col_client")}
        </Client360SortableTh>
        {visibleColumns.map((column) => {
          const meta = CLIENT_360_TABLE_COLUMN_META[column.id];
          if (meta.sortColumn) {
            return (
              <Client360SortableTh
                key={column.id}
                column={meta.sortColumn}
                sort={sort}
                onSort={onSortChange}
                className={client360DensityCellClass(meta.headerClassName ?? "", density)}
                align={meta.align}
                t={t}
              >
                {t(meta.labelKey)}
              </Client360SortableTh>
            );
          }
          return (
            <th key={column.id} className={client360DensityCellClass(meta.headerClassName ?? "", density)}>
              {t(meta.labelKey)}
            </th>
          );
        })}
        <th className={cn("w-10 px-2", rowPadding)} aria-hidden />
      </tr>
    </thead>
  );
}

function Client360SortableTh({
  column,
  sort,
  onSort,
  children,
  className,
  align = "left",
  t,
}: {
  column: Client360SortColumn;
  sort: Client360SortState;
  onSort: (sort: Client360SortState) => void;
  children: ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const active = sort.column === column;
  const SortIcon = sort.direction === "asc" ? ArrowUp : ArrowDown;
  const options = getClient360SortOptionsForColumn(column);

  return (
    <th className={className}>
      <div
        className={cn(
          "inline-flex max-w-full items-center gap-0.5",
          align === "right" && "ml-auto",
          align === "center" && "mx-auto"
        )}
      >
        <span className={cn("truncate", active ? "text-primary" : "text-tertiary")}>{children}</span>
        <CustomMenu
          placement="bottom-start"
          closeOnSelect
          menuItemsClassName="min-w-[200px]"
          customButton={
            <button
              type="button"
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-xs transition-colors hover:bg-layer-transparent-hover hover:text-secondary",
                active ? "text-primary" : "text-tertiary"
              )}
              aria-label={t("boards.client_360.sort_menu_label")}
            >
              {active ? (
                <SortIcon className="size-3 shrink-0" strokeWidth={2} aria-hidden />
              ) : (
                <ChevronDown className="size-3 shrink-0" strokeWidth={2} aria-hidden />
              )}
            </button>
          }
        >
          {options.map((option) => {
            const selected = client360SortStatesEqual(sort, option.state);
            return (
              <CustomMenu.MenuItem
                key={`${option.state.direction}-${option.state.mode ?? "default"}`}
                className="tracking-normal flex items-center gap-2 text-13 normal-case"
                onClick={() => onSort(option.state)}
              >
                <span className={cn("min-w-0 flex-1", selected && "font-medium text-primary")}>
                  {t(option.labelKey)}
                </span>
                {selected ? <Check className="size-3.5 shrink-0 text-accent-primary" strokeWidth={2.5} /> : null}
              </CustomMenu.MenuItem>
            );
          })}
        </CustomMenu>
      </div>
    </th>
  );
}

export function ClientTableRow({
  client,
  href,
  visibleColumns,
  t,
  style,
  density = "comfortable",
  showHealthSparkline = false,
  showHealthScore = false,
  showPeriodCompare = false,
}: {
  client: TClient360Client;
  href: string;
  visibleColumns: Client360TableColumnId[];
  t: ReturnType<typeof useTranslation>["t"];
  style?: CSSProperties;
  density?: Client360RowDensity;
  showHealthSparkline?: boolean;
  showHealthScore?: boolean;
  showPeriodCompare?: boolean;
}) {
  const navigate = useBoardHubNavigate();
  const rowPadding = client360TableRowPadding(density);

  return (
    <tr
      style={style}
      className="group cursor-pointer transition-colors hover:bg-layer-transparent-hover"
      onClick={() => navigate(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(href);
        }
      }}
      tabIndex={0}
      role="link"
    >
      <td className={cn("px-4", rowPadding)}>
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "grid shrink-0 place-items-center rounded-sm border border-subtle bg-layer-2",
              client360TableLogoBoxClass(density)
            )}
          >
            <Logo logo={client.logo_props} size={client360TableLogoSize(density)} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-primary">{client.name}</p>
            <p className="font-mono truncate text-11 text-tertiary">{client.identifier}</p>
          </div>
        </div>
      </td>
      {visibleColumns.map((columnId) => (
        <Client360TableDataCell
          key={columnId}
          columnId={columnId}
          client={client}
          density={density}
          showHealthSparkline={showHealthSparkline}
          showHealthScore={showHealthScore}
          showPeriodCompare={showPeriodCompare}
          t={t}
        />
      ))}
      <td className={cn("px-2", rowPadding)}>
        <ChevronRight className="size-4 text-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
      </td>
    </tr>
  );
}

function Client360TableDataCell({
  columnId,
  client,
  t,
  density = "comfortable",
  showHealthSparkline = false,
  showHealthScore = false,
  showPeriodCompare = false,
}: {
  columnId: Client360TableColumnId;
  client: TClient360Client;
  t: ReturnType<typeof useTranslation>["t"];
  density?: Client360RowDensity;
  showHealthSparkline?: boolean;
  showHealthScore?: boolean;
  showPeriodCompare?: boolean;
}) {
  const meta = CLIENT_360_TABLE_COLUMN_META[columnId];
  const cellClassName = client360DensityCellClass(meta.cellClassName ?? "", density);
  const reportKey = reportCoverageLabelKey(client.status_report.coverage);
  const { modules_total, modules_published } = client.status_report;
  const compare = showPeriodCompare && client.period_compare?.available ? client.period_compare : null;

  switch (columnId) {
    case "board":
      return <td className={cellClassName}>{client.board?.name || "—"}</td>;
    case "health":
      return (
        <td className={cellClassName}>
          <div className="flex flex-col items-start gap-0.5">
            <Client360ClientHealthWithSparkline
              client={client}
              showSparkline={showHealthSparkline}
              showHealthScore={showHealthScore}
            />
            {compare?.health_score_delta != null ? (
              <Client360PeriodDelta delta={compare.health_score_delta} mode="higher_is_better" />
            ) : null}
          </div>
        </td>
      );
    case "report":
      return (
        <td className={cellClassName}>
          <div className="min-w-0">
            <p className="truncate text-12 text-secondary">{t(reportKey)}</p>
            {modules_total > 0 ? (
              <p className="font-mono mt-0.5 text-11 text-tertiary">
                {modules_published}/{modules_total}
              </p>
            ) : null}
            {compare?.report_coverage_delta != null ? (
              <Client360PeriodDelta delta={compare.report_coverage_delta} mode="higher_is_better" className="mt-0.5" />
            ) : null}
          </div>
        </td>
      );
    case "overdue":
      return (
        <td className={cellClassName}>
          <div className="flex flex-col items-start gap-0.5">
            {client.issues.overdue > 0 ? (
              <span className="inline-flex items-center justify-center gap-1 text-danger-primary">
                <Clock className="size-3.5" strokeWidth={1.75} />
                {client.issues.overdue}
              </span>
            ) : (
              <span className="text-tertiary">—</span>
            )}
            {compare?.overdue_delta != null ? (
              <Client360PeriodDelta delta={compare.overdue_delta} mode="lower_is_better" />
            ) : null}
          </div>
        </td>
      );
    case "support":
      return (
        <td className={cellClassName}>
          <div className="flex flex-col items-start gap-0.5">
            {client.support.open_count > 0 ? (
              <span className="inline-flex items-center justify-center gap-1 text-accent-primary">
                <Headphones className="size-3.5" strokeWidth={1.75} />
                {client.support.open_count}
              </span>
            ) : (
              <span className="text-tertiary">—</span>
            )}
            {compare?.support_open_delta != null ? (
              <Client360PeriodDelta delta={compare.support_open_delta} mode="lower_is_better" />
            ) : null}
          </div>
        </td>
      );
    case "intake":
      return (
        <td className={cellClassName}>
          {(client.intake?.pending ?? 0) > 0 ? (
            <span className="inline-flex items-center justify-center gap-1 text-warning-primary">
              <Inbox className="size-3.5" strokeWidth={1.75} />
              {client.intake?.pending}
            </span>
          ) : (
            <span className="text-tertiary">—</span>
          )}
        </td>
      );
    case "blockers":
      return (
        <td className={cellClassName}>
          {(client.blockers?.count ?? 0) > 0 ? (
            <span className="inline-flex items-center justify-center gap-1 text-danger-primary">
              <Ban className="size-3.5" strokeWidth={1.75} />
              {client.blockers?.count}
            </span>
          ) : (
            <span className="text-tertiary">—</span>
          )}
        </td>
      );
    case "throughput":
      return (
        <td className={cellClassName}>
          {(client.delivery?.throughput ?? 0) > 0 ? (
            <span className="inline-flex items-center justify-center gap-1 text-secondary">
              <Gauge className="size-3.5" strokeWidth={1.75} />
              {client.delivery?.throughput}
            </span>
          ) : (
            <span className="text-tertiary">—</span>
          )}
        </td>
      );
    case "utilization":
      return (
        <td className={cellClassName}>
          {client.finops?.utilization?.pct != null ? (
            <span className={client.finops.utilization.over_allocated ? "text-danger-primary" : "text-secondary"}>
              {client.finops.utilization.pct}%
            </span>
          ) : (
            <span className="text-tertiary">—</span>
          )}
        </td>
      );
    case "margin":
      return (
        <td className={cellClassName}>
          {client.finops?.margin_pct != null ? (
            <span className={client.finops.margin_pct < 15 ? "text-danger-primary" : "text-secondary"}>
              {client.finops.margin_pct}%
            </span>
          ) : (
            <span className="text-tertiary">—</span>
          )}
        </td>
      );
    case "stakeholder":
      return <td className={cellClassName}>{client.responsible_stakeholder || "—"}</td>;
    case "responsible":
      return <td className={cellClassName}>{client.project_lead?.display_name || "—"}</td>;
  }
}

export function ClientGridCard({
  client,
  href,
  showBoard,
  showHealthSparkline = false,
  showHealthScore = false,
  t,
}: {
  client: TClient360Client;
  href: string;
  showBoard?: boolean;
  showHealthSparkline?: boolean;
  showHealthScore?: boolean;
  t: ReturnType<typeof useTranslation>["t"];
}) {
  const reportKey = reportCoverageLabelKey(client.status_report.coverage);
  const { modules_total, modules_published } = client.status_report;

  return (
    <BoardHubNavLink
      to={href}
      className="group flex h-full flex-col rounded-md border border-subtle bg-layer-1 p-3 text-left transition-colors hover:border-strong hover:bg-layer-transparent-hover"
    >
      <div className="flex items-start gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-sm border border-subtle bg-layer-2">
          <Logo logo={client.logo_props} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-13 leading-snug font-semibold text-primary">{client.name}</p>
          <p className="font-mono mt-0.5 truncate text-10 text-tertiary">{client.identifier}</p>
          {showBoard && client.board ? (
            <p className="mt-0.5 truncate text-11 text-tertiary">{client.board.name}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-2.5">
        <Client360ClientHealthWithSparkline
          client={client}
          showSparkline={showHealthSparkline}
          showHealthScore={showHealthScore}
        />
      </div>
      {modules_total > 0 && (
        <div className="mt-3">
          <Client360ReportProgress published={modules_published} total={modules_total} label={t(reportKey)} />
        </div>
      )}
      <Client360ClientPeople
        className="mt-2.5"
        compact
        stakeholder={client.responsible_stakeholder}
        responsibleName={client.project_lead?.display_name}
        stakeholderLabel={t("boards.client_360.stakeholder")}
        responsibleLabel={t("boards.client_360.responsible")}
      />
      <div className="mt-3 flex flex-wrap gap-2 border-t border-subtle pt-2.5">
        {modules_total === 0 && (
          <Client360MetaChip icon={FileText} tone="info">
            {t(reportKey)}
          </Client360MetaChip>
        )}
        {client.issues.overdue > 0 && (
          <Client360MetaChip icon={Clock} tone="danger">
            {client.issues.overdue}
          </Client360MetaChip>
        )}
        {client.support.open_count > 0 && (
          <Client360MetaChip icon={Headphones} tone="info">
            {client.support.open_count}
          </Client360MetaChip>
        )}
      </div>
    </BoardHubNavLink>
  );
}

export function ClientListRow({
  client,
  href,
  showBoard,
  t,
  unwrapped = false,
  density = "comfortable",
  showHealthSparkline = false,
  showHealthScore = false,
}: {
  client: TClient360Client;
  href: string;
  showBoard?: boolean;
  t: ReturnType<typeof useTranslation>["t"];
  unwrapped?: boolean;
  density?: Client360RowDensity;
  showHealthSparkline?: boolean;
  showHealthScore?: boolean;
}) {
  const reportKey = reportCoverageLabelKey(client.status_report.coverage);
  const { modules_total, modules_published } = client.status_report;

  const row = (
    <BoardHubNavLink
      to={href}
      className={cn(
        "group flex items-start gap-4 px-4 text-left transition-colors hover:bg-layer-transparent-hover",
        client360ListRowPadding(density)
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-md border border-subtle bg-layer-2">
        <Logo logo={client.logo_props} size={client360ListRowLogoSize(density)} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-13 font-semibold text-primary">{client.name}</p>
          <Client360ClientHealthWithSparkline
            client={client}
            showSparkline={showHealthSparkline}
            showHealthScore={showHealthScore}
          />
        </div>
        <p className="font-mono mt-0.5 text-11 text-tertiary">{client.identifier}</p>
        {showBoard && client.board ? (
          <p className="mt-0.5 truncate text-11 text-tertiary">{client.board.name}</p>
        ) : null}
        <Client360ClientPeople
          className="mt-1.5"
          compact
          stakeholder={client.responsible_stakeholder}
          responsibleName={client.project_lead?.display_name}
          stakeholderLabel={t("boards.client_360.stakeholder")}
          responsibleLabel={t("boards.client_360.responsible")}
        />
        {modules_total > 0 && (
          <Client360ReportProgress published={modules_published} total={modules_total} label={t(reportKey)} />
        )}
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
          {modules_total === 0 && (
            <Client360MetaChip icon={FileText} tone="info">
              {t(reportKey)}
            </Client360MetaChip>
          )}
          {client.issues.overdue > 0 && (
            <Client360MetaChip icon={Clock} tone="danger">
              {t("boards.client_360.overdue_count", { count: client.issues.overdue })}
            </Client360MetaChip>
          )}
          {client.support.open_count > 0 && (
            <Client360MetaChip icon={Headphones} tone="info">
              {t("boards.client_360.support_count", { count: client.support.open_count })}
            </Client360MetaChip>
          )}
        </div>
      </div>
      <ChevronRight className="mt-1 size-4 shrink-0 text-tertiary group-hover:text-secondary" strokeWidth={1.75} />
    </BoardHubNavLink>
  );

  if (unwrapped) return row;

  return <li>{row}</li>;
}
