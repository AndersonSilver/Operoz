import { useMemo, useState } from "react";
import useSWR from "swr";
import { Building2, Search, Users } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import type { IBoard } from "@operis/types";
import {
  filterClient360Clients,
  searchClient360Clients,
  type Client360FilterKey,
} from "@/components/board/client-360/client-360-client-filters";
import {
  loadClient360Sort,
  saveClient360Sort,
  sortClient360Clients,
  type Client360SortState,
} from "@/components/board/client-360/client-360-client-sort";
import { Client360OverviewModalTrigger } from "@/components/board/client-360/client-360-overview-modal";
import { Client360ClientsView } from "@/components/board/client-360/client-360-clients-view";
import { Client360WeekNav } from "@/components/board/client-360/client-360-week-nav";
import {
  Client360ViewToggle,
  loadClient360ViewMode,
  saveClient360ViewMode,
  type Client360ViewMode,
} from "@/components/board/client-360/client-360-view-toggle";
import {
  Client360FilterMenu,
  Client360PageShell,
  Client360PageTitle,
  Client360Section,
} from "@/components/board/client-360/client-360-ui";
import {
  CLIENT_360_SWR_CONFIG,
  defaultWeekPeriod,
} from "@/components/board/client-360/client-360-utils";
import { BoardService } from "@/services/board/board.service";

type Props = {
  workspaceSlug: string;
  board: IBoard;
};

const boardService = new BoardService();

export function BoardClient360List({ workspaceSlug, board }: Props) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState(() => defaultWeekPeriod());
  const [filter, setFilter] = useState<Client360FilterKey>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<Client360ViewMode>(() => loadClient360ViewMode(board.slug));
  const [sort, setSort] = useState<Client360SortState>(() => loadClient360Sort(board.slug));

  const handleViewChange = (next: Client360ViewMode) => {
    setView(next);
    saveClient360ViewMode(board.slug, next);
  };

  const handleSortChange = (next: Client360SortState) => {
    setSort(next);
    saveClient360Sort(board.slug, next);
  };

  const { data, error, isLoading } = useSWR(
    workspaceSlug && board.slug
      ? `CLIENT_360_${workspaceSlug}_${board.slug}_${period.start}_${period.end}`
      : null,
    () =>
      boardService.getClient360(workspaceSlug, board.slug, {
        period_start: period.start,
        period_end: period.end,
      }),
    CLIENT_360_SWR_CONFIG
  );

  const showInitialLoading = isLoading && !data && !error;

  const clients = useMemo(() => {
    const list = searchClient360Clients(filterClient360Clients(data?.clients ?? [], filter), search);
    return sortClient360Clients(list, sort);
  }, [data?.clients, filter, search, sort]);

  const basePath = `/${workspaceSlug}/boards/${board.slug}/clientes`;

  return (
    <Client360PageShell
      header={
        <>
          <Client360PageTitle
            icon={Users}
            title={t("boards.client_360.title")}
            subtitle={t("boards.client_360.subtitle")}
            trailing={<Client360WeekNav period={period} onPeriodChange={setPeriod} />}
          />
        </>
      }
    >
      <Client360Section
        icon={Building2}
        iconTone="neutral"
        title={t("boards.client_360.clients_list_title")}
        description={
          clients.length > 0
            ? t("boards.client_360.clients_list_count", { count: clients.length })
            : undefined
        }
        action={
          <div className="flex items-center gap-2">
            <div className="relative w-[200px] max-w-[40vw] shrink-0">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-tertiary"
                strokeWidth={1.75}
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("boards.client_360.search_placeholder")}
                className="h-8 w-full rounded-sm border border-subtle bg-layer-2 py-1.5 pl-8 pr-3 text-13 text-primary placeholder:text-tertiary focus:border-strong focus:outline-none"
              />
            </div>
            {data?.summary ? (
              <Client360OverviewModalTrigger
                summary={data.summary}
                clients={data.clients}
                disabled={showInitialLoading}
              />
            ) : null}
            <Client360FilterMenu filter={filter} onFilterChange={setFilter} />
            <Client360ViewToggle view={view} onChange={handleViewChange} />
          </div>
        }
        noPadding
      >
        {error ? (
          <p className="px-4 py-8 text-center text-13 text-tertiary">{t("boards.client_360.load_error")}</p>
        ) : showInitialLoading ? (
          <p className="px-4 py-8 text-center text-13 text-tertiary">{t("boards.client_360.loading")}</p>
        ) : clients.length === 0 ? (
          <p className="px-4 py-8 text-center text-13 text-tertiary">{t("boards.client_360.empty")}</p>
        ) : (
          <Client360ClientsView
            view={view}
            clients={clients}
            basePath={basePath}
            sort={sort}
            onSortChange={handleSortChange}
          />
        )}
      </Client360Section>
    </Client360PageShell>
  );
}
