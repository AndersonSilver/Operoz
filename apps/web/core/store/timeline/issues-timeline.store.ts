import { autorun } from "mobx";
// Plane-web
import type { RootStore } from "@/plane-web/store/root.store";
import type { IBaseTimelineStore } from "@/plane-web/store/timeline/base-timeline.store";
import { BaseTimeLineStore } from "@/plane-web/store/timeline/base-timeline.store";
import { trackGanttIssueFields } from "./track-gantt-issue-fields";

export interface IIssuesTimeLineStore extends IBaseTimelineStore {
  isDependencyEnabled: boolean;
}

export class IssuesTimeLineStore extends BaseTimeLineStore implements IIssuesTimeLineStore {
  constructor(_rootStore: RootStore) {
    super(_rootStore);

    autorun(() => {
      const { issuesMap, getIssueById } = this.rootStore.issue.issues;
      // Observe issuesMap so blocks refresh when issues load after blockIds are set.
      void Object.keys(issuesMap).length;
      trackGanttIssueFields(this.blockIds, getIssueById);
      if (!this.blockIds?.length) return;
      queueMicrotask(() => this.updateBlocks(getIssueById));
    });
  }
}
