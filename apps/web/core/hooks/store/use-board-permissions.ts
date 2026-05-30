import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import type { IBoardPermissionsStore } from "@/store/board/board-permissions.store";

export const useBoardPermissions = (): IBoardPermissionsStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useBoardPermissions must be used within StoreProvider");
  return context.boardPermissionsStore;
};
