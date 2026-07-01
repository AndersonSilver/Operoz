import type { TAutomationDryRunResult, TAutomationGraph } from "@operoz/types";

const STORAGE_KEY = "operoz:automation-dry-run";

export type TAutomationDryRunSessionStatus = "pending" | "running" | "completed" | "failed";

export type TAutomationDryRunSession = {
  ruleId: string;
  ruleName: string;
  graph: TAutomationGraph;
  simulatedAt: string;
  status: TAutomationDryRunSessionStatus;
  result?: TAutomationDryRunResult;
  liveSteps?: Record<string, unknown>[];
  error?: string;
};

export function saveAutomationDryRunSession(session: TAutomationDryRunSession): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // quota / private mode — navigation still works with router state fallback
  }
}

export function loadAutomationDryRunSession(ruleId?: string): TAutomationDryRunSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TAutomationDryRunSession;
    if (ruleId && parsed.ruleId !== ruleId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearAutomationDryRunSession(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
