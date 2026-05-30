import { autorun, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import type { IBoardModule, TIssue } from "@operis/types";
import type { RootStore } from "@/plane-web/store/root.store";
import type { IBaseTimelineStore } from "@/plane-web/store/timeline/base-timeline.store";
import { BaseTimeLineStore } from "@/plane-web/store/timeline/base-timeline.store";
import {
  getModuleIdFromBoardBlock,
  getProjectIdFromBoardBlock,
  isBoardModuleBlockId,
  isBoardProjectBlockId,
  resolveBoardModuleGanttRow,
  resolveBoardProjectGanttRow,
} from "@/components/issues/issue-layouts/gantt/board-gantt.utils";
import { trackGanttIssueFields } from "./track-gantt-issue-fields";

export interface IBoardGroupedTimelineStore extends IBaseTimelineStore {
  collapsedProjectIds: Set<string>;
  collapsedModuleIds: Set<string>;
  boardModulesById: Record<string, IBoardModule>;
  toggleProjectCollapsed: (projectId: string) => void;
  isProjectCollapsed: (projectId: string) => boolean;
  expandAllProjects: () => void;
  toggleModuleCollapsed: (moduleId: string) => void;
  isModuleCollapsed: (moduleId: string) => boolean;
  setBoardModules: (modules: IBoardModule[]) => void;
  beginCollapseScope: (scopeKey: string) => void;
  registerCollapsedDefaults: (projectIds: string[], moduleIds: string[]) => void;
}

export class BoardGroupedTimelineStore extends BaseTimeLineStore implements IBoardGroupedTimelineStore {
  collapsedProjectIds: Set<string> = new Set();
  collapsedModuleIds: Set<string> = new Set();
  boardModulesById: Record<string, IBoardModule> = {};
  private collapseScopeKey = "";
  private seenCollapsedProjectIds = new Set<string>();
  private seenCollapsedModuleIds = new Set<string>();

  constructor(_rootStore: RootStore) {
    super(_rootStore);

    makeObservable(this, {
      collapsedProjectIds: observable.ref,
      collapsedModuleIds: observable.ref,
      boardModulesById: observable.ref,
      toggleProjectCollapsed: false,
      expandAllProjects: false,
      toggleModuleCollapsed: false,
      setBoardModules: false,
      beginCollapseScope: false,
      registerCollapsedDefaults: false,
    });

    autorun(() => {
      const { issuesMap, getIssueById } = this.rootStore.issue.issues;
      const { projectMap, getPartialProjectById, getProjectIdentifierById } = this.rootStore.projectRoot.project;

      void Object.keys(issuesMap).length;
      void Object.keys(projectMap).length;
      void Object.keys(this.boardModulesById).length;
      void this.blockIds?.length;
      void this.currentViewData?.data?.startDate;
      void this.currentViewData?.data?.dayWidth;
      void this.currentViewData?.key;
      trackGanttIssueFields(this.blockIds, getIssueById, { skipBoardGroupBlocks: true });

      if (!this.blockIds?.length) return;

      queueMicrotask(() => {
        this.updateBlocks((blockId) => {
          if (isBoardProjectBlockId(blockId)) {
            const projectId = getProjectIdFromBoardBlock(blockId);
            const childIssueIds =
              this.blockIds?.filter((id) => {
                if (isBoardProjectBlockId(id) || isBoardModuleBlockId(id)) return false;
                return getIssueById(id)?.project_id === projectId;
              }) ?? [];

            return resolveBoardProjectGanttRow(
              projectId,
              childIssueIds,
              getIssueById,
              getPartialProjectById,
              getProjectIdentifierById
            );
          }

          if (isBoardModuleBlockId(blockId)) {
            const moduleId = getModuleIdFromBoardBlock(blockId);
            const boardModule = this.boardModulesById[moduleId];
            if (!boardModule) return undefined;
            return resolveBoardModuleGanttRow(boardModule);
          }

          return getIssueById(blockId) as TIssue | undefined;
        });
      });
    });
  }

  setBoardModules = (modules: IBoardModule[]) => {
    runInAction(() => {
      this.boardModulesById = Object.fromEntries(modules.map((boardModule) => [boardModule.id, boardModule]));
    });
  };

  /** Reinicia o estado de colapso ao trocar de board/cronograma. */
  beginCollapseScope = (scopeKey: string) => {
    if (this.collapseScopeKey === scopeKey) return;
    runInAction(() => {
      this.collapseScopeKey = scopeKey;
      this.collapsedProjectIds = new Set();
      this.collapsedModuleIds = new Set();
      this.seenCollapsedProjectIds = new Set();
      this.seenCollapsedModuleIds = new Set();
    });
  };

  /** Novos projetos/módulos entram recolhidos; os que o usuário abriu não são forçados a fechar. */
  registerCollapsedDefaults = (projectIds: string[], moduleIds: string[]) => {
    runInAction(() => {
      const nextProjects = new Set(this.collapsedProjectIds);
      const nextModules = new Set(this.collapsedModuleIds);
      let changed = false;

      for (const projectId of projectIds) {
        if (this.seenCollapsedProjectIds.has(projectId)) continue;
        this.seenCollapsedProjectIds.add(projectId);
        nextProjects.add(projectId);
        changed = true;
      }

      for (const moduleId of moduleIds) {
        if (this.seenCollapsedModuleIds.has(moduleId)) continue;
        this.seenCollapsedModuleIds.add(moduleId);
        nextModules.add(moduleId);
        changed = true;
      }

      if (changed) {
        this.collapsedProjectIds = nextProjects;
        this.collapsedModuleIds = nextModules;
      }
    });
  };

  toggleProjectCollapsed = (projectId: string) => {
    runInAction(() => {
      const next = new Set(this.collapsedProjectIds);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      this.collapsedProjectIds = next;
    });
  };

  expandAllProjects = () => {
    runInAction(() => {
      this.collapsedProjectIds = new Set();
    });
  };

  isProjectCollapsed = computedFn((projectId: string) => this.collapsedProjectIds.has(projectId));

  toggleModuleCollapsed = (moduleId: string) => {
    runInAction(() => {
      const next = new Set(this.collapsedModuleIds);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      this.collapsedModuleIds = next;
    });
  };

  isModuleCollapsed = computedFn((moduleId: string) => this.collapsedModuleIds.has(moduleId));
}
