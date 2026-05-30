import { action, makeObservable, observable, runInAction } from "mobx";
import type { IBoardIssueType, IProjectIssueTypeLite, TBoardIssueTypeFormData } from "@operis/types";
import { BoardIssueTypeService } from "@/services/board/board-issue-type.service";

export interface IBoardIssueTypeStore {
  boardIssueTypesByKey: Record<string, IBoardIssueType[]>;
  projectIssueTypesByProjectId: Record<string, IProjectIssueTypeLite[]>;
  fetchBoardIssueTypes: (workspaceSlug: string, boardSlug: string) => Promise<IBoardIssueType[]>;
  createBoardIssueType: (
    workspaceSlug: string,
    boardSlug: string,
    data: TBoardIssueTypeFormData
  ) => Promise<IBoardIssueType>;
  updateBoardIssueType: (
    workspaceSlug: string,
    boardSlug: string,
    boardIssueTypeId: string,
    data: Partial<TBoardIssueTypeFormData> & { is_enabled?: boolean; sort_order?: number }
  ) => Promise<IBoardIssueType>;
  disableBoardIssueType: (workspaceSlug: string, boardSlug: string, boardIssueTypeId: string) => Promise<void>;
  fetchProjectIssueTypes: (workspaceSlug: string, projectId: string) => Promise<IProjectIssueTypeLite[]>;
  getBoardIssueTypes: (workspaceSlug: string, boardSlug: string) => IBoardIssueType[];
  getProjectIssueTypes: (projectId: string) => IProjectIssueTypeLite[];
}

const boardKey = (workspaceSlug: string, boardSlug: string) => `${workspaceSlug}::${boardSlug}`;

export class BoardIssueTypeStore implements IBoardIssueTypeStore {
  boardIssueTypesByKey: Record<string, IBoardIssueType[]> = {};
  projectIssueTypesByProjectId: Record<string, IProjectIssueTypeLite[]> = {};
  private service = new BoardIssueTypeService();

  constructor() {
    makeObservable(this, {
      boardIssueTypesByKey: observable,
      projectIssueTypesByProjectId: observable,
      fetchBoardIssueTypes: action,
      createBoardIssueType: action,
      updateBoardIssueType: action,
      disableBoardIssueType: action,
      fetchProjectIssueTypes: action,
    });
  }

  getBoardIssueTypes = (workspaceSlug: string, boardSlug: string) =>
    this.boardIssueTypesByKey[boardKey(workspaceSlug, boardSlug)] ?? [];

  getProjectIssueTypes = (projectId: string) => this.projectIssueTypesByProjectId[projectId] ?? [];

  fetchBoardIssueTypes = async (workspaceSlug: string, boardSlug: string) => {
    const types = await this.service.getBoardIssueTypes(workspaceSlug, boardSlug);
    runInAction(() => {
      this.boardIssueTypesByKey[boardKey(workspaceSlug, boardSlug)] = types;
    });
    return types;
  };

  createBoardIssueType = async (workspaceSlug: string, boardSlug: string, data: TBoardIssueTypeFormData) => {
    const created = await this.service.createBoardIssueType(workspaceSlug, boardSlug, data);
    runInAction(() => {
      const key = boardKey(workspaceSlug, boardSlug);
      const list = [...(this.boardIssueTypesByKey[key] ?? []), created].sort(
        (a, b) => a.sort_order - b.sort_order
      );
      this.boardIssueTypesByKey[key] = list;
    });
    return created;
  };

  updateBoardIssueType = async (
    workspaceSlug: string,
    boardSlug: string,
    boardIssueTypeId: string,
    data: Partial<TBoardIssueTypeFormData> & { is_enabled?: boolean; sort_order?: number }
  ) => {
    const updated = await this.service.updateBoardIssueType(workspaceSlug, boardSlug, boardIssueTypeId, data);
    runInAction(() => {
      const key = boardKey(workspaceSlug, boardSlug);
      this.boardIssueTypesByKey[key] = (this.boardIssueTypesByKey[key] ?? [])
        .map((item) => (item.id === boardIssueTypeId ? updated : item))
        .sort((a, b) => a.sort_order - b.sort_order);
    });
    return updated;
  };

  disableBoardIssueType = async (workspaceSlug: string, boardSlug: string, boardIssueTypeId: string) => {
    await this.service.disableBoardIssueType(workspaceSlug, boardSlug, boardIssueTypeId);
    runInAction(() => {
      const key = boardKey(workspaceSlug, boardSlug);
      this.boardIssueTypesByKey[key] = (this.boardIssueTypesByKey[key] ?? []).map((item) =>
        item.id === boardIssueTypeId ? { ...item, is_enabled: false } : item
      );
    });
  };

  fetchProjectIssueTypes = async (workspaceSlug: string, projectId: string) => {
    const types = await this.service.getProjectIssueTypes(workspaceSlug, projectId);
    runInAction(() => {
      this.projectIssueTypesByProjectId[projectId] = types;
    });
    return types;
  };
}
