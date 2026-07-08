import { sortBy, set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import type { IBoard, TBoardFormData, TLoader } from "@operoz/types";
import { orderWorkspaceBoards } from "@operoz/utils";
import { BoardService } from "@/services/board/board.service";
import type { CoreRootStore } from "../root.store";

export interface IBoardStore {
  loader: TLoader;
  boardMap: Record<string, IBoard>;
  fetchBoards: (workspaceSlug: string, options?: { includeArchived?: boolean }) => Promise<IBoard[]>;
  fetchBoardDetails: (workspaceSlug: string, boardSlug: string) => Promise<IBoard>;
  createBoard: (workspaceSlug: string, data: TBoardFormData & { slug?: string }) => Promise<IBoard>;
  updateBoard: (workspaceSlug: string, boardSlug: string, data: Partial<TBoardFormData>) => Promise<IBoard>;
  reorderBoard: (
    workspaceSlug: string,
    sourceBoardId: string,
    destinationBoardId: string,
    shouldDropAtEnd: boolean
  ) => Promise<void>;
  archiveBoard: (workspaceSlug: string, boardSlug: string) => Promise<IBoard>;
  unarchiveBoard: (workspaceSlug: string, boardSlug: string) => Promise<IBoard>;
  getBoardById: (boardId: string | null | undefined) => IBoard | undefined;
  getBoardBySlug: (boardSlug: string | null | undefined) => IBoard | undefined;
  currentWorkspaceBoardIds: string[];
  currentWorkspaceAllBoardIds: string[];
  addBoardToFavorites: (workspaceSlug: string, boardId: string) => Promise<void>;
  removeBoardFromFavorites: (workspaceSlug: string, boardId: string) => Promise<void>;
  isBoardFavorite: (boardId: string) => boolean;
}

export class BoardStore implements IBoardStore {
  loader: TLoader = "init-loader";
  boardMap: Record<string, IBoard> = {};
  boardIdsByWorkspace: Record<string, string[]> = {};

  rootStore: CoreRootStore;
  boardService: BoardService;

  constructor(rootStore: CoreRootStore) {
    makeObservable(this, {
      loader: observable.ref,
      boardMap: observable,
      boardIdsByWorkspace: observable,
      currentWorkspaceBoardIds: computed,
      currentWorkspaceAllBoardIds: computed,
      fetchBoards: action,
      fetchBoardDetails: action,
      createBoard: action,
      updateBoard: action,
      archiveBoard: action,
      unarchiveBoard: action,
      reorderBoard: action,
      addBoardToFavorites: action,
      removeBoardFromFavorites: action,
    });
    this.rootStore = rootStore;
    this.boardService = new BoardService();
  }

  get currentWorkspaceAllBoardIds() {
    const workspace = this.rootStore.workspaceRoot.currentWorkspace;
    if (!workspace) return [];
    return this.boardIdsByWorkspace[workspace.id] ?? [];
  }

  get currentWorkspaceBoardIds() {
    return this.currentWorkspaceAllBoardIds.filter((id) => !this.boardMap[id]?.archived_at);
  }

  getBoardById = computedFn((boardId: string | null | undefined) => {
    if (!boardId) return undefined;
    return this.boardMap[boardId];
  });

  getBoardBySlug = computedFn((boardSlug: string | null | undefined) => {
    if (!boardSlug) return undefined;
    return Object.values(this.boardMap).find((b) => b.slug === boardSlug);
  });

  fetchBoards = async (workspaceSlug: string, options?: { includeArchived?: boolean }) => {
    try {
      this.loader = this.currentWorkspaceAllBoardIds.length > 0 ? "loaded" : "init-loader";
      const boards = await this.boardService.getBoards(workspaceSlug, options);
      const workspace = this.rootStore.workspaceRoot.currentWorkspace;
      runInAction(() => {
        const sorted = sortBy(boards, ["sort_order", "name"]);
        sorted.forEach((board) => {
          set(this.boardMap, board.id, board);
        });
        if (workspace) {
          this.boardIdsByWorkspace[workspace.id] = sorted.map((b) => b.id);
        }
        this.loader = "loaded";
      });
      return boards;
    } catch (error) {
      runInAction(() => {
        this.loader = "loaded";
      });
      throw error;
    }
  };

  fetchBoardDetails = async (workspaceSlug: string, boardSlug: string) => {
    const board = await this.boardService.getBoard(workspaceSlug, boardSlug);
    runInAction(() => {
      set(this.boardMap, board.id, board);
      const workspace = this.rootStore.workspaceRoot.currentWorkspace;
      if (workspace && !this.boardIdsByWorkspace[workspace.id]?.includes(board.id)) {
        this.boardIdsByWorkspace[workspace.id] = [...(this.boardIdsByWorkspace[workspace.id] ?? []), board.id];
      }
    });
    return board;
  };

  createBoard = async (workspaceSlug: string, data: TBoardFormData & { slug?: string }) => {
    const board = await this.boardService.createBoard(workspaceSlug, data);
    runInAction(() => {
      set(this.boardMap, board.id, board);
      const workspace = this.rootStore.workspaceRoot.currentWorkspace;
      if (workspace) {
        const ids = this.boardIdsByWorkspace[workspace.id] ?? [];
        this.boardIdsByWorkspace[workspace.id] = [...ids, board.id];
      }
    });
    return board;
  };

  updateBoard = async (workspaceSlug: string, boardSlug: string, data: Partial<TBoardFormData>) => {
    const board = await this.boardService.updateBoard(workspaceSlug, boardSlug, data);
    runInAction(() => {
      set(this.boardMap, board.id, board);
    });
    return board;
  };

  archiveBoard = async (workspaceSlug: string, boardSlug: string) => {
    const board = await this.boardService.archiveBoard(workspaceSlug, boardSlug);
    runInAction(() => {
      set(this.boardMap, board.id, board);
    });
    return board;
  };

  unarchiveBoard = async (workspaceSlug: string, boardSlug: string) => {
    const board = await this.boardService.unarchiveBoard(workspaceSlug, boardSlug);
    runInAction(() => {
      set(this.boardMap, board.id, board);
    });
    return board;
  };

  reorderBoard = async (
    workspaceSlug: string,
    sourceBoardId: string,
    destinationBoardId: string,
    shouldDropAtEnd: boolean
  ) => {
    const workspace = this.rootStore.workspaceRoot.currentWorkspace;
    if (!workspace) return;

    const boardIds = this.currentWorkspaceBoardIds;
    const sourceIndex = boardIds.indexOf(sourceBoardId);
    const destinationIndex = shouldDropAtEnd ? boardIds.length : boardIds.indexOf(destinationBoardId);
    if (sourceIndex < 0 || destinationIndex < 0 || sourceBoardId === destinationBoardId) return;

    const boardsList = boardIds.map((id) => this.boardMap[id]).filter(Boolean) as IBoard[];
    if (boardsList.length <= 0) return;

    const updatedSortOrder = orderWorkspaceBoards(sourceIndex, destinationIndex, boardsList);
    if (updatedSortOrder === undefined) return;

    const sourceBoard = this.boardMap[sourceBoardId];
    if (!sourceBoard) return;

    await this.updateBoard(workspaceSlug, sourceBoard.slug, { sort_order: updatedSortOrder });
    await this.fetchBoards(workspaceSlug);
  };

  isBoardFavorite = (boardId: string) => Boolean(this.rootStore.favorite.entityMap[boardId]);

  addBoardToFavorites = async (workspaceSlug: string, boardId: string) => {
    const board = this.getBoardById(boardId);
    if (!board || this.isBoardFavorite(boardId)) return;

    await this.rootStore.favorite.addFavorite(workspaceSlug, {
      entity_type: "board",
      entity_identifier: boardId,
      entity_data: { name: board.name },
    });
  };

  removeBoardFromFavorites = async (workspaceSlug: string, boardId: string) => {
    if (!this.isBoardFavorite(boardId)) return;
    await this.rootStore.favorite.removeFavoriteEntity(workspaceSlug, boardId);
  };
}
