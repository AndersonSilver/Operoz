import { autorun, makeObservable, observable, reaction, runInAction } from "mobx";
import { isEqual, set } from "lodash-es";
import { computedFn } from "mobx-utils";
import type { IBoardModule, TIssue, TIssueRelationMap } from "@operoz/types";
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
import {
  resolveBlockingAndBlockedByIds,
  issuePayloadIncludesRelations,
  parseIssueRelationsFromPayload,
} from "./parse-issue-relations";

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
  getModuleIdForIssue: (issueId: string) => string | null;
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
  private blocksRefreshPending = false;
  private dependencySyncPending = false;

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
      getModuleIdForIssue: false,
      beginCollapseScope: false,
      registerCollapsedDefaults: false,
    });

    autorun(() => {
      const { issuesMap, getIssueById } = this.rootStore.issue.issues;
      const { projectMap } = this.rootStore.projectRoot.project;

      void Object.keys(issuesMap).length;
      void Object.keys(projectMap).length;
      void Object.keys(this.boardModulesById).length;
      void this.blockIds?.length;
      void this.currentViewData?.data?.startDate;
      void this.currentViewData?.data?.dayWidth;
      void this.currentViewData?.key;
      trackGanttIssueFields(this.blockIds, getIssueById, { skipBoardGroupBlocks: true });

      if (!this.blockIds?.length) return;

      this.scheduleBlocksRefresh();
    });

    reaction(
      () => this.buildDependencySyncKey(),
      () => this.scheduleDependencySync(),
      { fireImmediately: true }
    );
  }

  private scheduleBlocksRefresh() {
    if (this.blocksRefreshPending) return;
    this.blocksRefreshPending = true;
    queueMicrotask(() => {
      this.blocksRefreshPending = false;
      if (!this.blockIds?.length) return;

      const { getIssueById } = this.rootStore.issue.issues;
      const { getPartialProjectById, getProjectIdentifierById } = this.rootStore.projectRoot.project;

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

      const { relationMap } = this.rootStore.issue.issueDetail.relation;
      this.syncDependencyIds(relationMap, getIssueById);
    });
  }

  private buildDependencySyncKey(): string {
    if (!this.blockIds?.length) return "";

    const { relationMap } = this.rootStore.issue.issueDetail.relation;
    const { getIssueById } = this.rootStore.issue.issues;

    const issueIds = this.blockIds.filter((id) => !isBoardProjectBlockId(id) && !isBoardModuleBlockId(id));

    const relationsKey = issueIds
      .map((id) => {
        const relations = relationMap[id];
        const fromMap = `${relations?.blocking?.join(",") ?? ""}:${relations?.blocked_by?.join(",") ?? ""}`;
        const issue = getIssueById(id);
        if (!issue || !issuePayloadIncludesRelations(issue)) return `${id}:${fromMap}`;
        const parsed = parseIssueRelationsFromPayload(issue);
        return `${id}:${fromMap}|${parsed.blocking?.join(",") ?? ""}|${parsed.blocked_by?.join(",") ?? ""}`;
      })
      .join(";");

    const blocksReady = issueIds.filter((id) => Boolean(this.blocksMap[id])).length;

    return `${relationsKey}|blocks:${blocksReady}`;
  }

  private scheduleDependencySync() {
    if (this.dependencySyncPending) return;
    this.dependencySyncPending = true;
    queueMicrotask(() => {
      this.dependencySyncPending = false;
      if (!this.blockIds?.length) return;

      const { relationMap } = this.rootStore.issue.issueDetail.relation;
      const { getIssueById } = this.rootStore.issue.issues;
      this.syncDependencyIds(relationMap, getIssueById);
    });
  }

  /**
   * Reads blocking/blocked_by relations from the issue relation store and writes
   * them into the corresponding IGanttBlock entries so TimelineDependencyPaths
   * can draw the arrows. Skips board-project and board-module group rows.
   */
  private syncDependencyIds(relationMap: TIssueRelationMap, getIssueById: (id: string) => TIssue | undefined) {
    if (!this.blockIds?.length) return;

    runInAction(() => {
      for (const blockId of this.blockIds!) {
        if (!this.blocksMap[blockId]) continue;
        if (isBoardProjectBlockId(blockId) || isBoardModuleBlockId(blockId)) continue;

        const { blockingIds, blockedByIds } = resolveBlockingAndBlockedByIds(
          relationMap,
          blockId,
          getIssueById(blockId)
        );

        const block = this.blocksMap[blockId];
        if (isEqual(block.blocking_ids, blockingIds) && isEqual(block.blocked_by_ids, blockedByIds)) {
          continue;
        }

        set(this.blocksMap, [blockId, "blocking_ids"], blockingIds);
        set(this.blocksMap, [blockId, "blocked_by_ids"], blockedByIds);
      }
    });
  }

  setBoardModules = (modules: IBoardModule[]) => {
    runInAction(() => {
      this.boardModulesById = Object.fromEntries(modules.map((boardModule) => [boardModule.id, boardModule]));
    });
  };

  getModuleIdForIssue = computedFn((issueId: string): string | null => {
    if (!this.blockIds?.length) return null;

    let currentModuleId: string | null = null;

    for (const blockId of this.blockIds) {
      if (isBoardModuleBlockId(blockId)) {
        currentModuleId = getModuleIdFromBoardBlock(blockId);
        continue;
      }

      if (isBoardProjectBlockId(blockId)) {
        currentModuleId = null;
        continue;
      }

      if (blockId === issueId) {
        return currentModuleId;
      }
    }

    return null;
  });

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
