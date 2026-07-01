import type { Client360FilterKey } from "@/components/board/client-360/client-360-client-filters";
import { CLIENT_360_FILTER_OPTIONS } from "@/components/board/client-360/client-360-client-filters";
import type { Client360SortState } from "@/components/board/client-360/client-360-client-sort";
import {
  defaultClient360TableColumns,
  normalizeClient360TableColumns,
  type Client360TableColumnConfig,
} from "@/components/board/client-360/client-360-table-columns";
import type { Client360ViewMode } from "@/components/board/client-360/client-360-view-toggle";
import { CLIENT_360_VIEW_OPTIONS } from "@/components/board/client-360/client-360-view-toggle";

export const CLIENT_360_SAVED_VIEWS_MAX = 20;
export const CLIENT_360_SAVED_VIEW_NAME_MAX = 48;
export const SHARED_VIEW_ID_PREFIX = "ws_";
const STORAGE_KEY_PREFIX = "client360_saved_views";
const STORE_VERSION = 1;

export type Client360SavedViewPayload = {
  filter: Client360FilterKey;
  search: string;
  boardIds: string[];
  view: Client360ViewMode;
  sort: Client360SortState;
  tableColumns: Client360TableColumnConfig[];
  groupByBoard: boolean;
};

export type Client360SavedView = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  payload: Client360SavedViewPayload;
};

export type Client360SavedViewsStore = {
  version: typeof STORE_VERSION;
  defaultViewId: string | null;
  views: Client360SavedView[];
};

const FILTER_KEYS = new Set<Client360FilterKey>(CLIENT_360_FILTER_OPTIONS.map((option) => option.key));
const VIEW_MODES = new Set<Client360ViewMode>(CLIENT_360_VIEW_OPTIONS.map((option) => option.id));

function storageKey(workspaceSlug: string): string {
  return `${STORAGE_KEY_PREFIX}_${workspaceSlug}`;
}

function emptyStore(): Client360SavedViewsStore {
  return { version: STORE_VERSION, defaultViewId: null, views: [] };
}

