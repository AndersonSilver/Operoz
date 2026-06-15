import type { TClient360Client, TClient360Summary } from "@operis/types";

export const CLIENT_360_BOARD_IDS_PARAM = "board_ids";
const SESSION_KEY_PREFIX = "client360_board_filter_";

export type Client360BoardOption = {
  id: string;
  slug: string;
  name: string;
};

export function extractClient360Boards(clients: TClient360Client[]): Client360BoardOption[] {
  const byId = new Map<string, Client360BoardOption>();
  for (const client of clients) {
    if (!client.board) continue;
    if (!byId.has(client.board.id)) {
      byId.set(client.board.id, {
        id: client.board.id,
        slug: client.board.slug,
        name: client.board.name,
      });
    }
  }
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

export function parseClient360BoardIdsParam(raw: string | null): string[] {
  if (!raw) return [];
  return [
    ...new Set(
      raw
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
    ),
  ];
}

export function sanitizeClient360BoardIds(boardIds: string[], availableBoards: Client360BoardOption[]): string[] {
  const allowed = new Set(availableBoards.map((b) => b.id));
  return boardIds.filter((id) => allowed.has(id));
}

export function filterClient360ByBoards(clients: TClient360Client[], boardIds: string[]): TClient360Client[] {
  if (boardIds.length === 0) return clients;
  const selected = new Set(boardIds);
  return clients.filter((client) => client.board && selected.has(client.board.id));
}

export function computeClient360Summary(clients: TClient360Client[]): TClient360Summary {
  return {
    total_clients: clients.length,
    health_critical: clients.filter((c) => c.health === "critical").length,
    health_warning: clients.filter((c) => c.health === "warning").length,
    report_missing: clients.filter((c) => c.status_report.coverage === "missing").length,
    total_overdue: clients.reduce((sum, c) => sum + c.issues.overdue, 0),
    total_support_open: clients.reduce((sum, c) => sum + c.support.open_count, 0),
    health_score_alert: clients.filter((c) => c.health_score_alert).length,
  };
}

export function loadClient360BoardFilterSession(workspaceSlug: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(`${SESSION_KEY_PREFIX}${workspaceSlug}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export function saveClient360BoardFilterSession(workspaceSlug: string, boardIds: string[]) {
  if (typeof window === "undefined") return;
  try {
    if (boardIds.length === 0) {
      sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${workspaceSlug}`);
      return;
    }
    sessionStorage.setItem(`${SESSION_KEY_PREFIX}${workspaceSlug}`, JSON.stringify(boardIds));
  } catch {
    /* ignore */
  }
}
