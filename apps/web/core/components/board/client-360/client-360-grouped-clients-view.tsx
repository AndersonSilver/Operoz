import { useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import type { TClient360Client } from "@operoz/types";
import { cn } from "@operoz/utils";
import {
  groupClient360ByBoard,
  type Client360BoardGroup,
} from "@/components/board/client-360/client-360-board-grouping";
import { Client360ClientsView } from "@/components/board/client-360/client-360-clients-view";
import type { Client360SortState } from "@/components/board/client-360/client-360-client-sort";
import type { Client360TableColumnConfig } from "@/components/board/client-360/client-360-table-columns";
import type { Client360RowDensity } from "@/components/board/client-360/client-360-row-density";
import type { Client360ViewMode } from "@/components/board/client-360/client-360-view-toggle";

type Props = {
  clients: TClient360Client[];
  view: Client360ViewMode;
  basePath: string;
  sort: Client360SortState;
  onSortChange: (sort: Client360SortState) => void;
  isCollapsed: (boardId: string) => boolean;
  onToggleGroup: (boardId: string) => void;
  tableColumns: Client360TableColumnConfig[];
  density?: Client360RowDensity;
  showHealthSparkline?: boolean;
  showHealthScore?: boolean;
  showPeriodCompare?: boolean;
};

function Client360BoardGroupHeader({
  group,
  collapsed,
  onToggle,
}: {
  group: Client360BoardGroup;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const Chevron = collapsed ? ChevronRight : ChevronDown;

  return (
    <button
      type="button"
      onClick={onToggle}
      className="sticky top-0 z-[1] flex w-full items-center gap-3 border-b border-subtle bg-layer-1 px-4 py-2.5 text-left transition-colors hover:bg-layer-2"
    >
      <Chevron className="size-4 shrink-0 text-tertiary" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-13 font-semibold text-primary">{group.boardName}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-11 text-tertiary">
          <span>{t("boards.client_360.group_clients_count", { count: group.stats.total })}</span>
          {group.stats.critical > 0 ? (
            <span className="text-danger-primary">
              {t("boards.client_360.group_critical_count", { count: group.stats.critical })}
            </span>
          ) : null}
          {group.stats.overdue > 0 ? (
            <span className="text-warning-primary">
              {t("boards.client_360.group_overdue_count", { count: group.stats.overdue })}
            </span>
          ) : null}
        </p>
      </div>
    </button>
  );
}

export function Client360GroupedClientsView({
  clients,
  view,
  basePath,
  sort,
  onSortChange,
  isCollapsed,
  onToggleGroup,
  tableColumns,
  density = "comfortable",
  showHealthSparkline = false,
  showHealthScore = false,
  showPeriodCompare = false,
}: Props) {
  const groups = useMemo(() => groupClient360ByBoard(clients), [clients]);

  if (groups.length === 0) return null;

  return (
    <div className="divide-y divide-subtle">
      {groups.map((group) => {
        const collapsed = isCollapsed(group.boardId);
        return (
          <section key={group.boardId} className={cn(!collapsed && view === "grid" && "pb-1")}>
            <Client360BoardGroupHeader
              group={group}
              collapsed={collapsed}
              onToggle={() => onToggleGroup(group.boardId)}
            />
            {!collapsed ? (
              <Client360ClientsView
                view={view}
                clients={group.clients}
                basePath={basePath}
                sort={sort}
                onSortChange={onSortChange}
                showBoardColumn={false}
                tableColumns={tableColumns}
                density={density}
                showHealthSparkline={showHealthSparkline}
                showHealthScore={showHealthScore}
                showPeriodCompare={showPeriodCompare}
              />
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
