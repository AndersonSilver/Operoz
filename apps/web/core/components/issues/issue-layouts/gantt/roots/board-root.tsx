/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Search, ChevronDown, Check, X, ListFilterPlus } from "lucide-react";
import type { IWorkItemFilterInstance } from "@plane/shared-state";
import { cn } from "@plane/utils";
import useSWR from "swr";
import { ALL_ISSUES, EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IBlockUpdateData, TIssue } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { EIssueLayoutTypes, GANTT_TIMELINE_TYPE } from "@plane/types";
import { renderFormattedPayloadDate } from "@plane/utils";
import { useBoardLayout } from "@/components/board/board-layout-context";
import { BoardModuleGanttBlock } from "@/components/board/gantt/board-module-gantt-block";
import { BoardProjectGanttBlock } from "@/components/board/gantt/board-project-gantt-block";
import { TimeLineTypeContext } from "@/components/gantt-chart/contexts";
import { GanttChartRoot } from "@/components/gantt-chart/root";
import { BoardGroupedGanttSidebar } from "@/components/gantt-chart/sidebar/board-grouped/sidebar";
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import {
  useCanEditIssueOnProject,
  usePrefetchBoardProjectPermissions,
} from "@/hooks/use-board-issue-capabilities";
import { useUserPermissions } from "@/hooks/store/user";
import { useBoardGroupedTimelineStore } from "@/hooks/store/use-board-grouped-timeline";
import { useBoardIssueType } from "@/hooks/store/use-board-issue-type";
import { useIssuesActions } from "@/hooks/use-issues-actions";
import { useTimeLineChart } from "@/hooks/use-timeline-chart";
import { useBulkOperationStatus } from "@/plane-web/hooks/use-bulk-operation-status";
import { IssueLayoutHOC } from "../../issue-layout-HOC";
import { GanttQuickAddIssueButton, QuickAddIssueRoot } from "../../quick-add";
import { IssueGanttBlock } from "../blocks";
import { AddFilterButton } from "@/components/rich-filters/add-filters/button";
import { FilterItem } from "@/components/rich-filters/filter-item/root";
import { BoardService } from "@/services/board/board.service";
import {
  buildBoardGroupedGanttBlockIds,
  groupBoardModulesByProject,
  isBoardGroupBlockId,
  resolveBoardTimelineProjectIds,
  type TBoardModuleGanttRow,
  type TBoardProjectGanttRow,
} from "../board-gantt.utils";

type Props = {
  viewId: string;
  workItemsFilter?: IWorkItemFilterInstance;
};

const boardService = new BoardService();
const EMPTY_ISSUE_IDS: string[] = [];

