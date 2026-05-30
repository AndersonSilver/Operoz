import { isEmpty, set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// base class
import { computedFn } from "mobx-utils";
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
import { EIssueLayoutTypes, EIssuesStoreType } from "@operis/types";
import { handleIssueQueryParamsByLayout } from "@operis/utils";
import {
  MODULE_KANBAN_GROUP_BY,
  resolveBoardListDisplayProperties,
} from "@/components/issues/issue-layouts/list-display-properties";
import { IssueFiltersService } from "@/services/issue_filter.service";
import type { IBaseIssueFilterStore } from "../helpers/issue-filter-helper.store";
import { IssueFilterHelperStore } from "../helpers/issue-filter-helper.store";
// helpers
// types
import type { IIssueRootStore } from "../root.store";
// constants
// services

export interface IModuleIssuesFilter extends IBaseIssueFilterStore {
  //helper actions
  getFilterParams: (
    options: IssuePaginationOptions,
    moduleId: string,
    cursor: string | undefined,
    groupId: string | undefined,
    subGroupId: string | undefined
  ) => Partial<Record<TIssueParams, string | boolean>>;
  getIssueFilters(moduleId: string): IIssueFilters | undefined;
  // action
  fetchFilters: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<void>;
  updateFilterExpression: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    filters: TWorkItemFilterExpression
  ) => Promise<void>;
  updateFilters: (
    workspaceSlug: string,
    projectId: string,
    filterType: TSupportedFilterTypeForUpdate,
    filters: TSupportedFilterForUpdate,
    moduleId: string
  ) => Promise<void>;
}

export class ModuleIssuesFilter extends IssueFilterHelperStore implements IModuleIssuesFilter {
  // observables
  filters: { [moduleId: string]: IIssueFilters } = {};
  // root store
  rootIssueStore: IIssueRootStore;
  // services
  issueFilterService;

  constructor(_rootStore: IIssueRootStore) {
    super();
    makeObservable(this, {
      // observables
      filters: observable,
      // computed
      issueFilters: computed,
      appliedFilters: computed,
      // actions
      fetchFilters: action,
      updateFilters: action,
    });
    // root store
    this.rootIssueStore = _rootStore;
    // services
    this.issueFilterService = new IssueFiltersService();
  }

  get issueFilters() {
    const moduleId = this.rootIssueStore.moduleId;
    if (!moduleId) return undefined;

    return this.getIssueFilters(moduleId);
  }

  get appliedFilters() {
    const moduleId = this.rootIssueStore.moduleId;
    if (!moduleId) return undefined;

    return this.getAppliedFilters(moduleId);
  }

  getIssueFilters(moduleId: string) {
    const displayFilters = this.filters[moduleId] || undefined;
    if (isEmpty(displayFilters)) return undefined;

    const _filters: IIssueFilters = this.computedIssueFilters(displayFilters);

    return {
      ..._filters,
      displayProperties: resolveBoardListDisplayProperties(_filters.displayProperties),
    };
  }

  getAppliedFilters(moduleId: string) {
    const userFilters = this.getIssueFilters(moduleId);
    if (!userFilters) return undefined;

    const filteredParams = handleIssueQueryParamsByLayout(userFilters?.displayFilters?.layout, "issues");
    if (!filteredParams) return undefined;

    if (filteredParams.includes("module")) filteredParams.splice(filteredParams.indexOf("module"), 1);

    const filteredRouteParams: Partial<Record<TIssueParams, string | boolean>> = this.computedFilteredParams(
      userFilters?.richFilters,
      userFilters?.displayFilters,
      filteredParams
    );

    return filteredRouteParams;
  }

  getFilterParams = computedFn(
    (
      options: IssuePaginationOptions,
      moduleId: string,
      cursor: string | undefined,
      groupId: string | undefined,
      subGroupId: string | undefined
    ) => {
      let filterParams = this.getAppliedFilters(moduleId);

      if (!filterParams) {
        filterParams = {};
      }
      filterParams["module"] = moduleId;

      const paginationParams = this.getPaginationParams(filterParams, options, cursor, groupId, subGroupId);
      return paginationParams;
    }
  );

  fetchFilters = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    const _filters = await this.issueFilterService.fetchModuleIssueFilters(workspaceSlug, projectId, moduleId);

    const richFilters: TWorkItemFilterExpression = _filters?.rich_filters;
    let displayFilters = this.computedDisplayFilters(_filters?.display_filters, {
      order_by: "-created_at",
    });
    const rawDisplayProperties = this.computedDisplayProperties(_filters?.display_properties);
    const displayProperties = resolveBoardListDisplayProperties(rawDisplayProperties);
    const hadNoVisibleColumns =
      _filters?.display_properties != null && !Object.values(rawDisplayProperties).some(Boolean);