function createSavedViewId(): string {
  return `cv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function isWorkspaceSharedSavedViewId(viewId: string): boolean {
  return viewId.startsWith(SHARED_VIEW_ID_PREFIX);
}

export function sharedViewToSavedView(
  row: import("@operoz/types").TClient360SharedView,
  includeBoard: boolean
): Client360SavedView | null {
  const payload = parseClient360SavedViewPayload(row.payload, includeBoard);
  if (!payload) return null;
  return {
    id: `${SHARED_VIEW_ID_PREFIX}${row.id}`,
    name: row.name,
    createdAt: "",
    updatedAt: "",
    payload,
  };
}

export function sanitizeClient360SavedViewName(name: string): string {
  return name.trim().slice(0, CLIENT_360_SAVED_VIEW_NAME_MAX);
}

export function isValidClient360SavedViewName(name: string): boolean {
  return sanitizeClient360SavedViewName(name).length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseSort(value: unknown): Client360SortState | null {
  if (!isRecord(value)) return null;
  if (typeof value.column !== "string" || typeof value.direction !== "string") return null;
  if (value.direction !== "asc" && value.direction !== "desc") return null;
  const sort: Client360SortState = {
    column: value.column as Client360SortState["column"],
    direction: value.direction,
  };
  if (value.mode && typeof value.mode === "string") {
    sort.mode = value.mode as Client360SortState["mode"];
  }
  return sort;
}

function parseTableColumns(value: unknown, includeBoard: boolean): Client360TableColumnConfig[] | null {
  if (!Array.isArray(value)) return null;
  const parsed = value.filter(
    (column): column is Client360TableColumnConfig =>
      isRecord(column) && typeof column.id === "string" && typeof column.visible === "boolean"
  );
  if (parsed.length === 0) return null;
  return normalizeClient360TableColumns(parsed, includeBoard);
}

export function parseClient360SavedViewPayload(
  value: unknown,
  includeBoard: boolean
): Client360SavedViewPayload | null {
  if (!isRecord(value)) return null;

  const filter = value.filter;
  const view = value.view;
  const sort = parseSort(value.sort);
  const tableColumns = parseTableColumns(value.tableColumns, includeBoard);

  if (typeof filter !== "string" || !FILTER_KEYS.has(filter as Client360FilterKey)) return null;
  if (typeof view !== "string" || !VIEW_MODES.has(view as Client360ViewMode)) return null;
  if (!sort || !tableColumns) return null;

  const search = typeof value.search === "string" ? value.search.slice(0, 200) : "";
  const boardIds = Array.isArray(value.boardIds)
    ? value.boardIds.filter((id): id is string => typeof id === "string").slice(0, 50)
    : [];
  const groupByBoard = value.groupByBoard === true;

  return {
    filter: filter as Client360FilterKey,
    search,
    boardIds,
    view: view as Client360ViewMode,
    sort,
    tableColumns,
    groupByBoard,
  };
}

function parseSavedView(value: unknown, includeBoard: boolean): Client360SavedView | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string" || typeof value.name !== "string") return null;
  if (typeof value.createdAt !== "string" || typeof value.updatedAt !== "string") return null;

  const payload = parseClient360SavedViewPayload(value.payload, includeBoard);
  if (!payload) return null;

  const name = sanitizeClient360SavedViewName(value.name);
  if (!name) return null;

  return {
    id: value.id,
    name,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    payload,
  };
}

export function loadClient360SavedViewsStore(workspaceSlug: string, includeBoard: boolean): Client360SavedViewsStore {
  if (typeof window === "undefined" || !workspaceSlug) return emptyStore();

  try {
    const raw = localStorage.getItem(storageKey(workspaceSlug));
    if (!raw) return emptyStore();

    const parsed = JSON.parse(raw) as unknown;
    if (!isRecord(parsed) || parsed.version !== STORE_VERSION || !Array.isArray(parsed.views)) {
      return emptyStore();
    }

    const views = parsed.views
      .map((view) => parseSavedView(view, includeBoard))
      .filter((view): view is Client360SavedView => view !== null)
      .slice(0, CLIENT_360_SAVED_VIEWS_MAX);

    const viewIds = new Set(views.map((view) => view.id));
    const defaultViewId =
      typeof parsed.defaultViewId === "string" && viewIds.has(parsed.defaultViewId) ? parsed.defaultViewId : null;

    return { version: STORE_VERSION, defaultViewId, views };
  } catch {
    return emptyStore();
  }
}

export function saveClient360SavedViewsStore(workspaceSlug: string, store: Client360SavedViewsStore) {
  if (typeof window === "undefined" || !workspaceSlug) return;
  try {
    localStorage.setItem(storageKey(workspaceSlug), JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function client360SavedViewPayloadsEqual(a: Client360SavedViewPayload, b: Client360SavedViewPayload): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function buildClient360SavedViewPayload(input: {
  filter: Client360FilterKey;
  search: string;
  boardIds: string[];
  view: Client360ViewMode;
  sort: Client360SortState;
  tableColumns: Client360TableColumnConfig[];
  groupByBoard: boolean;
  includeBoard: boolean;
}): Client360SavedViewPayload {
  return {
    filter: input.filter,
    search: input.search.trim().slice(0, 200),
    boardIds: [...input.boardIds],
    view: input.view,
    sort: { ...input.sort },
    tableColumns: normalizeClient360TableColumns(input.tableColumns, input.includeBoard),
    groupByBoard: input.groupByBoard,
  };
}

export function createClient360SavedView(
  store: Client360SavedViewsStore,
  name: string,
  payload: Client360SavedViewPayload
): { store: Client360SavedViewsStore; view: Client360SavedView } | { error: "limit" | "invalid_name" } {
  const trimmed = sanitizeClient360SavedViewName(name);
  if (!trimmed) return { error: "invalid_name" };
  if (store.views.length >= CLIENT_360_SAVED_VIEWS_MAX) return { error: "limit" };

  const now = new Date().toISOString();
  const view: Client360SavedView = {
    id: createSavedViewId(),
    name: trimmed,
    createdAt: now,
    updatedAt: now,
    payload,
  };

  return {
    store: { ...store, views: [...store.views, view] },
    view,
  };
}

export function renameClient360SavedView(
  store: Client360SavedViewsStore,
  viewId: string,
  name: string
): { store: Client360SavedViewsStore } | { error: "not_found" | "invalid_name" } {
  const trimmed = sanitizeClient360SavedViewName(name);
  if (!trimmed) return { error: "invalid_name" };

  const index = store.views.findIndex((view) => view.id === viewId);
  if (index < 0) return { error: "not_found" };

  const now = new Date().toISOString();
  const views = [...store.views];
  views[index] = { ...views[index], name: trimmed, updatedAt: now };

  return { store: { ...store, views } };
}

export function deleteClient360SavedView(store: Client360SavedViewsStore, viewId: string): Client360SavedViewsStore {
  const views = store.views.filter((view) => view.id !== viewId);
  const defaultViewId = store.defaultViewId === viewId ? null : store.defaultViewId;
  return { ...store, views, defaultViewId };
}

export function setClient360DefaultSavedView(
  store: Client360SavedViewsStore,
  viewId: string | null
): Client360SavedViewsStore {
  if (viewId !== null && !store.views.some((view) => view.id === viewId)) {
    return store;
  }
  return { ...store, defaultViewId: viewId };
}

export function updateClient360SavedViewPayload(
  store: Client360SavedViewsStore,
  viewId: string,
  payload: Client360SavedViewPayload
): { store: Client360SavedViewsStore } | { error: "not_found" } {
  const index = store.views.findIndex((view) => view.id === viewId);
  if (index < 0) return { error: "not_found" };

  const now = new Date().toISOString();
  const views = [...store.views];
  views[index] = { ...views[index], payload, updatedAt: now };

  return { store: { ...store, views } };
}

export function defaultClient360SavedViewPayload(includeBoard: boolean): Client360SavedViewPayload {
  return {
    filter: "all",
    search: "",
    boardIds: [],
    view: "table",
    sort: { column: "name", direction: "asc" },
    tableColumns: defaultClient360TableColumns(includeBoard),
    groupByBoard: false,
  };
}
