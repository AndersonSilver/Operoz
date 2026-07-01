import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { TClient360HealthHistoryItem } from "@operoz/types";
import { BoardService } from "@/services/board/board.service";
import { WorkspaceService } from "@/services/workspace.service";

const workspaceService = new WorkspaceService();
const boardService = new BoardService();

const MAX_CONCURRENT = 6;
const HISTORY_WEEKS = 8;

export type Client360HealthHistoryEntry = {
  status: "idle" | "loading" | "ready" | "error";
  history: TClient360HealthHistoryItem[];
};

type Client360HealthHistoryContextValue = {
  requestHistory: (projectId: string) => void;
  getHistory: (projectId: string) => Client360HealthHistoryEntry;
  revision: number;
};

const Client360HealthHistoryContext = createContext<Client360HealthHistoryContextValue | null>(null);

type ProviderProps = {
  workspaceSlug: string;
  boardSlug?: string;
  children: ReactNode;
};

export function Client360HealthHistoryProvider({ workspaceSlug, boardSlug, children }: ProviderProps) {
  const cacheRef = useRef<Map<string, Client360HealthHistoryEntry>>(new Map());
  const queueRef = useRef<string[]>([]);
  const inflightRef = useRef<Set<string>>(new Set());
  const activeCountRef = useRef(0);
  const scopeRef = useRef({ workspaceSlug, boardSlug });
  const [revision, setRevision] = useState(0);
  const bump = useCallback(() => setRevision((value) => value + 1), []);

  scopeRef.current = { workspaceSlug, boardSlug };

  const drainQueueRef = useRef<() => void>(() => {});

  const runFetch = useCallback(
    async (projectId: string) => {
      const { workspaceSlug: ws, boardSlug: bs } = scopeRef.current;
      try {
        const response = bs
          ? await boardService.getClient360HealthHistory(ws, bs, projectId, { weeks: HISTORY_WEEKS })
          : await workspaceService.getClient360HealthHistory(ws, projectId, { weeks: HISTORY_WEEKS });
        cacheRef.current.set(projectId, { status: "ready", history: response.history ?? [] });
      } catch {
        cacheRef.current.set(projectId, { status: "error", history: [] });
      } finally {
        inflightRef.current.delete(projectId);
        activeCountRef.current = Math.max(0, activeCountRef.current - 1);
        bump();
        drainQueueRef.current();
      }
    },
    [bump]
  );

  drainQueueRef.current = () => {
    while (activeCountRef.current < MAX_CONCURRENT && queueRef.current.length > 0) {
      const projectId = queueRef.current.shift();
      if (!projectId || inflightRef.current.has(projectId)) continue;

      const cached = cacheRef.current.get(projectId);
      if (cached && cached.status !== "idle") continue;

      inflightRef.current.add(projectId);
      activeCountRef.current += 1;
      cacheRef.current.set(projectId, { status: "loading", history: [] });
      void runFetch(projectId);
    }
    bump();
  };

  const requestHistory = useCallback((projectId: string) => {
    const cached = cacheRef.current.get(projectId);
    if (cached && cached.status !== "idle") return;

    if (!queueRef.current.includes(projectId)) {
      queueRef.current.push(projectId);
    }
    drainQueueRef.current();
  }, []);

  const getHistory = useCallback(
    (projectId: string): Client360HealthHistoryEntry =>
      cacheRef.current.get(projectId) ?? { status: "idle", history: [] },
    []
  );

  useEffect(() => {
    cacheRef.current.clear();
    queueRef.current = [];
    inflightRef.current.clear();
    activeCountRef.current = 0;
    bump();
  }, [boardSlug, bump, workspaceSlug]);

  const value = useMemo(() => ({ requestHistory, getHistory, revision }), [getHistory, requestHistory, revision]);

  return <Client360HealthHistoryContext.Provider value={value}>{children}</Client360HealthHistoryContext.Provider>;
}

export function useClient360HealthHistory() {
  const context = useContext(Client360HealthHistoryContext);
  if (!context) {
    throw new Error("useClient360HealthHistory must be used within Client360HealthHistoryProvider");
  }
  return context;
}