    if (displayFilters.order_by === "sort_order") {
      displayFilters = { ...displayFilters, order_by: "-created_at" };
    }

    const hadListGroupedByState =
      displayFilters.layout === EIssueLayoutTypes.LIST && displayFilters.group_by != null;
    const hadCalendarGroupedByState =
      displayFilters.layout === EIssueLayoutTypes.CALENDAR && displayFilters.group_by != null;

    // Lista do board: um único bloco "All work items" (sem agrupar por estado).
    if (displayFilters.layout === EIssueLayoutTypes.LIST) {
      displayFilters = {
        ...displayFilters,
        group_by: null,
        sub_group_by: null,
        show_empty_groups: false,
      };
    }

    const hadKanbanWrongGroupBy =
      displayFilters.layout === EIssueLayoutTypes.KANBAN &&
      displayFilters.group_by !== MODULE_KANBAN_GROUP_BY;
    const hadKanbanEmptyGroupsHidden =
      displayFilters.layout === EIssueLayoutTypes.KANBAN && displayFilters.show_empty_groups === false;

    // Quadro: coluna por estado; colunas vazias visíveis para permitir arrastar.
    if (displayFilters.layout === EIssueLayoutTypes.KANBAN) {
      displayFilters = {
        ...displayFilters,
        group_by: MODULE_KANBAN_GROUP_BY,
        sub_group_by: null,
        show_empty_groups: true,
      };
    }

    // Calendário do board: fetch por intervalo de datas (group_by limpo no display).
    if (displayFilters.layout === EIssueLayoutTypes.CALENDAR) {
      displayFilters = {
        ...displayFilters,
        group_by: null,
        sub_group_by: null,
        calendar: {
          layout: displayFilters.calendar?.layout ?? "month",
          show_weekends: displayFilters.calendar?.show_weekends ?? false,
        },
      };
    }

    // fetching the kanban toggle helpers in the local storage
    const kanbanFilters = {
      group_by: [],
      sub_group_by: [],
    };
    const currentUserId = this.rootIssueStore.currentUserId;
    if (currentUserId) {
      const _kanbanFilters = this.handleIssuesLocalFilters.get(
        EIssuesStoreType.MODULE,
        workspaceSlug,
        moduleId,
        currentUserId
      );
      kanbanFilters.group_by = _kanbanFilters?.kanban_filters?.group_by || [];
      kanbanFilters.sub_group_by = _kanbanFilters?.kanban_filters?.sub_group_by || [];
    }

    runInAction(() => {
      set(this.filters, [moduleId, "richFilters"], richFilters);
      set(this.filters, [moduleId, "displayFilters"], displayFilters);
      set(this.filters, [moduleId, "displayProperties"], displayProperties);
      set(this.filters, [moduleId, "kanbanFilters"], kanbanFilters);
    });

