import { setPromiseToast } from "@operoz/propel/toast";
import { useBoard } from "@/hooks/store/use-board";

export const useBoardFavorite = (workspaceSlug: string | undefined, boardId: string | undefined) => {
  const { getBoardById, isBoardFavorite, addBoardToFavorites, removeBoardFromFavorites } = useBoard();

  const board = boardId ? getBoardById(boardId) : undefined;
  const canFavorite = Boolean(board && !board.archived_at);
  const isFavorite = boardId ? isBoardFavorite(boardId) : false;

  const handleAddToFavorites = () => {
    if (!workspaceSlug || !boardId) return;
    const promise = addBoardToFavorites(workspaceSlug, boardId);
    setPromiseToast(promise, {
      loading: "Adding space to favorites...",
      success: {
        title: "Success!",
        message: () => "Space added to favorites.",
      },
      error: {
        title: "Error!",
        message: () => "Couldn't add the space to favorites. Please try again.",
      },
    });
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !boardId) return;
    const promise = removeBoardFromFavorites(workspaceSlug, boardId);
    setPromiseToast(promise, {
      loading: "Removing space from favorites...",
      success: {
        title: "Success!",
        message: () => "Space removed from favorites.",
      },
      error: {
        title: "Error!",
        message: () => "Couldn't remove the space from favorites. Please try again.",
      },
    });
  };

  const toggleFavorite = () => {
    if (isFavorite) handleRemoveFromFavorites();
    else handleAddToFavorites();
  };

  return {
    canFavorite,
    isFavorite,
    toggleFavorite,
  };
};
