import type { IBoard } from "@operis/types";
import { getBoardIdentifier } from "./board-spaces-utils";

export type BoardsSettingsStatusFilter = "all" | "active" | "archived";
export type BoardsSettingsSortKey = "name" | "updated";

export type BoardsSettingsFilters = {
  query: string;
  status: BoardsSettingsStatusFilter;
  sort: BoardsSettingsSortKey;
};

export const DEFAULT_BOARDS_SETTINGS_FILTERS: BoardsSettingsFilters = {
  query: "",
  status: "active",
  sort: "name",
};

export function filterBoardsSettings(
  boards: IBoard[],
  filters: BoardsSettingsFilters
): IBoard[] {
  let items = [...boards];
  const q = filters.query.trim().toLowerCase();

  if (filters.status === "active") {
    items = items.filter((b) => !b.archived_at);
  } else if (filters.status === "archived") {
    items = items.filter((b) => Boolean(b.archived_at));
  }

  if (q) {
    items = items.filter((b) => {
      const key = getBoardIdentifier(b);
      return (
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        key.toLowerCase().includes(q) ||
        (b.category?.toLowerCase().includes(q) ?? false) ||
        (b.description?.toLowerCase().includes(q) ?? false)
      );
    });
  }

  items.sort((a, b) => {
    if (filters.sort === "updated") {
      const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return bTime - aTime;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });

  return items;
}

export function hasActiveBoardsSettingsFilters(filters: BoardsSettingsFilters): boolean {
  return (
    filters.query.trim().length > 0 ||
    filters.status !== "active" ||
    filters.sort !== "name"
  );
}
