import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, LifeBuoy, Users } from "lucide-react";
import { EUserPermissionsLevel } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { EUserWorkspaceRoles } from "@operoz/types";
import { Client360EmptyState } from "@/components/board/client-360/client-360-empty-state";
import { resolveClient360EmptyScenario } from "@/components/board/client-360/client-360-empty-state.utils";
import { Client360OnboardingBanner } from "@/components/board/client-360/client-360-onboarding-banner";
import {
  Client360BoardFilterChips,
  Client360BoardFilterMenu,
} from "@/components/board/client-360/client-360-board-filter-menu";
import { groupClient360ByBoard } from "@/components/board/client-360/client-360-board-grouping";
import { Client360BoardGroupToggle } from "@/components/board/client-360/client-360-board-group-toggle";
import { Client360GroupedClientsView } from "@/components/board/client-360/client-360-grouped-clients-view";
import { useClient360BoardGrouping } from "@/components/board/client-360/use-client-360-board-grouping";
import { Client360DensityToggle } from "@/components/board/client-360/client-360-density-toggle";
import { Client360ExportMenu } from "@/components/board/client-360/client-360-export-menu";
import { Client360ShortcutsHelpMenu } from "@/components/board/client-360/client-360-shortcuts-help-menu";
import { Client360SavedViewsMenu } from "@/components/board/client-360/client-360-saved-views-menu";
import type { Client360SavedViewPayload } from "@/components/board/client-360/client-360-saved-views";
import { useClient360SavedViews } from "@/components/board/client-360/use-client-360-saved-views";
import { useClient360RowDensity } from "@/components/board/client-360/use-client-360-row-density";
import { useClient360KeyboardShortcuts } from "@/components/board/client-360/use-client-360-keyboard-shortcuts";
import { useClient360CsvExport } from "@/components/board/client-360/use-client-360-csv-export";
import { Client360TableColumnsMenu } from "@/components/board/client-360/client-360-table-columns-menu";
import { useClient360TableColumns } from "@/components/board/client-360/use-client-360-table-columns";
import { useClient360CompactTableView } from "@/components/board/client-360/use-client-360-compact-table-view";
import {
  computeClient360Summary,
  extractClient360Boards,
  filterClient360ByBoards,
} from "@/components/board/client-360/client-360-board-filter";
import { useClient360BoardFilter } from "@/components/board/client-360/use-client-360-board-filter";
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
import { Client360FinopsDashboard } from "@/components/board/client-360/client-360-finops-dashboard";
import { Client360PortfolioKpiStrip } from "@/components/board/client-360/client-360-portfolio-kpi-strip";
import { Client360PortfolioPulse } from "@/components/board/client-360/client-360-portfolio-pulse";
import { Client360PortfolioSupport } from "@/components/board/client-360/client-360-portfolio-support";
import { Client360PortfolioSidebar } from "@/components/board/client-360/client-360-portfolio-sidebar";
import {
  Client360DetailTabList,
  Client360DetailTabPanel,
  Client360DetailTabTrigger,
  Client360DetailTabs,
} from "@/components/board/client-360/client-360-detail-tabs";
import { Client360PersonaToggle } from "@/components/board/client-360/client-360-persona-toggle";
import { tableColumnsForPersona } from "@/components/board/client-360/client-360-persona-columns";
import { useClient360Persona, type Client360Persona } from "@/components/board/client-360/use-client-360-persona";
import {
  isWorkspaceSharedSavedViewId,
  sharedViewToSavedView,
} from "@/components/board/client-360/client-360-saved-views";
import { useClient360MatrixCsvExport } from "@/components/board/client-360/use-client-360-matrix-csv-export";
import { Client360ClientsView } from "@/components/board/client-360/client-360-clients-view";
import { Client360MatrixView } from "@/components/board/client-360/client-360-matrix-view";
import { Client360HealthHistoryProvider } from "@/components/board/client-360/client-360-health-history-provider";
import { Client360WeekNav } from "@/components/board/client-360/client-360-week-nav";
import {
  Client360ViewToggle,
  loadClient360ViewMode,
  saveClient360ViewMode,
  type Client360ViewMode,
} from "@/components/board/client-360/client-360-view-toggle";
import { useClient360PeriodCompare } from "@/components/board/client-360/client-360-period-compare-toggle";
import {
  Client360FilterMenu,
  Client360PageShell,
  Client360PageTitle,
  Client360SearchInput,
  Client360Section,
} from "@/components/board/client-360/client-360-ui";
import { CLIENT_360_SWR_CONFIG, defaultWeekPeriod } from "@/components/board/client-360/client-360-utils";
import { WorkspaceService } from "@/services/workspace.service";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUserPermissions } from "@/hooks/store/user";

