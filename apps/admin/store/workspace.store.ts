import { set } from "lodash-es";
import { action, observable, runInAction, makeObservable, computed } from "mobx";
// plane imports
import { InstanceWorkspaceService } from "@operoz/services";
import type { IWorkspace, TLoader, TPaginationInfo } from "@operoz/types";
// root store
import type { RootStore } from "@/store/root.store";

export interface IWorkspaceStore {
  // observables
  loader: TLoader;
  workspaces: Record<string, IWorkspace>;
  paginationInfo: TPaginationInfo | undefined;
  // computed
  workspaceIds: string[];
  // helper actions
  hydrate: (data: Record<string, IWorkspace>) => void;
  getWorkspaceById: (workspaceId: string) => IWorkspace | undefined;
  // fetch actions
  fetchWorkspaces: () => Promise<IWorkspace[]>;
  fetchNextWorkspaces: () => Promise<IWorkspace[]>;
  // curd actions
  createWorkspace: (data: IWorkspace) => Promise<IWorkspace>;
  updateWorkspace: (
    workspaceId: string,
    data: Partial<Pick<IWorkspace, "name" | "slug" | "organization_size">>
  ) => Promise<IWorkspace>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  patchWorkspaceIssueNotificationFlags: (
    workspaceId: string,
    data: Partial<
      Pick<
        IWorkspace,
        | "issue_notify_assignees_always_email"
        | "issue_notify_email_include_extended_activities"
        | "issue_notify_email_include_description_changes"
        | "issue_notify_email_dispatch_immediately"
      >
    >
  ) => Promise<void>;
  patchWorkspaceIntegrationFlags: (
    workspaceId: string,
    data: Partial<Pick<IWorkspace, "is_google_calendar_enabled" | "is_discord_dm_enabled">>
  ) => Promise<void>;
}

