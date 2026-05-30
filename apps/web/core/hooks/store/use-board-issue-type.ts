import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import { BoardIssueTypeStore, type IBoardIssueTypeStore } from "@/store/board/board-issue-type.store";

export const useBoardIssueType = (): IBoardIssueTypeStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useBoardIssueType must be used within StoreProvider");
  if (!context.boardIssueTypeStore) {
    context.boardIssueTypeStore = new BoardIssueTypeStore();
  }
  return context.boardIssueTypeStore;
};
