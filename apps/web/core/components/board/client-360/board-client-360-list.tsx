import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, Users } from "lucide-react";
import { EUserPermissionsLevel } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { EUserWorkspaceRoles } from "@operis/types";
import { Client360EmptyState } from "@/components/board/client-360/client-360-empty-state";
import { resolveClient360EmptyScenario } from "@/components/board/client-360/client-360-empty-state.utils";
import type { IBoard } from "@operis/types";
import {
  filterClient360Clients,
  searchClient360Clients,
  parseClient360FilterParam,
  CLIENT_360_FILTER_PARAM,
  type Client360FilterKey,
} from "@/components/board/client-360/client-360-client-filters";
import {
  loadClient360Sort,
  saveClient360Sort,
  sortClient360Clients,
  type Client360SortState,
} from "@/components/board/client-360/client-360-client-sort";
import { Client360PersonaToggle } from "@/components/board/client-360/client-360-persona-toggle";
import { tableColumnsForPersona } from "@/components/board/client-360/client-360-persona-columns";
import { useClient360Persona, type Client360Persona } from "@/components/board/client-360/use-client-360-persona";
import { useClient360TableColumns } from "@/components/board/client-360/use-client-360-table-columns";
import { useClient360CompactTableView } from "@/components/board/client-360/use-client-360-compact-table-view";
import { Client360PortfolioKpiStrip } from "@/components/board/client-360/client-360-portfolio-kpi-strip";
import { Client360PortfolioPulse } from "@/components/board/client-360/client-360-portfolio-pulse";
import {
  Client360DetailTabList,
  Client360DetailTabPanel,
  Client360DetailTabTrigger,
  Client360DetailTabs,
} from "@/components/board/client-360/client-360-detail-tabs";
import { Client360ClientsView } from "@/components/board/client-360/client-360-clients-view";
import { Client360MatrixView } from "@/components/board/client-360/client-360-matrix-view";
import { useClient360MatrixCsvExport } from "@/components/board/client-360/use-client-360-matrix-csv-export";
import { Client360WeekNav } from "@/components/board/client-360/client-360-week-nav";
import { useClient360PeriodCompare } from "@/components/board/client-360/client-360-period-compare-toggle";
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
  Client360SearchInput,
  Client360Section,
} from "@/components/board/client-360/client-360-ui";
import { CLIENT_360_SWR_CONFIG, defaultWeekPeriod } from "@/components/board/client-360/client-360-utils";
import { BoardService } from "@/services/board/board.service";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUserPermissions } from "@/hooks/store/user";

type Props = {
  workspaceSlug: string;
  board: IBoard;
};

const boardService = new BoardService();

