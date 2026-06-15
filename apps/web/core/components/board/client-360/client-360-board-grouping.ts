import type { TClient360Client } from "@operis/types";

const GROUP_BY_STORAGE_KEY = "client360_group_by_board";
const COLLAPSED_STORAGE_KEY = "client360_group_collapsed_boards";

export type Client360BoardGroupStats = {
  total: number;
  critical: number;
  overdue: number;
};

export type Client360BoardGroup = {
  boardId: string;
  boardName: string;
  boardSlug: string;
  clients: TClient360Client[];
  stats: Client360BoardGroupStats;
};

export function groupClient360ByBoard(clients: TClient360Client[]): Client360BoardGroup[] {
  const groups = new Map<string, Client360BoardGroup>();

  for (const client of clients) {
    if (!client.board) continue;

    let group = groups.get(client.board.id);
    if (!group) {
      group = {
        boardId: client.board.id,
        boardName: client.board.name,
        boardSlug: client.board.slug,
        clients: [],
        stats: { total: 0, critical: 0, overdue: 0 },
      };
      groups.set(client.board.id, group);
    }

    group.clients.push(client);
    group.stats.total += 1;
    if (client.health === "critical") group.stats.critical += 1;
    group.stats.overdue += client.issues.overdue;
  }

  return [...groups.values()].sort((a, b) =>
    a.boardName.localeCompare(b.boardName, undefined, { sensitivity: "base" })
  );
}

export function loadClient360GroupByBoard(scope: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(`${GROUP_BY_STORAGE_KEY}_${scope}`) === "1";
  } catch {
    return false;
  }
}

export function saveClient360GroupByBoard(scope: string, enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${GROUP_BY_STORAGE_KEY}_${scope}`, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function loadClient360CollapsedBoards(scope: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${COLLAPSED_STORAGE_KEY}_${scope}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function saveClient360CollapsedBoards(scope: string, boardIds: string[]) {
  if (typeof window === "undefined") return;
  try {
    if (boardIds.length === 0) {
      localStorage.removeItem(`${COLLAPSED_STORAGE_KEY}_${scope}`);
      return;
    }
    localStorage.setItem(`${COLLAPSED_STORAGE_KEY}_${scope}`, JSON.stringify(boardIds));
  } catch {
    /* ignore */
  }
}
