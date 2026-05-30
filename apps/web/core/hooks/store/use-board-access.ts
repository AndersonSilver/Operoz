import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { IBoardAccessStore } from "@/store/board/board-access.store";

export const useBoardAccess = (): IBoardAccessStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useBoardAccess must be used within StoreProvider");
  return context.boardAccessStore;
};