export function BoardClient360List({ workspaceSlug, board }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toggleCreateProjectModal } = useCommandPalette();
  const { allowPermissions } = useUserPermissions();
  const canManageWorkspace = allowPermissions(
    [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const isGuest = !canManageWorkspace;
  const [period, setPeriod] = useState(() => defaultWeekPeriod());
  const [filter, setFilter] = useState<Client360FilterKey>(() =>
    parseClient360FilterParam(searchParams.get(CLIENT_360_FILTER_PARAM))
  );
  const [search, setSearch] = useState("");
  const [view, setView] = useState<Client360ViewMode>(() => loadClient360ViewMode(board.slug));
  const [sort, setSort] = useState<Client360SortState>(() => loadClient360Sort(board.slug));
  const [matrixPage, setMatrixPage] = useState(1);
  const { persona, setPersona } = useClient360Persona(board.slug);
  const { enabled: periodCompareEnabled, setEnabled: setPeriodCompareEnabled } = useClient360PeriodCompare(board.slug);

  const handleViewChange = (next: Client360ViewMode) => {
    setView(next);
    saveClient360ViewMode(board.slug, next);
    if (next === "matrix") {
      setMatrixPage(1);
    }
  };

  const handlePersonaChange = useCallback(
    (next: Client360Persona) => {
      setPersona(next);
      if (view !== "table") {
        handleViewChange("table");
      }
    },
    [setPersona, view]
  );

  const handleSortChange = (next: Client360SortState) => {
    setSort(next);
    saveClient360Sort(board.slug, next);
  };

  const { data, error, isLoading } = useSWR(
    workspaceSlug && board.slug
      ? `CLIENT_360_${workspaceSlug}_${board.slug}_${period.start}_${period.end}_${periodCompareEnabled ? "cmp" : "base"}`
      : null,
    () =>
      boardService.getClient360(workspaceSlug, board.slug, {
        period_start: period.start,
        period_end: period.end,
        compare: periodCompareEnabled,
      }),
    CLIENT_360_SWR_CONFIG
  );

  const {
    data: matrixData,
    error: matrixError,
    isLoading: matrixLoading,
  } = useSWR(
    view === "matrix" && workspaceSlug && board.slug
      ? `CLIENT_360_MATRIX_${workspaceSlug}_${board.slug}_${period.start}_${period.end}_${matrixPage}`
      : null,
    () =>
      boardService.getClient360Matrix(workspaceSlug, board.slug, {
        period_start: period.start,
        period_end: period.end,
        weeks: 8,
        page: matrixPage,
        page_size: 50,
      }),
    CLIENT_360_SWR_CONFIG
  );

  useEffect(() => {
    setMatrixPage(1);
  }, [period.start, period.end]);

  const periodCompareAvailable = data?.period_compare?.available ?? !periodCompareEnabled;
  const showPeriodCompare = periodCompareEnabled && (data?.period_compare?.available ?? false);

  useEffect(() => {
    if (periodCompareEnabled && data?.period_compare && !data.period_compare.available) {
      setPeriodCompareEnabled(false);
    }
  }, [data?.period_compare, periodCompareEnabled, setPeriodCompareEnabled]);

  useEffect(() => {
    setFilter(parseClient360FilterParam(searchParams.get(CLIENT_360_FILTER_PARAM)));
  }, [searchParams]);

  const matrixCsvExport = useClient360MatrixCsvExport({
    scope: { kind: "board", workspaceSlug, boardSlug: board.slug },
    periodStart: period.start,
    periodEnd: period.end,
    weeks: 8,
    delimiter: "semicolon",
  });

  const showInitialLoading = isLoading && !data && !error;
  const allClients = data?.clients ?? [];
  const healthScoreEnabled = data?.display?.health_score_enabled ?? false;

  const clients = useMemo(() => {
    const list = searchClient360Clients(filterClient360Clients(allClients, filter), search);
    return sortClient360Clients(list, sort);
  }, [allClients, filter, search, sort]);

  const hasActiveFilters = filter !== "all" || search.trim().length > 0;

  const emptyScenario = useMemo(
    () =>
      view === "matrix" || showInitialLoading
        ? null
        : resolveClient360EmptyScenario({
            error,
            allClientsCount: allClients.length,
            filteredClientsCount: clients.length,
            hasActiveFilters,
            isGuest,
          }),
    [allClients.length, clients.length, error, hasActiveFilters, isGuest, showInitialLoading, view]
  );

  const basePath = `/${workspaceSlug}/boards/${board.slug}/clientes`;

  const {
    columns: tableColumns,
    visibleColumns,
    hasCustomColumns,
    toggleColumn,
    moveColumn,
    resetColumns,
    applyColumns,
  } = useClient360TableColumns(board.slug, false);

  useEffect(() => {
    applyColumns(tableColumnsForPersona(persona, false), false);
  }, [persona, applyColumns]);

  const effectiveView = useClient360CompactTableView(view, visibleColumns.length);

  return (
    <Client360PageShell
      header={
        <>
          <Client360PageTitle
            icon={Users}
            title={t("boards.client_360.title")}
            subtitle={t("boards.client_360.subtitle")}
            trailing={
              <Client360WeekNav
                period={period}
                onPeriodChange={setPeriod}
                compareEnabled={periodCompareEnabled}
                onCompareChange={setPeriodCompareEnabled}
                compareAvailable={periodCompareAvailable}
              />
            }
          />
        </>
      }
    >
      {data?.summary && data.clients && allClients.length > 0 ? (
        <>
          <Client360PortfolioKpiStrip summary={data.summary} onFilterChange={setFilter} />

          <Client360DetailTabs defaultValue="pulse">
            <Client360DetailTabList>
              <Client360DetailTabTrigger value="pulse">
                {t("boards.client_360.detail_tab_pulse")}
              </Client360DetailTabTrigger>
              <Client360DetailTabTrigger value="clients">
                {t("boards.client_360.detail_tab_clients")}
              </Client360DetailTabTrigger>
            </Client360DetailTabList>

            <Client360DetailTabPanel value="pulse">
              <Client360PortfolioPulse
                summary={data.summary}
                clients={data.clients}
                basePath={basePath}
                onFilterChange={setFilter}
                summaryDelta={showPeriodCompare ? data.period_compare?.summary_delta : undefined}
                showPeriodCompare={showPeriodCompare}
              />
            </Client360DetailTabPanel>

            <Client360DetailTabPanel value="clients">
              <Client360Section
                icon={Building2}
                iconTone="neutral"
                title={t("boards.client_360.clients_list_title")}
                description={
                  clients.length > 0 ? t("boards.client_360.clients_list_count", { count: clients.length }) : undefined
                }
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    <Client360SearchInput
                      value={search}
                      onChange={setSearch}
                      placeholder={t("boards.client_360.search_placeholder")}
                    />
                    <Client360PersonaToggle persona={persona} onChange={handlePersonaChange} />
                    <Client360FilterMenu filter={filter} onFilterChange={setFilter} />
                    {view === "table" ? (
                      <Client360TableColumnsMenu
                        columns={tableColumns}
                        hasCustomColumns={hasCustomColumns}
                        onToggleColumn={toggleColumn}
                        onMoveColumn={moveColumn}
                        onResetColumns={resetColumns}
                      />
                    ) : null}
                    <Client360ViewToggle view={view} onChange={handleViewChange} />
                  </div>
                }
                noPadding
              >
                {view === "matrix" ? (
                  matrixError && !matrixData ? (
                    <p className="px-4 py-8 text-center text-13 text-danger-primary">
                      {t("boards.client_360.load_error")}
                    </p>
                  ) : (
                    <Client360MatrixView
                      clients={matrixData?.clients ?? []}
                      weeks={matrixData?.weeks ?? []}
                      basePath={basePath}
                      pagination={
                        matrixData?.pagination ?? {
                          page: matrixPage,
                          page_size: 50,
                          total: 0,
                          total_pages: 1,
                        }
                      }
                      onPageChange={setMatrixPage}
                      isLoading={matrixLoading}
                      onExportCsv={() => void matrixCsvExport.exportCsv()}
                      exportingCsv={matrixCsvExport.exporting}
                    />
                  )
                ) : showInitialLoading ? (
                  <p className="px-4 py-8 text-center text-13 text-tertiary">{t("boards.client_360.loading")}</p>
                ) : emptyScenario ? (
                  <Client360EmptyState
                    scenario={emptyScenario}
                    canCreateProject={canManageWorkspace}
                    onCreateProject={() => toggleCreateProjectModal(true)}
                    onClearFilters={() => {
                      setFilter("all");
                      setSearch("");
                    }}
                    onGoToProjects={() => router.push(`/${workspaceSlug}/projects`)}
                    onGoToBoards={() => router.push(`/${workspaceSlug}/settings/boards`)}
                  />
                ) : (
                  <Client360ClientsView
                    view={effectiveView}
                    clients={clients}
                    basePath={basePath}
                    sort={sort}
                    onSortChange={handleSortChange}
                    tableColumns={tableColumns}
                    showHealthScore={healthScoreEnabled}
                    showPeriodCompare={showPeriodCompare}
                  />
                )}
              </Client360Section>
            </Client360DetailTabPanel>
          </Client360DetailTabs>
        </>
      ) : (
        <Client360Section
          icon={Building2}
          iconTone="neutral"
          title={t("boards.client_360.clients_list_title")}
          description={
            clients.length > 0 ? t("boards.client_360.clients_list_count", { count: clients.length }) : undefined
          }
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Client360SearchInput
                value={search}
                onChange={setSearch}
                placeholder={t("boards.client_360.search_placeholder")}
              />
              <Client360PersonaToggle persona={persona} onChange={handlePersonaChange} />
              <Client360FilterMenu filter={filter} onFilterChange={setFilter} />
              {view === "table" ? (
                <Client360TableColumnsMenu
                  columns={tableColumns}
                  hasCustomColumns={hasCustomColumns}
                  onToggleColumn={toggleColumn}
                  onMoveColumn={moveColumn}
                  onResetColumns={resetColumns}
                />
              ) : null}
              <Client360ViewToggle view={view} onChange={handleViewChange} />
            </div>
          }
          noPadding
        >
          {view === "matrix" ? (
            matrixError && !matrixData ? (
              <p className="px-4 py-8 text-center text-13 text-danger-primary">{t("boards.client_360.load_error")}</p>
            ) : (
              <Client360MatrixView
                clients={matrixData?.clients ?? []}
                weeks={matrixData?.weeks ?? []}
                basePath={basePath}
                pagination={
                  matrixData?.pagination ?? {
                    page: matrixPage,
                    page_size: 50,
                    total: 0,
                    total_pages: 1,
                  }
                }
                onPageChange={setMatrixPage}
                isLoading={matrixLoading}
                onExportCsv={() => void matrixCsvExport.exportCsv()}
                exportingCsv={matrixCsvExport.exporting}
              />
            )
          ) : showInitialLoading ? (
            <p className="px-4 py-8 text-center text-13 text-tertiary">{t("boards.client_360.loading")}</p>
          ) : emptyScenario ? (
            <Client360EmptyState
              scenario={emptyScenario}
              canCreateProject={canManageWorkspace}
              onCreateProject={() => toggleCreateProjectModal(true)}
              onClearFilters={() => {
                setFilter("all");
                setSearch("");
              }}
              onGoToProjects={() => router.push(`/${workspaceSlug}/projects`)}
              onGoToBoards={() => router.push(`/${workspaceSlug}/settings/boards`)}
            />
          ) : (
            <Client360ClientsView
              view={effectiveView}
              clients={clients}
              basePath={basePath}
              sort={sort}
              onSortChange={handleSortChange}
              tableColumns={tableColumns}
              showHealthScore={healthScoreEnabled}
              showPeriodCompare={showPeriodCompare}
            />
          )}
        </Client360Section>
      )}
    </Client360PageShell>
  );
}
