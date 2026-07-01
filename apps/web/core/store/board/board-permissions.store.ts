import { makeAutoObservable, runInAction } from "mobx";
import type { IProjectBoardPermissions } from "@operoz/types";
import { BoardPermissionsService } from "@/services/board/board-permissions.service";
import { canPerformBoardPermission } from "@/utils/board-permissions";

export interface IBoardPermissionsStore {
  fetchProjectBoardPermissions: (workspaceSlug: string, projectId: string) => Promise<IProjectBoardPermissions>;
  getProjectBoardPermissions: (workspaceSlug: string, projectId: string) => IProjectBoardPermissions | undefined;
  canBoardPermission: (workspaceSlug: string, projectId: string, permissionKey: string) => boolean;
  clearProjectBoardPermissions: () => void;
}

export class BoardPermissionsStore implements IBoardPermissionsStore {
  private service: BoardPermissionsService;
  private permissionsByProject: Record<string, IProjectBoardPermissions> = {};
  /** Evita requisições duplicadas em paralelo para o mesmo projeto. */
  private inflightFetches = new Map<string, Promise<IProjectBoardPermissions>>();

  constructor() {
    makeAutoObservable(this);
    this.service = new BoardPermissionsService();
  }

  private cacheKey(workspaceSlug: string, projectId: string) {
    return `${workspaceSlug}:${projectId}`;
  }

  getProjectBoardPermissions = (workspaceSlug: string, projectId: string) =>
    this.permissionsByProject[this.cacheKey(workspaceSlug, projectId)];

  fetchProjectBoardPermissions = async (workspaceSlug: string, projectId: string) => {
    const key = this.cacheKey(workspaceSlug, projectId);
    const cached = this.permissionsByProject[key];
    if (cached) return cached;

    const inflight = this.inflightFetches.get(key);
    if (inflight) return inflight;

    const promise = this.service
      .getProjectBoardPermissions(workspaceSlug, projectId)
      .then((data) => {
        runInAction(() => {
          this.permissionsByProject[key] = data;
        });
        return data;
      })
      .finally(() => {
        this.inflightFetches.delete(key);
      });

    this.inflightFetches.set(key, promise);
    return promise;
  };

  canBoardPermission = (workspaceSlug: string, projectId: string, permissionKey: string) =>
    canPerformBoardPermission(this.getProjectBoardPermissions(workspaceSlug, projectId), permissionKey);

  clearProjectBoardPermissions = () => {
    this.inflightFetches.clear();
    runInAction(() => {
      this.permissionsByProject = {};
    });
  };
}