    if (
      hadNoVisibleColumns ||
      hadListGroupedByState ||
      hadCalendarGroupedByState ||
      hadKanbanWrongGroupBy ||
      hadKanbanEmptyGroupsHidden
    ) {
      try {
        await this.issueFilterService.patchModuleIssueFilters(workspaceSlug, projectId, moduleId, {
          ...(hadNoVisibleColumns ? { display_properties: displayProperties } : {}),
          ...(hadListGroupedByState ||
          hadCalendarGroupedByState ||
          hadKanbanWrongGroupBy ||
          hadKanbanEmptyGroupsHidden
            ? { display_filters: displayFilters }
            : {}),
        });
      } catch (error) {
        console.warn("could not persist module list filters", error);
      }
    }
  };

  /**
   * NOTE: This method is designed as a fallback function for the work item filter store.
   * Only use this method directly when initializing filter instances.
   * For regular filter updates, use this method as a fallback function for the work item filter store methods instead.
   */
  updateFilterExpression: IModuleIssuesFilter["updateFilterExpression"] = async (
    workspaceSlug,
    projectId,
    moduleId,
    filters
  ) => {
    try {
      runInAction(() => {
        set(this.filters, [moduleId, "richFilters"], filters);
      });

      this.rootIssueStore.moduleIssues.fetchIssuesWithExistingPagination(
        workspaceSlug,
        projectId,
        "mutation",
        moduleId
      );
      await this.issueFilterService.patchModuleIssueFilters(workspaceSlug, projectId, moduleId, {
        rich_filters: filters,
      });
    } catch (error) {
      console.log("error while updating rich filters", error);
      throw error;
    }
  };

  updateFilters: IModuleIssuesFilter["updateFilters"] = async (workspaceSlug, projectId, type, filters, moduleId) => {
    try {
      if (isEmpty(this.filters) || isEmpty(this.filters[moduleId])) return;

      const _filters = {
        richFilters: this.filters[moduleId].richFilters,
        displayFilters: this.filters[moduleId].displayFilters as IIssueDisplayFilterOptions,
        displayProperties: this.filters[moduleId].displayProperties as IIssueDisplayProperties,
        kanbanFilters: this.filters[moduleId].kanbanFilters as TIssueKanbanFilters,
      };

      switch (type) {
        case EIssueFilterType.DISPLAY_FILTERS: {
          const updatedDisplayFilters = filters as IIssueDisplayFilterOptions;
          _filters.displayFilters = { ..._filters.displayFilters, ...updatedDisplayFilters };

          // Ao mudar para lista, igual ao board: sem agrupamento por estado.
          if (updatedDisplayFilters.layout === EIssueLayoutTypes.LIST) {
            _filters.displayFilters.group_by = null;
            _filters.displayFilters.sub_group_by = null;
            _filters.displayFilters.show_empty_groups = false;
            updatedDisplayFilters.group_by = null;
            updatedDisplayFilters.sub_group_by = null;
            updatedDisplayFilters.show_empty_groups = false;
          }

          // Quadro: uma coluna por estado do fluxo do projeto.
          if (updatedDisplayFilters.layout === EIssueLayoutTypes.KANBAN) {
            _filters.displayFilters.group_by = MODULE_KANBAN_GROUP_BY;
            _filters.displayFilters.sub_group_by = null;
            _filters.displayFilters.show_empty_groups = true;
            updatedDisplayFilters.group_by = MODULE_KANBAN_GROUP_BY;
            updatedDisplayFilters.sub_group_by = null;
            updatedDisplayFilters.show_empty_groups = true;
          }

          // Calendário: layout mensal/semanal; fetch usa target_date no pedido.
          if (updatedDisplayFilters.layout === EIssueLayoutTypes.CALENDAR) {
            _filters.displayFilters.group_by = null;
            _filters.displayFilters.sub_group_by = null;
            _filters.displayFilters.calendar = {
              layout: _filters.displayFilters.calendar?.layout ?? "month",
              show_weekends: _filters.displayFilters.calendar?.show_weekends ?? false,
            };
            updatedDisplayFilters.group_by = null;
            updatedDisplayFilters.sub_group_by = null;
            updatedDisplayFilters.calendar = _filters.displayFilters.calendar;
          }

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
          runInAction(() => {
            Object.keys(updatedDisplayFilters).forEach((_key) => {
              set(
                this.filters,
                [moduleId, "displayFilters", _key],
                updatedDisplayFilters[_key as keyof IIssueDisplayFilterOptions]
              );
            });
          });

          if (this.getShouldClearIssues(updatedDisplayFilters)) {
            runInAction(() => {
              this.rootIssueStore.moduleIssues.groupedIssueIds = undefined;
              this.rootIssueStore.moduleIssues.issuePaginationData = {};
              this.rootIssueStore.moduleIssues.groupedIssueCount = {};
              this.rootIssueStore.moduleIssues.paginationOptions = undefined;
              this.rootIssueStore.moduleIssues.loader = {};
            });
          }

          if (this.getShouldReFetchIssues(updatedDisplayFilters)) {
            this.rootIssueStore.moduleIssues.fetchIssuesWithExistingPagination(
              workspaceSlug,
              projectId,
              "mutation",
              moduleId
            );
          }

          await this.issueFilterService.patchModuleIssueFilters(workspaceSlug, projectId, moduleId, {
            display_filters: _filters.displayFilters,
          });

          break;
        }
        case EIssueFilterType.DISPLAY_PROPERTIES: {
          const updatedDisplayProperties = filters as IIssueDisplayProperties;
          _filters.displayProperties = { ..._filters.displayProperties, ...updatedDisplayProperties };

          runInAction(() => {
            Object.keys(updatedDisplayProperties).forEach((_key) => {
              set(
                this.filters,
                [moduleId, "displayProperties", _key],
                updatedDisplayProperties[_key as keyof IIssueDisplayProperties]
              );
            });
          });

          await this.issueFilterService.patchModuleIssueFilters(workspaceSlug, projectId, moduleId, {
            display_properties: _filters.displayProperties,
          });
          break;
        }

        case EIssueFilterType.KANBAN_FILTERS: {
          const updatedKanbanFilters = filters as TIssueKanbanFilters;
          _filters.kanbanFilters = { ..._filters.kanbanFilters, ...updatedKanbanFilters };

          const currentUserId = this.rootIssueStore.currentUserId;
          if (currentUserId)
            this.handleIssuesLocalFilters.set(EIssuesStoreType.MODULE, type, workspaceSlug, moduleId, currentUserId, {
              kanban_filters: _filters.kanbanFilters,
            });

          runInAction(() => {
            Object.keys(updatedKanbanFilters).forEach((_key) => {
              set(
                this.filters,
                [moduleId, "kanbanFilters", _key],
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
      if (moduleId) this.fetchFilters(workspaceSlug, projectId, moduleId);
      throw error;
    }
  };
}
