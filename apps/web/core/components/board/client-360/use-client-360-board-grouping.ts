import { useCallback, useEffect, useState } from "react";
import {
  loadClient360CollapsedBoards,
  loadClient360GroupByBoard,
  saveClient360CollapsedBoards,
  saveClient360GroupByBoard,
} from "@/components/board/client-360/client-360-board-grouping";

export function useClient360BoardGrouping(scope: string, boardIds: string[]) {
  const [groupByBoard, setGroupByBoardState] = useState(() => loadClient360GroupByBoard(scope));
  const [collapsedBoardIds, setCollapsedBoardIdsState] = useState<Set<string>>(
    () => new Set(loadClient360CollapsedBoards(scope))
  );

  useEffect(() => {
    setCollapsedBoardIdsState((prev) => {
      const allowed = new Set(boardIds);
      const next = new Set([...prev].filter((id) => allowed.has(id)));
      if (next.size === prev.size && [...next].every((id) => prev.has(id))) return prev;
      saveClient360CollapsedBoards(scope, [...next]);
      return next;
    });
  }, [boardIds, scope]);

  const setGroupByBoard = useCallback(
    (enabled: boolean) => {
      setGroupByBoardState(enabled);
      saveClient360GroupByBoard(scope, enabled);
    },
    [scope]
  );

  const toggleGroupCollapsed = useCallback(
    (boardId: string) => {
      setCollapsedBoardIdsState((prev) => {
        const next = new Set(prev);
        if (next.has(boardId)) next.delete(boardId);
        else next.add(boardId);
        saveClient360CollapsedBoards(scope, [...next]);
        return next;
      });
    },
    [scope]
  );

  const expandAll = useCallback(() => {
    setCollapsedBoardIdsState(new Set());
    saveClient360CollapsedBoards(scope, []);
  }, [scope]);

  const collapseAll = useCallback(() => {
    const next = new Set(boardIds);
    setCollapsedBoardIdsState(next);
    saveClient360CollapsedBoards(scope, [...next]);
  }, [boardIds, scope]);

  const isCollapsed = useCallback((boardId: string) => collapsedBoardIds.has(boardId), [collapsedBoardIds]);

  return {
    groupByBoard,
    setGroupByBoard,
    toggleGroupCollapsed,
    expandAll,
    collapseAll,
    isCollapsed,
  };
}
