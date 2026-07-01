import type { IBoard } from "@operoz/types";

/**
 * Computes a new sort_order when reordering boards in the workspace sidebar.
 */
export const orderWorkspaceBoards = (
  sourceIndex: number,
  destinationIndex: number,
  boards: IBoard[]
): number | undefined => {
  if (sourceIndex < 0 || destinationIndex < 0 || boards.length <= 0) return undefined;

  const sortOrderDefaultValue = 10000;

  if (destinationIndex === 0) {
    return (boards[0].sort_order ?? 0) - sortOrderDefaultValue;
  }
  if (destinationIndex >= boards.length) {
    return (boards[boards.length - 1].sort_order ?? 0) + sortOrderDefaultValue;
  }

  const top = boards[destinationIndex - 1].sort_order ?? 0;
  const bottom = boards[destinationIndex].sort_order ?? 0;
  return (top + bottom) / 2;
};
