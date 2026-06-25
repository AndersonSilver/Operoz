import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import { BoardModuleStageStore, type IBoardModuleStageStore } from "@/store/board/board-module-stage.store";

export const useBoardModuleStage = (): IBoardModuleStageStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useBoardModuleStage must be used within StoreProvider");
  if (!context.boardModuleStageStore) {
    context.boardModuleStageStore = new BoardModuleStageStore();
  }
  return context.boardModuleStageStore;
};
