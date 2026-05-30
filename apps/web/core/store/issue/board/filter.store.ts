import { isEmpty, set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { TSupportedFilterTypeForUpdate } from "@operis/constants";
import { EIssueFilterType } from "@operis/constants";
import type {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  TIssueKanbanFilters,
  IIssueFilters,
  TIssueParams,
  IssuePaginationOptions,
  TWorkItemFilterExpression,
  TSupportedFilterForUpdate,
} from "@operis/types";
import { EIssuesStoreType, EIssueLayoutTypes } from "@operis/types";
import { handleIssueQueryParamsByLayout } from "@operis/utils";
import { resolveBoardListDisplayProperties } from "@/store/issue/board/board-list-display-properties";
// local imports
import type { IBaseIssueFilterStore, IIssueFilterHelperStore } from "../helpers/issue-filter-helper.store";
import { IssueFilterHelperStore } from "../helpers/issue-filter-helper.store";
import type { IIssueRootStore } from "../root.store";

export type TBaseFilterStore = IBaseIssueFilterStore & IIssueFilterHelperStore;

export interface IBoardIssuesFilter extends TBaseFilterStore {
  // fetch action
  fetchFilters: (
    workspaceSlug: string,
    viewId: string,
    options?: { preferredLayout?: EIssueLayoutTypes }
  ) => Promise<void>;
  updateFilterExpression: (workspaceSlug: string, viewId: string, filters: TWorkItemFilterExpression) => Promise<void>;
  updateFilters: (
    workspaceSlug: string,
    projectId: string | undefined,
    filterType: TSupportedFilterTypeForUpdate,
    filters: TSupportedFilterForUpdate,
    viewId: string
  ) => Promise<void>;
  //helper action
  getIssueFilters: (viewId: string | undefined) => IIssueFilters | undefined;
  getAppliedFilters: (viewId: string) => Partial<Record<TIssueParams, string | boolean>> | undefined;
  getFilterParams: (
    options: IssuePaginationOptions,
    viewId: string,
    cursor: string | undefined,
    groupId: string | undefined,
    subGroupId: string | undefined
  ) => Partial<Record<TIssueParams, string | boolean>>;
}

export class BoardIssuesFilter extends IssueFilterHelperStore implements IBoardIssuesFilter {
  // observables
  filters: { [viewId: string]: IIssueFilters } = {};
  // root store
  rootIssueStore;

  constructor(_rootStore: IIssueRootStore) {
    super();
    makeObservable(this, {
      // observables
      filters: observable,
      // computed
      issueFilters: computed,
      appliedFilters: computed,
      // fetch actions
      fetchFilters: action,
      updateFilters: action,
    });
    // root store
    this.rootIssueStore = _rootStore;
  }

  getIssueFilters = (viewId: string | undefined) => {
    if (!viewId) return undefined;

    const displayFilters = this.filters[viewId] || undefined;
    if (isEmpty(displayFilters)) return undefined;

    const _filters: IIssueFilters = this.computedIssueFilters(displayFilters);

    return _filters;
  };

  getAppliedFilters = (viewId: string | undefined) => {
    if (!viewId) return undefined;

    const userFilters = this.getIssueFilters(viewId);
    if (!userFilters) return undefined;

    const layout = userFilters?.displayFilters?.layout ?? EIssueLayoutTypes.SPREADSHEET;
    const filteredParams = handleIssueQueryParamsByLayout(layout, "board_backlog");
    if (!filteredParams) return undefined;

    const filteredRouteParams: Partial<Record<TIssueParams, string | boolean>> = this.computedFilteredParams(
      userFilters?.richFilters,
      userFilters?.displayFilters,
      filteredParams
    );

    return filteredRouteParams;
  };

  get issueFilters() {
    const viewId = this.rootIssueStore.rootStore.router.boardSlug;
    return this.getIssueFilters(viewId);
  }

  get appliedFilters() {
    const viewId = this.rootIssueStore.rootStore.router.boardSlug;
    return this.getAppliedFilters(viewId);
  }

  getFilterParams = computedFn(
    (
      options: IssuePaginationOptions,
      viewId: string,
      cursor: string | undefined,
      groupId: string | undefined,
      subGroupId: string | undefined
    ) => {
      let filterParams = this.getAppliedFilters(viewId);

      if (!filterParams) {
        filterParams = {};
      }

      const paginationParams = this.getPaginationParams(filterParams, options, cursor, groupId, subGroupId);
      return paginationParams;
    }
  );

  fetchFilters = async (workspaceSlug: string, viewId: string, options?: { preferredLayout?: EIssueLayoutTypes }) => {
    const _filters = this.handleIssuesLocalFilters.get(EIssuesStoreType.BOARD, workspaceSlug, undefined, viewId);
    const preferredLayout = options?.preferredLayout ?? EIssueLayoutTypes.SPREADSHEET;
    const savedLayout = _filters?.display_filters?.layout as EIssueLayoutTypes | undefined;
    // When opening a hub tab (backlog / list / views), honour preferredLayout over saved layout.
    const defaultLayout = options?.preferredLayout
      ? preferredLayout
      :       savedLayout &&
          [
            EIssueLayoutTypes.SPREADSHEET,
            EIssueLayoutTypes.LIST,
            EIssueLayoutTypes.KANBAN,
            EIssueLayoutTypes.GANTT,
            EIssueLayoutTypes.CALENDAR,
          ].includes(savedLayout)
        ? savedLayout
        : preferredLayout;

    let displayFilters = this.computedDisplayFilters(_filters?.display_filters, {
      layout: defaultLayout,
      order_by: "-created_at",
    });
    let displayProperties =
      options?.preferredLayout === EIssueLayoutTypes.LIST
        ? resolveBoardListDisplayProperties(_filters?.display_properties)
        : this.computedDisplayProperties(_filters?.display_properties);
    const kanbanFilters: TIssueKanbanFilters = {
      group_by: _filters?.kanban_filters?.group_by || [],
      sub_group_by: _filters?.kanban_filters?.sub_group_by || [],
    };

    // viewId = board slug — não é global view UUID; filtros só em localStorage
    const richFilters: TWorkItemFilterExpression = _filters?.rich_filters ?? {};

    if (displayFilters.order_by === "sort_order") {
      displayFilters = { ...displayFilters, order_by: "-created_at" };
    }

    if (displayFilters.layout === EIssueLayoutTypes.KANBAN && displayFilters.group_by == null) {
      displayFilters = { ...displayFilters, group_by: "state" };
    }

    if (options?.preferredLayout === EIssueLayoutTypes.LIST) {
      displayFilters = { ...displayFilters, layout: EIssueLayoutTypes.LIST };
    }

    // Quadro multi-projeto: grupos de estado do workspace (como «Os meus itens»), não colunas por state_id.
    if (options?.preferredLayout === EIssueLayoutTypes.KANBAN) {
      displayFilters = {
        ...displayFilters,
        layout: EIssueLayoutTypes.KANBAN,
        group_by: "state_detail.group",
      };
    }

    if (options?.preferredLayout === EIssueLayoutTypes.GANTT) {
      displayFilters = { ...displayFilters, layout: EIssueLayoutTypes.GANTT };
    }

    if (options?.preferredLayout === EIssueLayoutTypes.SPREADSHEET) {
      displayFilters = { ...displayFilters, layout: EIssueLayoutTypes.SPREADSHEET };
    }

    if (options?.preferredLayout === EIssueLayoutTypes.CALENDAR) {
      displayFilters = {
        ...displayFilters,
        layout: EIssueLayoutTypes.CALENDAR,
        calendar: {
          layout: displayFilters.calendar?.layout ?? "month",
          show_weekends: displayFilters.calendar?.show_weekends ?? false,
        },
      };
    }

    runInAction(() => {
      set(this.filters, [viewId, "richFilters"], richFilters);
      set(this.filters, [viewId, "displayFilters"], displayFilters);
      set(this.filters, [viewId, "displayProperties"], displayProperties);
      set(this.filters, [viewId, "kanbanFilters"], kanbanFilters);
    });
  };

  /**
   * NOTE: This method is designed as a fallback function for the work item filter store.
   * Only use this method directly when initializing filter instances.
   * For regular filter updates, use this method as a fallback function for the work item filter store methods instead.
   */
  updateFilterExpression: IBoardIssuesFilter["updateFilterExpression"] = async (workspaceSlug, viewId, filters) => {
    try {
      runInAction(() => {
        set(this.filters, [viewId, "richFilters"], filters);
      });

      this.handleIssuesLocalFilters.set(EIssuesStoreType.BOARD, EIssueFilterType.FILTERS, workspaceSlug, viewId, undefined, {
        rich_filters: filters,
      });

      this.rootIssueStore.boardIssues.fetchIssuesWithExistingPagination(workspaceSlug, viewId, "mutation");
    } catch (error) {
      console.log("error while updating rich filters", error);
      throw error;
    }
  };

  updateFilters: IBoardIssuesFilter["updateFilters"] = async (workspaceSlug, projectId, type, filters, viewId) => {
    try {
      const issueFilters = this.getIssueFilters(viewId);

      if (!issueFilters) return;

      const _filters = {
        richFilters: issueFilters.richFilters,
        displayFilters: issueFilters.displayFilters as IIssueDisplayFilterOptions,
        displayProperties: issueFilters.displayProperties as IIssueDisplayProperties,
        kanbanFilters: issueFilters.kanbanFilters as TIssueKanbanFilters,
      };

      switch (type) {
        case EIssueFilterType.DISPLAY_FILTERS: {
          const updatedDisplayFilters = filters as IIssueDisplayFilterOptions;
          _filters.displayFilters = { ..._filters.displayFilters, ...updatedDisplayFilters };

          // set sub_group_by to null if group_by is set to null
          if (_filters.displayFilters.group_by === null) {
            _filters.displayFilters.sub_group_by = null;
            updatedDisplayFilters.sub_group_by = null;
          }
          // set sub_group_by to null if layout is switched to kanban group_by and sub_group_by are same
          if (
            _filters.displayFilters.layout === "kanban" &&
            _filters.displayFilters.group_by === _filters.displayFilters.sub_group_by
          ) {
            _filters.displayFilters.sub_group_by = null;
            updatedDisplayFilters.sub_group_by = null;
          }
          // set group_by to state if layout is switched to kanban and group_by is null
          if (_filters.displayFilters.layout === "kanban" && _filters.displayFilters.group_by === null) {
            _filters.displayFilters.group_by = "state";
            updatedDisplayFilters.group_by = "state";
          }

          runInAction(() => {
            Object.keys(updatedDisplayFilters).forEach((_key) => {
              set(
                this.filters,
                [viewId, "displayFilters", _key],
                updatedDisplayFilters[_key as keyof IIssueDisplayFilterOptions]
              );
            });
          });

          this.rootIssueStore.boardIssues.fetchIssuesWithExistingPagination(workspaceSlug, viewId, "mutation");

          if (viewId) {
            this.handleIssuesLocalFilters.set(EIssuesStoreType.BOARD, type, workspaceSlug, undefined, viewId, {
              display_filters: _filters.displayFilters,
            });
          }
          break;
        }
        case EIssueFilterType.DISPLAY_PROPERTIES: {
          const updatedDisplayProperties = filters as IIssueDisplayProperties;
          _filters.displayProperties = { ..._filters.displayProperties, ...updatedDisplayProperties };

          runInAction(() => {
            Object.keys(updatedDisplayProperties).forEach((_key) => {
              set(
                this.filters,
                [viewId, "displayProperties", _key],
                updatedDisplayProperties[_key as keyof IIssueDisplayProperties]
              );
            });
            if (["all-issues", "assigned", "created", "subscribed"].includes(viewId))
              this.handleIssuesLocalFilters.set(EIssuesStoreType.BOARD, type, workspaceSlug, undefined, viewId, {
                display_properties: _filters.displayProperties,
              });
          });
          break;
        }

        case EIssueFilterType.KANBAN_FILTERS: {
          const updatedKanbanFilters = filters as TIssueKanbanFilters;
          _filters.kanbanFilters = { ..._filters.kanbanFilters, ...updatedKanbanFilters };

          const currentUserId = this.rootIssueStore.currentUserId;
          if (currentUserId)
            this.handleIssuesLocalFilters.set(EIssuesStoreType.BOARD, type, workspaceSlug, undefined, viewId, {
              kanban_filters: _filters.kanbanFilters,
            });

          runInAction(() => {
            Object.keys(updatedKanbanFilters).forEach((_key) => {
              set(
                this.filters,
                [viewId, "kanbanFilters", _key],
                updatedKanbanFilters[_key as keyof TIssueKanbanFilters]
              );
            });
          });

          break;
        }
        default:
          break;
      }
    } catch (error) {
      if (viewId) this.fetchFilters(workspaceSlug, viewId);
      throw error;
    }
  };
}