type Props = {
  workspaceSlug: string;
};

const CLIENT_360_SCOPE = "workspace";
const workspaceService = new WorkspaceService();

export function WorkspaceClient360List({ workspaceSlug }: Props) {
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
  const [view, setView] = useState<Client360ViewMode>(() =>
    loadClient360ViewMode(CLIENT_360_SCOPE, { wideDefault: "grid" })
  );
  const [sort, setSort] = useState<Client360SortState>(() => loadClient360Sort(CLIENT_360_SCOPE));
  const [matrixPage, setMatrixPage] = useState(1);
  const [listTab, setListTab] = useState<"pulse" | "finops" | "clients" | "support">("pulse");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { density, toggleDensity } = useClient360RowDensity(CLIENT_360_SCOPE);

  const { persona, setPersona } = useClient360Persona(CLIENT_360_SCOPE);

  const handleViewChange = (next: Client360ViewMode) => {
    setView(next);
    saveClient360ViewMode(CLIENT_360_SCOPE, next);
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

  const { enabled: periodCompareEnabled, setEnabled: setPeriodCompareEnabled } =
    useClient360PeriodCompare(CLIENT_360_SCOPE);

  const handleSortChange = (next: Client360SortState) => {
    setSort(next);
    saveClient360Sort(CLIENT_360_SCOPE, next);
  };

  const handleSupportFilter = useCallback((next: Client360FilterKey) => {
    setFilter(next);
    setListTab("clients");
  }, []);

  const { data, error, isLoading } = useSWR(
    workspaceSlug
      ? `CLIENT_360_WS_${workspaceSlug}_${period.start}_${period.end}_${periodCompareEnabled ? "cmp" : "base"}`
      : null,
    () =>
      workspaceService.getClient360(workspaceSlug, {
        period_start: period.start,
        period_end: period.end,
        compare: periodCompareEnabled,
      }),
    CLIENT_360_SWR_CONFIG
  );

  const showInitialLoading = isLoading && !data && !error;
  const allClients = data?.clients ?? [];
  const healthScoreEnabled = data?.display?.health_score_enabled ?? false;
  const boardOptions = useMemo(() => extractClient360Boards(allClients), [allClients]);

  const { selectedBoardIds, selectedBoards, hasBoardFilter, toggleBoard, clearBoards, ready, setSelectedBoardIds } =
    useClient360BoardFilter(workspaceSlug, boardOptions);

  const matrixBoardIdsKey = ready && hasBoardFilter ? selectedBoardIds.join(",") : "";
  const {
    data: matrixData,
    error: matrixError,
    isLoading: matrixLoading,
  } = useSWR(
    view === "matrix" && workspaceSlug
      ? `CLIENT_360_MATRIX_WS_${workspaceSlug}_${period.start}_${period.end}_${matrixPage}_${matrixBoardIdsKey}`
      : null,
    () =>
      workspaceService.getClient360Matrix(workspaceSlug, {
        period_start: period.start,
        period_end: period.end,
        weeks: 8,
        page: matrixPage,
        page_size: 50,
        ...(matrixBoardIdsKey ? { board_ids: matrixBoardIdsKey } : {}),
      }),
    CLIENT_360_SWR_CONFIG
  );

  useEffect(() => {
    setMatrixPage(1);
  }, [period.start, period.end, matrixBoardIdsKey]);

  const boardScopedClients = useMemo(
    () => (ready ? filterClient360ByBoards(allClients, selectedBoardIds) : allClients),
    [allClients, ready, selectedBoardIds]
  );

  const periodCompareAvailable = data?.period_compare?.available ?? !periodCompareEnabled;
  const showPeriodCompare = periodCompareEnabled && (data?.period_compare?.available ?? false);

  useEffect(() => {
    if (periodCompareEnabled && data?.period_compare && !data.period_compare.available) {
      setPeriodCompareEnabled(false);
    }
  }, [data?.period_compare, periodCompareEnabled, setPeriodCompareEnabled]);

  const scopedSummary = useMemo(() => {
    if (!data?.summary) return undefined;
    if (!hasBoardFilter) return data.summary;
    return computeClient360Summary(boardScopedClients);
  }, [boardScopedClients, data?.summary, hasBoardFilter]);

  const clients = useMemo(() => {
    const list = searchClient360Clients(filterClient360Clients(boardScopedClients, filter), search);
    return sortClient360Clients(list, sort);
  }, [boardScopedClients, filter, search, sort]);

  const visibleBoardIds = useMemo(() => groupClient360ByBoard(clients).map((group) => group.boardId), [clients]);

  const { groupByBoard, setGroupByBoard, toggleGroupCollapsed, expandAll, collapseAll, isCollapsed } =
    useClient360BoardGrouping(CLIENT_360_SCOPE, visibleBoardIds);

  const includeBoardColumn = !(groupByBoard && boardOptions.length > 1);
  const {
    columns: tableColumns,
    visibleColumns,
    hasCustomColumns,
    toggleColumn,
    moveColumn,
    resetColumns,
    applyColumns,
  } = useClient360TableColumns(CLIENT_360_SCOPE, includeBoardColumn);

  useEffect(() => {
    applyColumns(tableColumnsForPersona(persona, includeBoardColumn), includeBoardColumn);
  }, [persona, includeBoardColumn, applyColumns]);

  const effectiveView = useClient360CompactTableView(view, visibleColumns.length);

  const applySavedViewPayload = useCallback(
    (payload: Client360SavedViewPayload) => {
      const includeBoardForView = !(payload.groupByBoard && boardOptions.length > 1);
      setFilter(payload.filter);
      setSearch(payload.search);
      setSelectedBoardIds(payload.boardIds);
      setView(payload.view);
      saveClient360ViewMode(CLIENT_360_SCOPE, payload.view);
      setSort(payload.sort);
      saveClient360Sort(CLIENT_360_SCOPE, payload.sort);
      setGroupByBoard(payload.groupByBoard);
      applyColumns(payload.tableColumns, includeBoardForView);
    },
    [applyColumns, boardOptions.length, setGroupByBoard, setSelectedBoardIds]
  );

  const {
    views: savedViews,
    defaultViewId,
    activeViewId,
    applyView,
    saveCurrentView,
    renameView,
    deleteView,
    setDefaultView,
    overwriteView,
    syncActiveView,
    buildPayload,
  } = useClient360SavedViews(workspaceSlug, includeBoardColumn, applySavedViewPayload, ready);

  const { data: workspaceSharedViews, mutate: mutateSharedViews } = useSWR(
    workspaceSlug ? `CLIENT360_SHARED_VIEWS_${workspaceSlug}` : null,
    () => workspaceService.getClient360SharedViews(workspaceSlug),
    { revalidateOnFocus: false }
  );

  const mergedSavedViews = useMemo(() => {
    const shared = (workspaceSharedViews ?? [])
      .map((row) => sharedViewToSavedView(row, includeBoardColumn))
      .filter((view): view is NonNullable<typeof view> => view != null);
    return [...shared, ...savedViews];
  }, [workspaceSharedViews, includeBoardColumn, savedViews]);

  const readOnlySavedViewIds = useMemo(
    () => new Set(mergedSavedViews.filter((view) => isWorkspaceSharedSavedViewId(view.id)).map((view) => view.id)),
    [mergedSavedViews]
  );

  const currentSavedViewPayload = useMemo(
    () =>
      buildPayload({
        filter,
        search,
        boardIds: selectedBoardIds,
        view,
        sort,
        tableColumns,
        groupByBoard,
      }),
    [buildPayload, filter, groupByBoard, search, selectedBoardIds, sort, tableColumns, view]
  );

  useEffect(() => {
    syncActiveView(currentSavedViewPayload);
  }, [currentSavedViewPayload, syncActiveView]);

  const hasActiveFilters = filter !== "all" || search.trim().length > 0 || hasBoardFilter;

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

  useEffect(() => {
    setFilter(parseClient360FilterParam(searchParams.get(CLIENT_360_FILTER_PARAM)));
  }, [searchParams]);

  const matrixCsvExport = useClient360MatrixCsvExport({
    scope: {
      kind: "workspace",
      workspaceSlug,
      boardIds: matrixBoardIdsKey || undefined,
    },
    periodStart: period.start,
    periodEnd: period.end,
    weeks: 8,
    delimiter: "semicolon",
  });

  const exportCsv = useClient360CsvExport({
    workspaceSlug,
    periodStart: period.start,
    periodEnd: period.end,
    clients,
    tableColumns,
    includeBoard: includeBoardColumn,
    showPeriodCompare,
  });

  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  useClient360KeyboardShortcuts({
    enabled: !showInitialLoading && !emptyScenario,
    focusSearch,
    setView: handleViewChange,
    exportVisible: () => exportCsv("visible"),
  });

  const showDensityToggle = (effectiveView === "table" || effectiveView === "list") && view !== "matrix";

  const handleClearFilters = () => {
    setFilter("all");
    setSearch("");
    clearBoards();
  };

  const basePath = `/${workspaceSlug}/visao-360`;
  const totalClients = allClients.length;
  const listDescription =
    totalClients > 0
      ? hasBoardFilter
        ? t("boards.client_360.clients_filtered_count", {
            shown: clients.length,
            total: boardScopedClients.length,
          })
        : t("boards.client_360.clients_list_count", { count: clients.length })
      : undefined;

  const showFinops =
    canManageWorkspace && Boolean(data?.finops_summary) && data?.enterprise?.phase_flags?.["4"] !== false;
  const showPortfolioPulse = scopedSummary && ready && boardScopedClients.length > 0;

  const clientsTable = (
    <Client360HealthHistoryProvider workspaceSlug={workspaceSlug}>
      {view === "matrix" ? (
        matrixError && !matrixData ? (
          <p className="px-4 py-8 text-center text-13 text-danger-primary">{t("boards.client_360.load_error")}</p>
        ) : (
          <Client360MatrixView
            clients={matrixData?.clients ?? []}
            weeks={matrixData?.weeks ?? []}
            basePath={basePath}
            showBoardColumn={includeBoardColumn}
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
          onClearFilters={handleClearFilters}
          onGoToProjects={() => router.push(`/${workspaceSlug}/projects`)}
          onGoToBoards={() => router.push(`/${workspaceSlug}/settings/boards`)}
        />
      ) : groupByBoard && boardOptions.length > 1 ? (
        <Client360GroupedClientsView
          clients={clients}
          view={effectiveView}
          basePath={basePath}
          sort={sort}
          onSortChange={handleSortChange}
          isCollapsed={isCollapsed}
          onToggleGroup={toggleGroupCollapsed}
          tableColumns={tableColumns}
          density={density}
          showHealthSparkline
          showHealthScore={healthScoreEnabled}
          showPeriodCompare={showPeriodCompare}
        />
      ) : (
        <Client360ClientsView
          view={effectiveView}
          clients={clients}
          basePath={basePath}
          sort={sort}
          onSortChange={handleSortChange}
          showBoardColumn={includeBoardColumn}
          tableColumns={tableColumns}
          density={density}
          showHealthSparkline
          showHealthScore={healthScoreEnabled}
          showPeriodCompare={showPeriodCompare}
        />
      )}
    </Client360HealthHistoryProvider>
  );

  return (
    <Client360PageShell
      header={
        <Client360PageTitle
          icon={Users}
          title={t("boards.client_360.title")}
          subtitle={t("boards.client_360.subtitle_workspace")}
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
      }
      belowHeader={canManageWorkspace ? <Client360OnboardingBanner workspaceSlug={workspaceSlug} /> : undefined}
    >
      {showPortfolioPulse && scopedSummary ? (
        <>
          <Client360PortfolioKpiStrip summary={scopedSummary} onFilterChange={setFilter} />

          <section className="client-360-workspace-content-panel workspace-exports-history-panel overflow-hidden rounded-xl border border-subtle bg-layer-1">
            <Client360DetailTabs
              className="gap-0"
              value={listTab}
              onValueChange={(tab) => setListTab(tab as typeof listTab)}
            >
              <div className="border-b border-subtle bg-gradient-to-r from-layer-1 via-layer-1 to-layer-2/20 px-5 py-3 lg:px-6">
                <Client360DetailTabList contained>
                  <Client360DetailTabTrigger value="pulse">
                    {t("boards.client_360.detail_tab_pulse")}
                  </Client360DetailTabTrigger>
                  {showFinops ? (
                    <Client360DetailTabTrigger value="finops">
                      {t("boards.client_360.detail_tab_finops")}
                    </Client360DetailTabTrigger>
                  ) : null}
                  <Client360DetailTabTrigger value="clients">
                    {t("boards.client_360.detail_tab_clients")}
                  </Client360DetailTabTrigger>
                  <Client360DetailTabTrigger value="support" icon={LifeBuoy}>
                    {t("boards.client_360.detail_tab_support")}
                  </Client360DetailTabTrigger>
                </Client360DetailTabList>
              </div>

              <div className="p-5 lg:p-6">
                <Client360DetailTabPanel value="pulse" className="mt-0">
                  <Client360PortfolioPulse
                    summary={scopedSummary}
                    clients={boardScopedClients}
                    basePath={basePath}
                    onFilterChange={setFilter}
                    showBoard
                    sidebar={
                      canManageWorkspace && data?.enterprise?.phase_flags?.["5"] !== false ? (
                        <Client360PortfolioSidebar
                          className="w-full"
                          workspaceSlug={workspaceSlug}
                          period={period}
                          summary={scopedSummary}
                          finopsSummary={data?.finops_summary}
                          showFinops={showFinops}
                          onOpenFinops={() => setListTab("finops")}
                        />
                      ) : null
                    }
                  />
                </Client360DetailTabPanel>

                {showFinops && data?.finops_summary ? (
                  <Client360DetailTabPanel value="finops" className="mt-0">
                    <Client360FinopsDashboard
                      workspaceSlug={workspaceSlug}
                      finopsSummary={data.finops_summary}
                      basePath={basePath}
                      boardIdsKey={hasBoardFilter ? selectedBoardIds.join(",") : undefined}
                    />
                  </Client360DetailTabPanel>
                ) : null}

                <Client360DetailTabPanel value="clients" className="mt-0">
                  {hasBoardFilter && ready ? (
                    <Client360BoardFilterChips
                      boards={selectedBoards}
                      onRemove={toggleBoard}
                      onClear={clearBoards}
                      className="mb-4 rounded-md border border-subtle bg-layer-1"
                    />
                  ) : null}

                  <Client360Section
                    icon={Building2}
                    iconTone="neutral"
                    title={t("boards.client_360.clients_list_title")}
                    description={listDescription}
                    action={
                      <div className="flex flex-wrap items-center gap-2">
                        <Client360SearchInput
                          inputRef={searchInputRef}
                          value={search}
                          onChange={setSearch}
                          placeholder={t("boards.client_360.search_placeholder")}
                        />
                        <Client360ShortcutsHelpMenu />
                        <Client360PersonaToggle persona={persona} onChange={handlePersonaChange} />
                        {showDensityToggle ? (
                          <Client360DensityToggle density={density} onToggle={toggleDensity} />
                        ) : null}
                        {boardOptions.length > 0 ? (
                          <Client360BoardFilterMenu
                            boards={boardOptions}
                            selectedBoardIds={selectedBoardIds}
                            onToggleBoard={toggleBoard}
                            onClear={clearBoards}
                          />
                        ) : null}
                        <Client360ExportMenu
                          workspaceSlug={workspaceSlug}
                          periodStart={period.start}
                          periodEnd={period.end}
                          clients={clients}
                          tableColumns={tableColumns}
                          includeBoard={includeBoardColumn}
                          showPeriodCompare={showPeriodCompare}
                          qbrParams={{
                            scope: "workspace-portfolio",
                            workspaceSlug,
                            periodStart: period.start,
                            periodEnd: period.end,
                            compare: showPeriodCompare,
                          }}
                          disabled={showInitialLoading || clients.length === 0}
                        />
                        <Client360SavedViewsMenu
                          views={mergedSavedViews}
                          defaultViewId={defaultViewId}
                          activeViewId={activeViewId}
                          readOnlyViewIds={readOnlySavedViewIds}
                          onApplyView={applyView}
                          onSaveView={(name) => {
                            const result = saveCurrentView(name, currentSavedViewPayload);
                            return "error" in result ? { error: result.error } : {};
                          }}
                          onRenameView={(viewId, name) => {
                            const result = renameView(viewId, name);
                            return "error" in result ? { error: result.error } : {};
                          }}
                          onDeleteView={deleteView}
                          onSetDefaultView={setDefaultView}
                          onOverwriteView={(viewId) => {
                            if (isWorkspaceSharedSavedViewId(viewId)) return;
                            overwriteView(viewId, currentSavedViewPayload);
                          }}
                          onPublishSharedView={
                            canManageWorkspace && activeViewId && !isWorkspaceSharedSavedViewId(activeViewId)
                              ? async () => {
                                  const active = savedViews.find((view) => view.id === activeViewId);
                                  if (!active) return;
                                  await workspaceService.createClient360SharedView(workspaceSlug, {
                                    name: active.name,
                                    payload: currentSavedViewPayload,
                                    is_shared: true,
                                  });
                                  void mutateSharedViews();
                                }
                              : undefined
                          }
                        />
                        <Client360FilterMenu filter={filter} onFilterChange={setFilter} />
                        {boardOptions.length > 1 ? (
                          <Client360BoardGroupToggle
                            groupByBoard={groupByBoard}
                            onGroupByBoardChange={setGroupByBoard}
                            onExpandAll={expandAll}
                            onCollapseAll={collapseAll}
                          />
                        ) : null}
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
                    {clientsTable}
                  </Client360Section>
                </Client360DetailTabPanel>

                <Client360DetailTabPanel value="support" className="mt-0">
                  <Client360PortfolioSupport
                    workspaceSlug={workspaceSlug}
                    summary={scopedSummary}
                    clients={boardScopedClients}
                    supportAnalytics={data?.support_analytics}
                    periodStart={period.start}
                    periodEnd={period.end}
                    exportScope={{ kind: "workspace", workspaceSlug }}
                    onFilterChange={handleSupportFilter}
                    showBoard
                  />
                </Client360DetailTabPanel>
              </div>
            </Client360DetailTabs>
          </section>
        </>
      ) : (
        <>
          {hasBoardFilter && ready ? (
            <Client360BoardFilterChips
              boards={selectedBoards}
              onRemove={toggleBoard}
              onClear={clearBoards}
              className="rounded-md border border-subtle bg-layer-1"
            />
          ) : null}

          <Client360Section
            icon={Building2}
            iconTone="neutral"
            title={t("boards.client_360.clients_list_title")}
            description={listDescription}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Client360SearchInput
                  inputRef={searchInputRef}
                  value={search}
                  onChange={setSearch}
                  placeholder={t("boards.client_360.search_placeholder")}
                />
                <Client360ShortcutsHelpMenu />
                <Client360PersonaToggle persona={persona} onChange={handlePersonaChange} />
                {showDensityToggle ? <Client360DensityToggle density={density} onToggle={toggleDensity} /> : null}
                {boardOptions.length > 0 ? (
                  <Client360BoardFilterMenu
                    boards={boardOptions}
                    selectedBoardIds={selectedBoardIds}
                    onToggleBoard={toggleBoard}
                    onClear={clearBoards}
                  />
                ) : null}
                <Client360ExportMenu
                  workspaceSlug={workspaceSlug}
                  periodStart={period.start}
                  periodEnd={period.end}
                  clients={clients}
                  tableColumns={tableColumns}
                  includeBoard={includeBoardColumn}
                  showPeriodCompare={showPeriodCompare}
                  qbrParams={{
                    scope: "workspace-portfolio",
                    workspaceSlug,
                    periodStart: period.start,
                    periodEnd: period.end,
                    compare: showPeriodCompare,
                  }}
                  disabled={showInitialLoading || clients.length === 0}
                />
                <Client360SavedViewsMenu
                  views={mergedSavedViews}
                  defaultViewId={defaultViewId}
                  activeViewId={activeViewId}
                  readOnlyViewIds={readOnlySavedViewIds}
                  onApplyView={applyView}
                  onSaveView={(name) => {
                    const result = saveCurrentView(name, currentSavedViewPayload);
                    return "error" in result ? { error: result.error } : {};
                  }}
                  onRenameView={(viewId, name) => {
                    const result = renameView(viewId, name);
                    return "error" in result ? { error: result.error } : {};
                  }}
                  onDeleteView={deleteView}
                  onSetDefaultView={setDefaultView}
                  onOverwriteView={(viewId) => {
                    if (isWorkspaceSharedSavedViewId(viewId)) return;
                    overwriteView(viewId, currentSavedViewPayload);
                  }}
                  onPublishSharedView={
                    canManageWorkspace && activeViewId && !isWorkspaceSharedSavedViewId(activeViewId)
                      ? async () => {
                          const active = savedViews.find((view) => view.id === activeViewId);
                          if (!active) return;
                          await workspaceService.createClient360SharedView(workspaceSlug, {
                            name: active.name,
                            payload: currentSavedViewPayload,
                            is_shared: true,
                          });
                          void mutateSharedViews();
                        }
                      : undefined
                  }
                />
                <Client360FilterMenu filter={filter} onFilterChange={setFilter} />
                {boardOptions.length > 1 ? (
                  <Client360BoardGroupToggle
                    groupByBoard={groupByBoard}
                    onGroupByBoardChange={setGroupByBoard}
                    onExpandAll={expandAll}
                    onCollapseAll={collapseAll}
                  />
                ) : null}
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
            {clientsTable}
          </Client360Section>
        </>
      )}
    </Client360PageShell>
  );
}