export const BoardGanttRoot = observer(function BoardGanttRoot(props: Props) {
  const { viewId, workItemsFilter } = props;
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const { board, workspaceSlug: layoutWorkspaceSlug, boardSlug: layoutBoardSlug } = useBoardLayout();
  const { fetchBoardIssueTypes } = useBoardIssueType();
  const { getProjectIdsForBoard, getPartialProjectById } = useProject();
  const { issues, issuesFilter } = useIssues(EIssuesStoreType.BOARD);
  const { fetchNextIssues, updateIssue } = useIssuesActions(EIssuesStoreType.BOARD);

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const projectSearchInputRef = useRef<HTMLInputElement>(null);
  const { initGantt } = useTimeLineChart(GANTT_TIMELINE_TYPE.GROUPED);
  const {
    collapsedProjectIds,
    collapsedModuleIds,
    setBoardModules,
    beginCollapseScope,
    registerCollapsedDefaults,
  } = useBoardGroupedTimelineStore();
  const { allowPermissions } = useUserPermissions();
  const canEditIssueOnProject = useCanEditIssueOnProject();
  const isBulkOperationsEnabled = useBulkOperationStatus();

  const appliedDisplayFilters = issuesFilter.issueFilters?.displayFilters;
  const groupedIssueIds = issues.groupedIssueIds;
  const issueIds = useMemo(() => {
    const ids = groupedIssueIds?.[ALL_ISSUES] as string[] | undefined;
    return ids ?? EMPTY_ISSUE_IDS;
  }, [groupedIssueIds]);
  const nextPageResults = issues.getPaginationData(undefined, undefined)?.nextPageResults;

  const getIssueById = issues.rootIssueStore.issues.getIssueById;

  const workspaceSlugStr = workspaceSlug?.toString();

  const { data: boardModules } = useSWR(
    workspaceSlugStr && board?.slug ? `BOARD_MODULES_${workspaceSlugStr}_${board.slug}` : null,
    () => boardService.getBoardModules(workspaceSlugStr!, board!.slug),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  useSWR(
    layoutWorkspaceSlug && layoutBoardSlug ? `BOARD_GANTT_ISSUE_TYPES_${layoutWorkspaceSlug}_${layoutBoardSlug}` : null,
    () => fetchBoardIssueTypes(layoutWorkspaceSlug, layoutBoardSlug),
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const modulesByProject = useMemo(
    () => groupBoardModulesByProject(boardModules ?? []),
    [boardModules]
  );

  useEffect(() => {
    setBoardModules(boardModules ?? []);
  }, [boardModules, setBoardModules]);

  const collapseScopeKey = `${workspaceSlugStr ?? ""}:${board?.slug ?? viewId}`;

  useEffect(() => {
    beginCollapseScope(collapseScopeKey);
  }, [beginCollapseScope, collapseScopeKey]);

  const allTimelineProjectIds = useMemo(() => {
    const boardProjectIds = board?.id ? getProjectIdsForBoard(board.id) : [];
    return resolveBoardTimelineProjectIds(boardProjectIds, issueIds, getIssueById);
  }, [board?.id, getProjectIdsForBoard, issueIds, getIssueById]);

  // Filter project IDs by selected projects
  const timelineProjectIds = useMemo(() => {
    if (selectedProjectIds.size === 0) return allTimelineProjectIds;
    return allTimelineProjectIds.filter((id) => selectedProjectIds.has(id));
  }, [allTimelineProjectIds, selectedProjectIds]);

  // Filter issue IDs by search query and selected projects
  const filteredIssueIds = useMemo(() => {
    if (!searchQuery && selectedProjectIds.size === 0) return issueIds;
    return issueIds.filter((id) => {
      const issue = getIssueById(id);
      if (!issue) return false;
      if (selectedProjectIds.size > 0 && !selectedProjectIds.has(issue.project_id)) return false;
      if (searchQuery && !issue.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [issueIds, searchQuery, selectedProjectIds, getIssueById]);

  const boardProjectIdsForPermissions = useMemo(() => {
    const ids = new Set<string>(timelineProjectIds);
    for (const issueId of issueIds) {
      const projectId = getIssueById(issueId)?.project_id;
      if (projectId) ids.add(projectId);
    }
    return [...ids];
  }, [timelineProjectIds, issueIds, getIssueById]);

  usePrefetchBoardProjectPermissions(workspaceSlugStr, boardProjectIdsForPermissions);

  useEffect(() => {
    const moduleIds = Object.values(modulesByProject)
      .flat()
      .map((boardModule) => boardModule.id);
    registerCollapsedDefaults(timelineProjectIds, moduleIds);
  }, [modulesByProject, registerCollapsedDefaults, timelineProjectIds]);

  const blockIds = useMemo(
    () =>
      buildBoardGroupedGanttBlockIds(
        timelineProjectIds,
        filteredIssueIds,
        getIssueById,
        collapsedProjectIds,
        (projectId) => getPartialProjectById(projectId)?.name,
        modulesByProject,
        collapsedModuleIds
      ),
    [timelineProjectIds, filteredIssueIds, getIssueById, collapsedProjectIds, getPartialProjectById, modulesByProject, collapsedModuleIds]
  );

  useEffect(() => {
    initGantt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 1);

  const loadMoreIssues = useCallback(() => {
    fetchNextIssues();
  }, [fetchNextIssues]);

  const updateIssueBlockStructure = async (issue: TIssue | TBoardProjectGanttRow, data: IBlockUpdateData) => {
    if (
      !workspaceSlug ||
      ("isBoardProjectRow" in issue && issue.isBoardProjectRow) ||
      ("isBoardModuleRow" in issue && issue.isBoardModuleRow)
    )
      return;

    const payload: Record<string, unknown> = { ...data };
    if (data.sort_order) payload.sort_order = data.sort_order.newSortOrder;

    await updateIssue(issue.project_id, issue.id, payload);
  };

  const canEditIssue = useCallback(
    (blockId: string) => {
      if (isBoardGroupBlockId(blockId)) return false;

      const slug = workspaceSlug?.toString();
      if (!slug) return false;

      const issueProjectId = issues.rootIssueStore.issues.getIssueById(blockId)?.project_id;
      if (!issueProjectId) return false;

      return canEditIssueOnProject(issueProjectId);
    },
    [canEditIssueOnProject, issues.rootIssueStore.issues, workspaceSlug]
  );

  const isWorkspaceEditor = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE,
    workspaceSlug?.toString()
  );

  const updateBlockDates = useCallback(
    (
      updates: {
        id: string;
        start_date?: string;
        target_date?: string;
      }[]
    ) => {
      if (!workspaceSlug) return Promise.resolve();

      const issueUpdates = updates.filter((u) => !isBoardGroupBlockId(u.id));
      if (!issueUpdates.length) return Promise.resolve();

      const onError = () => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: "Error while updating work item dates, Please try again Later",
        });
      };

      const updatesByProject: Record<string, typeof issueUpdates> = {};

      for (const update of issueUpdates) {
        const projectIdForIssue = getIssueById(update.id)?.project_id;
        if (!projectIdForIssue) continue;
        if (!updatesByProject[projectIdForIssue]) updatesByProject[projectIdForIssue] = [];
        updatesByProject[projectIdForIssue].push(update);
      }

      return Promise.all(
        Object.entries(updatesByProject).map(([projectIdForIssue, projectUpdates]) =>
          issues.updateIssueDates(workspaceSlug.toString(), projectUpdates, projectIdForIssue)
        )
      ).catch(onError);
    },
    [getIssueById, issues, t, workspaceSlug]
  );

  const blockToRender = useCallback((data: TIssue | TBoardProjectGanttRow | TBoardModuleGanttRow) => {
    if ("isBoardProjectRow" in data && data.isBoardProjectRow) {
      return (
        <BoardProjectGanttBlock
          projectId={data.id}
          name={data.name}
          startDate={data.start_date}
          targetDate={data.target_date}
        />
      );
    }

    if ("isBoardModuleRow" in data && data.isBoardModuleRow) {
      const moduleMeta = boardModules?.find((m) => m.id === data.id);
      return (
        <BoardModuleGanttBlock
          name={data.name}
          status={moduleMeta?.status}
          startDate={data.start_date}
          targetDate={data.target_date}
        />
      );
    }

    return <IssueGanttBlock issueId={data.id} />;
  }, [boardModules]);

  const quickAdd =
    issues.viewFlags.enableIssueCreation && isWorkspaceEditor ? (
      <QuickAddIssueRoot
        layout={EIssueLayoutTypes.GANTT}
        QuickAddButton={GanttQuickAddIssueButton}
        containerClassName="sticky bottom-0 z-[1]"
        prePopulatedData={{
          start_date: renderFormattedPayloadDate(new Date()),
          target_date: renderFormattedPayloadDate(targetDate),
        }}
        isEpic={false}
      />
    ) : undefined;

  useEffect(() => {
    if (!projectDropdownOpen) return;
    projectSearchInputRef.current?.focus();
  }, [projectDropdownOpen]);

  // Close project dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProjectDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredProjectsForDropdown = allTimelineProjectIds.filter((id) => {
    const name = getPartialProjectById(id)?.name ?? "";
    return name.toLowerCase().includes(projectSearch.toLowerCase());
  });

  const toggleProject = (id: string) => {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!board || appliedDisplayFilters?.layout !== EIssueLayoutTypes.GANTT) return null;

  return (
    <IssueLayoutHOC layout={EIssueLayoutTypes.GANTT}>
      <TimeLineTypeContext.Provider value={GANTT_TIMELINE_TYPE.GROUPED}>
        <div className="h-full w-full flex flex-col">
          {/** Jira-style toolbar: search + project filter */}
          <div className="flex flex-shrink-0 items-center gap-2 border-b border-subtle px-3 py-2 bg-surface-1">
            {/** Search bar */}
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 h-3.5 w-3.5 text-tertiary pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar linha do..."
                className="h-8 w-52 rounded-md border border-subtle bg-layer-1 pl-8 pr-3 text-12 text-primary placeholder:text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 text-tertiary hover:text-primary"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {workItemsFilter
              ? workItemsFilter.allConditionsForDisplay.map((condition) => (
                  <FilterItem
                    key={condition.id}
                    filter={workItemsFilter}
                    condition={condition}
                    isDisabled={!workItemsFilter.configManager.areConfigsReady}
                  />
                ))
              : null}

            {workItemsFilter && workItemsFilter.configManager.areConfigsReady ? (
              <AddFilterButton
                filter={workItemsFilter}
                buttonConfig={{
                  label: null,
                  size: "sm",
                  variant: "secondary",
                  className: "h-8 shrink-0 px-2",
                  iconConfig: { shouldShowIcon: true, iconComponent: ListFilterPlus },
                }}
              />
            ) : null}

            {/** Project filter */}
            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProjectDropdownOpen((v) => !v)}
                className={cn(
                  "flex h-8 items-center gap-1.5 rounded-md border px-3 text-12 font-medium transition-colors",
                  selectedProjectIds.size > 0
                    ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
                    : "border-subtle bg-layer-1 text-secondary hover:bg-layer-2"
                )}
              >
                Projeto
                {selectedProjectIds.size > 0 && (
                  <span className="rounded-full bg-accent-primary px-1.5 py-0.5 text-10 text-on-color">
                    {selectedProjectIds.size}
                  </span>
                )}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {projectDropdownOpen && (
                <div className="absolute left-0 top-full z-20 mt-1 w-72 rounded-md border border-subtle bg-surface-1 shadow-lg">
                  <div className="p-2">
                    <input
                      ref={projectSearchInputRef}
                      type="text"
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      placeholder="Pesquisar filtros Projeto..."
                      className="w-full rounded-md border border-subtle bg-layer-1 px-3 py-1.5 text-12 text-primary placeholder:text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredProjectsForDropdown.map((projectId) => {
                      const project = getPartialProjectById(projectId);
                      const isSelected = selectedProjectIds.has(projectId);
                      return (
                        <button
                          key={projectId}
                          type="button"
                          onClick={() => toggleProject(projectId)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-13 text-primary hover:bg-layer-2"
                        >
                          <div className={cn(
                            "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border",
                            isSelected ? "border-accent-primary bg-accent-primary" : "border-subtle"
                          )}>
                            {isSelected && <Check className="h-3 w-3 text-on-color" />}
                          </div>
                          <span className="truncate">{project?.name ?? projectId}</span>
                        </button>
                      );
                    })}
                    {filteredProjectsForDropdown.length === 0 && (
                      <div className="px-3 py-4 text-center text-12 text-tertiary">Nenhum projeto encontrado</div>
                    )}
                  </div>
                  {selectedProjectIds.size > 0 && (
                    <div className="border-t border-subtle p-2">
                      <button
                        type="button"
                        onClick={() => setSelectedProjectIds(new Set())}
                        className="w-full rounded-md px-2 py-1 text-12 text-tertiary hover:bg-layer-2 hover:text-primary"
                      >
                        Limpar filtro
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <GanttChartRoot
              border={false}
              title={t("issue.label", { count: 2 })}
              loaderTitle={t("issue.label", { count: 2 })}
              blockIds={blockIds}
              blockUpdateHandler={updateIssueBlockStructure}
              blockToRender={blockToRender}
              sidebarToRender={(sidebarProps) => <BoardGroupedGanttSidebar {...sidebarProps} showAllBlocks />}
              enableBlockLeftResize={canEditIssue}
              enableBlockRightResize={canEditIssue}
              enableBlockMove={canEditIssue}
              enableReorder={(blockId) =>
                canEditIssue(blockId) && appliedDisplayFilters?.order_by === "sort_order"
              }
              enableAddBlock={(blockId) => canEditIssue(blockId)}
              enableSelection={(blockId) => isBulkOperationsEnabled && canEditIssue(blockId)}
              quickAdd={quickAdd}
              loadMoreBlocks={loadMoreIssues}
              canLoadMoreBlocks={nextPageResults}
              updateBlockDates={updateBlockDates}
              showAllBlocks
              showToday
              enableDependency={(blockId) => canEditIssue(blockId)}
            />
          </div>
        </div>
      </TimeLineTypeContext.Provider>
    </IssueLayoutHOC>
  );
});
