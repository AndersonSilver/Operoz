import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CLIENT_360_BOARD_IDS_PARAM,
  loadClient360BoardFilterSession,
  parseClient360BoardIdsParam,
  saveClient360BoardFilterSession,
  sanitizeClient360BoardIds,
  type Client360BoardOption,
} from "@/components/board/client-360/client-360-board-filter";

function boardIdsEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

export function useClient360BoardFilter(workspaceSlug: string, availableBoards: Client360BoardOption[]) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [selectedBoardIds, setSelectedBoardIdsState] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  const sanitize = useCallback(
    (boardIds: string[]) => sanitizeClient360BoardIds(boardIds, availableBoards),
    [availableBoards]
  );

  const syncUrl = useCallback(
    (boardIds: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (boardIds.length === 0) params.delete(CLIENT_360_BOARD_IDS_PARAM);
      else params.set(CLIENT_360_BOARD_IDS_PARAM, boardIds.join(","));
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const applySelection = useCallback(
    (boardIds: string[]) => {
      const next = sanitize(boardIds);
      setSelectedBoardIdsState(next);
      saveClient360BoardFilterSession(workspaceSlug, next);
      syncUrl(next);
    },
    [sanitize, syncUrl, workspaceSlug]
  );

  useEffect(() => {
    if (!workspaceSlug) return;

    const fromUrl = parseClient360BoardIdsParam(searchParams.get(CLIENT_360_BOARD_IDS_PARAM));
    const initial = fromUrl.length > 0 ? fromUrl : loadClient360BoardFilterSession(workspaceSlug);
    const next = sanitize(initial);

    setSelectedBoardIdsState((prev) => (boardIdsEqual(prev, next) ? prev : next));
    setReady(true);
  }, [workspaceSlug, searchParams, sanitize]);

  const toggleBoard = useCallback(
    (boardId: string) => {
      applySelection(
        selectedBoardIds.includes(boardId)
          ? selectedBoardIds.filter((id) => id !== boardId)
          : [...selectedBoardIds, boardId]
      );
    },
    [applySelection, selectedBoardIds]
  );

  const clearBoards = useCallback(() => applySelection([]), [applySelection]);

  const selectedBoards = useMemo(
    () => availableBoards.filter((board) => selectedBoardIds.includes(board.id)),
    [availableBoards, selectedBoardIds]
  );

  const hasBoardFilter = selectedBoardIds.length > 0;

  return {
    ready,
    selectedBoardIds,
    selectedBoards,
    hasBoardFilter,
    setSelectedBoardIds: applySelection,
    toggleBoard,
    clearBoards,
  };
}
