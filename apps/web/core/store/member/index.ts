import { makeObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";
// operoz imports
import type { IUserLite } from "@operoz/types";
// operoz web imports
import type { IProjectMemberStore } from "@/operoz-web/store/member/project-member.store";
import { ProjectMemberStore } from "@/operoz-web/store/member/project-member.store";
import type { RootStore } from "@/operoz-web/store/root.store";
// local imports
import type { IWorkspaceMemberStore } from "./workspace/workspace-member.store";
import { WorkspaceMemberStore } from "./workspace/workspace-member.store";

export interface IMemberRootStore {
  // observables
  memberMap: Record<string, IUserLite>;
  // computed actions
  getMemberIds: () => string[];
  getUserDetails: (userId: string) => IUserLite | undefined;
  // sub-stores
  workspace: IWorkspaceMemberStore;
  project: IProjectMemberStore;
}

export class MemberRootStore implements IMemberRootStore {
  // observables
  memberMap: Record<string, IUserLite> = {};
  // sub-stores
  workspace: IWorkspaceMemberStore;
  project: IProjectMemberStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      memberMap: observable,
    });
    // sub-stores
    this.workspace = new WorkspaceMemberStore(this, _rootStore);
    this.project = new ProjectMemberStore(this, _rootStore);
  }

  /**
   * @description get all member ids
   */
  getMemberIds = computedFn(() => Object.keys(this.memberMap));

  /**
   * @description get user details from userId
   * @param userId
   */
  getUserDetails = computedFn((userId: string): IUserLite | undefined => this.memberMap?.[userId] ?? undefined);
}
