import { API_BASE_URL } from "@operoz/constants";
import type { IBoard, IBoardAutomationRule, TAutomationDryRunResult, TAutomationGraph } from "@operoz/types";
import { AuthService } from "@/services/auth.service";
import { saveAutomationDryRunSession } from "./automation-dry-run-storage";
import { sampleDryRunEvent } from "./automation-utils";

const authService = new AuthService();

type TriggerTestParams = {
  workspaceSlug: string;
  board: IBoard;
  rule: Pick<IBoardAutomationRule, "id" | "name" | "graph">;
  ruleName?: string;
  graph?: TAutomationGraph;
  from?: string;
};

export type AutomationTestStreamCallbacks = {
  onStarted?: () => void;
  onStep: (step: Record<string, unknown>) => void;
  onDone: (result: TAutomationDryRunResult) => void;
  onError: (error: string, code?: string) => void;
};

/** Grava sessão pendente e retorna URL da tela de execução (navegar imediatamente). */
export function prepareAutomationTestNavigation(params: TriggerTestParams): string {
  const { workspaceSlug, board, rule, ruleName, graph, from } = params;
  const graphToUse = graph ?? rule.graph;

  saveAutomationDryRunSession({
    ruleId: rule.id,
    ruleName: ruleName ?? rule.name,
    graph: graphToUse,
    simulatedAt: new Date().toISOString(),
    status: "pending",
    liveSteps: [],
  });

  const query = new URLSearchParams({ ruleId: rule.id, run: "1" });
  if (from) query.set("from", from);

  return `/${workspaceSlug}/settings/boards/${board.slug}/automacao/simulacao?${query.toString()}`;
}

/** Executa teste com streaming NDJSON — cada passo chega em tempo real. */
export async function runAutomationTestStream(
  params: TriggerTestParams,
  callbacks: AutomationTestStreamCallbacks
): Promise<TAutomationDryRunResult> {
  const { workspaceSlug, board, rule, ruleName, graph } = params;
  const graphToUse = graph ?? rule.graph;
  const event = sampleDryRunEvent(board.id, board.workspace, graphToUse, rule.id);

  const csrfToken = await authService.requestCSRFToken().then((data) => data?.csrf_token);
  const url = `${API_BASE_URL}/api/workspaces/${workspaceSlug}/boards/${board.slug}/automation/rules/${rule.id}/dry-run/`;

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRFTOKEN": csrfToken } : {}),
    },
    body: JSON.stringify({ event, graph: graphToUse, live: true, stream: true }),
  });

  if (!response.ok) {
    let payload: { error?: string; code?: string } = {};
    try {
      payload = await response.json();
    } catch {
      payload = { error: response.statusText };
    }
    callbacks.onError(payload.error ?? "Erro ao testar automação", payload.code);
    throw payload;
  }

  if (!response.body) {
    const err = "Stream não suportado";
    callbacks.onError(err);
    throw new Error(err);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult: TAutomationDryRunResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      const item = JSON.parse(line) as {
        type: string;
        step?: Record<string, unknown>;
        result?: TAutomationDryRunResult;
        error?: string;
        code?: string;
      };

      if (item.type === "started") {
        callbacks.onStarted?.();
      } else if (item.type === "step" && item.step) {
        callbacks.onStep(item.step);
      } else if (item.type === "done" && item.result) {
        finalResult = item.result;
        callbacks.onDone(item.result);
      } else if (item.type === "error") {
        callbacks.onError(item.error ?? "Erro na execução", item.code);
        throw new Error(item.error ?? "Erro na execução");
      }
    }
  }

  if (!finalResult) {
    const err = "Execução terminou sem resultado";
    callbacks.onError(err);
    throw new Error(err);
  }

  saveAutomationDryRunSession({
    ruleId: rule.id,
    ruleName: ruleName ?? rule.name,
    graph: graphToUse,
    simulatedAt: new Date().toISOString(),
    status: "completed",
    result: finalResult,
    liveSteps: finalResult.steps ?? [],
  });

  return finalResult;
}
