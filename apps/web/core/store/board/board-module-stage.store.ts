import { action, makeObservable, observable, runInAction } from "mobx";
import type { IBoardModuleStage, TBoardModuleStageFormData, TBoardModuleStageUpdateData } from "@operis/types";
import { BoardModuleStageService } from "@/services/board/board-module-stage.service";

export interface IBoardModuleStageStore {
  stagesByKey: Record<string, IBoardModuleStage[]>;
  fetchBoardModuleStages: (workspaceSlug: string, boardSlug: string) => Promise<IBoardModuleStage[]>;
  createBoardModuleStage: (
    workspaceSlug: string,
    boardSlug: string,
    data: TBoardModuleStageFormData
  ) => Promise<IBoardModuleStage>;
  updateBoardModuleStage: (
    workspaceSlug: string,
    boardSlug: string,
    stageId: string,
    data: TBoardModuleStageUpdateData
  ) => Promise<IBoardModuleStage>;
  removeBoardModuleStage: (workspaceSlug: string, boardSlug: string, stageId: string) => Promise<void>;
  getBoardModuleStages: (workspaceSlug: string, boardSlug: string) => IBoardModuleStage[];
  getActiveBoardModuleStages: (workspaceSlug: string, boardSlug: string) => IBoardModuleStage[];
}

const boardKey = (workspaceSlug: string, boardSlug: string) => `${workspaceSlug}::${boardSlug}`;

export class BoardModuleStageStore implements IBoardModuleStageStore {
  stagesByKey: Record<string, IBoardModuleStage[]> = {};
  private service = new BoardModuleStageService();

  constructor() {
    makeObservable(this, {
      stagesByKey: observable,
      fetchBoardModuleStages: action,
      createBoardModuleStage: action,
      updateBoardModuleStage: action,
      removeBoardModuleStage: action,
    });
  }

  getBoardModuleStages = (workspaceSlug: string, boardSlug: string) =>
    this.stagesByKey[boardKey(workspaceSlug, boardSlug)] ?? [];

  getActiveBoardModuleStages = (workspaceSlug: string, boardSlug: string) =>
    this.getBoardModuleStages(workspaceSlug, boardSlug).filter((stage) => stage.is_active);

  fetchBoardModuleStages = async (workspaceSlug: string, boardSlug: string) => {
    const stages = await this.service.list(workspaceSlug, boardSlug);
    runInAction(() => {
      this.stagesByKey[boardKey(workspaceSlug, boardSlug)] = stages.sort((a, b) => a.sort_order - b.sort_order);
    });
    return stages;
  };

  createBoardModuleStage = async (workspaceSlug: string, boardSlug: string, data: TBoardModuleStageFormData) => {
    const created = await this.service.create(workspaceSlug, boardSlug, data);
    runInAction(() => {
      const key = boardKey(workspaceSlug, boardSlug);
      const list = [...(this.stagesByKey[key] ?? []), created].sort((a, b) => a.sort_order - b.sort_order);
      this.stagesByKey[key] = list;
    });
    return created;
  };

  updateBoardModuleStage = async (
    workspaceSlug: string,
    boardSlug: string,
    stageId: string,
    data: TBoardModuleStageUpdateData
  ) => {
    const updated = await this.service.update(workspaceSlug, boardSlug, stageId, data);
    runInAction(() => {
      const key = boardKey(workspaceSlug, boardSlug);
      this.stagesByKey[key] = (this.stagesByKey[key] ?? [])
        .map((item) => (item.id === stageId ? updated : item))
        .sort((a, b) => a.sort_order - b.sort_order);
    });
    return updated;
  };

  removeBoardModuleStage = async (workspaceSlug: string, boardSlug: string, stageId: string) => {
    await this.service.remove(workspaceSlug, boardSlug, stageId);
    runInAction(() => {
      const key = boardKey(workspaceSlug, boardSlug);
      this.stagesByKey[key] = (this.stagesByKey[key] ?? []).map((item) =>
        item.id === stageId ? { ...item, is_active: false } : item
      );
    });
  };
}
