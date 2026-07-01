import type { IBoard, TBoardSpaceType } from "@operoz/types";

export function getBoardIdentifier(board: Pick<IBoard, "identifier" | "slug">): string {
  const id = board.identifier?.trim();
  if (id) return id.toUpperCase();
  const fromSlug = board.slug.split("-")[0]?.replace(/[^a-z0-9]/gi, "");
  return (fromSlug || board.slug).slice(0, 12).toUpperCase();
}

export function getBoardSpacePath(workspaceSlug: string, boardSlug: string): string {
  return `/${workspaceSlug}/boards/${boardSlug}`;
}

export function getBoardSpaceUrl(workspaceSlug: string, boardSlug: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}${getBoardSpacePath(workspaceSlug, boardSlug)}`;
}

export const BOARD_SPACE_TYPES: TBoardSpaceType[] = ["team_managed", "company_managed"];

export function isBoardSpaceType(value: string): value is TBoardSpaceType {
  return BOARD_SPACE_TYPES.includes(value as TBoardSpaceType);
}
