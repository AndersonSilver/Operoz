import { ENABLE_WORKSPACE_BOARDS } from "@/constants/enable-boards";
import type { TAssistantSessionContext } from "@/services/assistant.service";

const STORAGE_PREFIX = "operoz-assistant-context";

export function getAssistantContextStorageKey(workspaceSlug: string) {
  return `${STORAGE_PREFIX}-${workspaceSlug}`;
}

export function readPersistedAssistantContext(workspaceSlug: string): TAssistantSessionContext {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(getAssistantContextStorageKey(workspaceSlug));
    if (!raw) return {};
    return JSON.parse(raw) as TAssistantSessionContext;
  } catch {
    return {};
  }
}

export function writePersistedAssistantContext(workspaceSlug: string, context: TAssistantSessionContext) {
  if (typeof window === "undefined") return;
  const payload: TAssistantSessionContext = {};
  if (context.board_slug) payload.board_slug = context.board_slug;
  if (context.project_id) payload.project_id = context.project_id;
  if (!Object.keys(payload).length) {
    localStorage.removeItem(getAssistantContextStorageKey(workspaceSlug));
    return;
  }
  localStorage.setItem(getAssistantContextStorageKey(workspaceSlug), JSON.stringify(payload));
}

export function mergeAssistantRouteContext(
  route: TAssistantSessionContext,
  persisted: TAssistantSessionContext
): TAssistantSessionContext {
  return {
    board_slug: route.board_slug ?? persisted.board_slug,
    project_id: route.project_id ?? persisted.project_id,
  };
}

export function isAssistantSessionContextReady(
  context: TAssistantSessionContext,
  options: { boardsEnabled: boolean; hasBoards: boolean }
): boolean {
  if (!context.project_id?.trim()) return false;
  if (options.boardsEnabled && options.hasBoards) {
    return Boolean(context.board_slug?.trim());
  }
  return true;
}

export function assistantRequiresBoard(options: { boardsEnabled: boolean; hasBoards: boolean }) {
  return options.boardsEnabled && options.hasBoards;
}

export const ASSISTANT_BOARDS_ENABLED = ENABLE_WORKSPACE_BOARDS;
