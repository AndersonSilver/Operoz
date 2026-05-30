import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { IBoardStore } from "@/store/board/board.store";

export const useBoard = (): IBoardStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useBoard must be used within StoreProvider");
  return context.boardStore;
};