export class WorkspaceStore implements IWorkspaceStore {
  // observables
  loader: TLoader = "init-loader";
  workspaces: Record<string, IWorkspace> = {};
  paginationInfo: TPaginationInfo | undefined = undefined;
  // services
  instanceWorkspaceService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable,
      workspaces: observable,
      paginationInfo: observable,
      // computed
      workspaceIds: computed,
      // helper actions
      hydrate: action,
      getWorkspaceById: action,
      // fetch actions
      fetchWorkspaces: action,
      fetchNextWorkspaces: action,
      // curd actions
      createWorkspace: action,
      updateWorkspace: action,
      deleteWorkspace: action,
      patchWorkspaceIssueNotificationFlags: action,
      patchWorkspaceIntegrationFlags: action,
    });
    this.instanceWorkspaceService = new InstanceWorkspaceService();
  }

  // computed
  get workspaceIds() {
    return Object.keys(this.workspaces);
  }

  // helper actions
  /**
   * @description Hydrates the workspaces
   * @param data - Record<string, IWorkspace>
   */
  hydrate = (data: Record<string, IWorkspace>) => {
    if (data) this.workspaces = data;
  };

  /**
   * @description Gets a workspace by id
   * @param workspaceId - string
   * @returns IWorkspace | undefined
   */
  getWorkspaceById = (workspaceId: string) => this.workspaces[workspaceId];

  // fetch actions
  /**
   * @description Fetches all workspaces
   * @returns Promise<>
   */
  fetchWorkspaces = async (): Promise<IWorkspace[]> => {
    try {
      if (this.workspaceIds.length > 0) {
        this.loader = "mutation";
      } else {
        this.loader = "init-loader";
      }
      const paginatedWorkspaceData = await this.instanceWorkspaceService.list();
      runInAction(() => {
        const { results, ...paginationInfo } = paginatedWorkspaceData;
        results.forEach((workspace: IWorkspace) => {
          set(this.workspaces, [workspace.id], workspace);
        });
        set(this, "paginationInfo", paginationInfo);
      });
      return paginatedWorkspaceData.results;
    } catch (error) {
      console.error("Error fetching workspaces", error);
      throw error;
    } finally {
      this.loader = "loaded";
    }
  };

  /**
   * @description Fetches the next page of workspaces
   * @returns Promise<IWorkspace[]>
   */
  fetchNextWorkspaces = async (): Promise<IWorkspace[]> => {
    if (!this.paginationInfo || this.paginationInfo.next_page_results === false) return [];
    try {
      this.loader = "pagination";
      const paginatedWorkspaceData = await this.instanceWorkspaceService.list(this.paginationInfo.next_cursor);
      runInAction(() => {
        const { results, ...paginationInfo } = paginatedWorkspaceData;
        results.forEach((workspace: IWorkspace) => {
          set(this.workspaces, [workspace.id], workspace);
        });
        set(this, "paginationInfo", paginationInfo);
      });
      return paginatedWorkspaceData.results;
    } catch (error) {
      console.error("Error fetching next workspaces", error);
      throw error;
    } finally {
      this.loader = "loaded";
    }
  };

  // curd actions
  /**
   * @description Creates a new workspace
   * @param data - IWorkspace
   * @returns Promise<IWorkspace>
   */
  createWorkspace = async (data: IWorkspace): Promise<IWorkspace> => {
    try {
      this.loader = "mutation";
      const workspace = await this.instanceWorkspaceService.create(data);
      runInAction(() => {
        set(this.workspaces, [workspace.id], workspace);
      });
      return workspace;
    } catch (error) {
      console.error("Error creating workspace", error);
      throw error;
    } finally {
      this.loader = "loaded";
    }
  };

  updateWorkspace = async (
    workspaceId: string,
    data: Partial<Pick<IWorkspace, "name" | "slug" | "organization_size">>
  ): Promise<IWorkspace> => {
    try {
      this.loader = "mutation";
      const workspace = await this.instanceWorkspaceService.update(workspaceId, data);
      runInAction(() => {
        set(this.workspaces, [workspace.id], workspace);
      });
      return workspace;
    } catch (error) {
      console.error("Error updating workspace", error);
      throw error;
    } finally {
      this.loader = "loaded";
    }
  };

  deleteWorkspace = async (workspaceId: string): Promise<void> => {
    try {
      this.loader = "mutation";
      await this.instanceWorkspaceService.destroy(workspaceId);
      runInAction(() => {
        const next = { ...this.workspaces };
        delete next[workspaceId];
        this.workspaces = next;
      });
    } catch (error) {
      console.error("Error deleting workspace", error);
      throw error;
    } finally {
      this.loader = "loaded";
    }
  };

  /**
   * @description PATCH issue notification flags for a workspace (merges into cached workspace).
   */
  patchWorkspaceIssueNotificationFlags = async (
    workspaceId: string,
    data: Partial<
      Pick<
        IWorkspace,
        | "issue_notify_assignees_always_email"
        | "issue_notify_email_include_extended_activities"
        | "issue_notify_email_include_description_changes"
        | "issue_notify_email_dispatch_immediately"
      >
    >
  ): Promise<void> => {
    try {
      this.loader = "mutation";
      const updated = await this.instanceWorkspaceService.patchIssueNotificationFlags(workspaceId, data);
      runInAction(() => {
        const existing = this.workspaces[workspaceId];
        if (existing) {
          set(this.workspaces, [workspaceId], { ...existing, ...updated });
        }
      });
    } catch (error) {
      console.error("Error updating workspace notification flags", error);
      throw error;
    } finally {
      this.loader = "loaded";
    }
  };

  patchWorkspaceIntegrationFlags = async (
    workspaceId: string,
    data: Partial<Pick<IWorkspace, "is_google_calendar_enabled" | "is_discord_dm_enabled">>
  ): Promise<void> => {
    try {
      this.loader = "mutation";
      const updated = await this.instanceWorkspaceService.patchIntegrationFlags(workspaceId, data);
      runInAction(() => {
        const existing = this.workspaces[workspaceId];
        if (existing) {
          set(this.workspaces, [workspaceId], { ...existing, ...updated });
        }
      });
    } catch (error) {
      console.error("Error updating workspace integration flags", error);
      throw error;
    } finally {
      this.loader = "loaded";
    }
  };
}
