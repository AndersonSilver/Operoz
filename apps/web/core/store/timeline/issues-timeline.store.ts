import { isEqual, set } from "lodash-es";
import { autorun, reaction, runInAction } from "mobx";
// Plane-web
import type { TIssueRelationMap, TIssue } from "@operoz/types";
import type { RootStore } from "@/plane-web/store/root.store";
import type { IBaseTimelineStore } from "@/plane-web/store/timeline/base-timeline.store";
import { BaseTimeLineStore } from "@/plane-web/store/timeline/base-timeline.store";
import { trackGanttIssueFields } from "./track-gantt-issue-fields";
import {
  resolveBlockingAndBlockedByIds,
  issuePayloadIncludesRelations,
  parseIssueRelationsFromPayload,
} from "./parse-issue-relations";

export interface IIssuesTimeLineStore extends IBaseTimelineStore {
  isDependencyEnabled: boolean;
}

export class IssuesTimeLineStore extends BaseTimeLineStore implements IIssuesTimeLineStore {
  private blocksRefreshPending = false;
  private dependencySyncPending = false;

  constructor(_rootStore: RootStore) {
    super(_rootStore);

    autorun(() => {
      const { issuesMap, getIssueById } = this.rootStore.issue.issues;
      void Object.keys(issuesMap).length;
      trackGanttIssueFields(this.blockIds, getIssueById);
      if (!this.blockIds?.length) return;

      if (this.blocksRefreshPending) return;
      this.blocksRefreshPending = true;
      queueMicrotask(() => {
        this.blocksRefreshPending = false;
        if (!this.blockIds?.length) return;
        this.updateBlocks(getIssueById);

        const { relationMap } = this.rootStore.issue.issueDetail.relation;
        this.syncDependencyIds(relationMap, getIssueById);
      });
    });

    reaction(
      () => this.buildDependencySyncKey(),
      () => this.scheduleDependencySync(),
      { fireImmediately: true }
    );
  }

  private buildDependencySyncKey(): string {
    if (!this.blockIds?.length) return "";

    const { relationMap } = this.rootStore.issue.issueDetail.relation;
    const { getIssueById } = this.rootStore.issue.issues;

    const relationsKey = this.blockIds
      .map((id) => {
        const relations = relationMap[id];
        const fromMap = `${relations?.blocking?.join(",") ?? ""}:${relations?.blocked_by?.join(",") ?? ""}`;
        const issue = getIssueById(id);
        if (!issue || !issuePayloadIncludesRelations(issue)) return `${id}:${fromMap}`;
        const parsed = parseIssueRelationsFromPayload(issue);
        return `${id}:${fromMap}|${parsed.blocking?.join(",") ?? ""}|${parsed.blocked_by?.join(",") ?? ""}`;
      })
      .join(";");

    const blocksReady = this.blockIds.filter((id) => Boolean(this.blocksMap[id])).length;

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
   * can draw the arrows.
   */
  private syncDependencyIds(relationMap: TIssueRelationMap, getIssueById: (id: string) => TIssue | undefined) {
    if (!this.blockIds?.length) return;

    runInAction(() => {
      for (const blockId of this.blockIds!) {
        if (!this.blocksMap[blockId]) continue;

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
}
