import type { Edge, Node } from "@xyflow/react";
import type {
  TAutomationCatalogItem,
  TAutomationDecisionBranch,
  TAutomationGraph,
  TAutomationGraphEdge,
  TAutomationGraphNode,
} from "@operoz/types";
import { v4 as uuidv4 } from "uuid";

export const AUTOMATION_NODE_TYPE = "automationNode";
export const DECISION_NODE_TYPE = "decisionNode";
export const PARALLEL_NODE_TYPE = "parallelNode";
export const SCHEDULE_CRON_NODE_TYPE = "scheduleCronNode";

export const ACTION_BRANCH_SUCCESS = "success";
export const ACTION_BRANCH_ERROR = "error";

export const BRANCHING_ACTION_KEYS = new Set(["action.run_script", "action.send_email"]);

export function isBranchingAction(catalogKey: string): boolean {
  return BRANCHING_ACTION_KEYS.has(catalogKey);
}

export type DecisionBranch = TAutomationDecisionBranch;

export type ParallelBranch = {
  id: string;
  label: string;
};

export type AutomationNodeData = {
  kind: "trigger" | "filter" | "decision" | "parallel" | "action";
  catalog_key: string;
  label: string;
  icon?: string;
  config: Record<string, unknown>;
};

export const DECISION_CONDITION_OPTIONS = [
  { key: "filter.state", label: "Estado do card" },
  { key: "filter.project", label: "Projeto" },
  { key: "filter.assignee", label: "Responsável" },
  { key: "filter.field_changed", label: "Campo alterado" },
  { key: "decision.else", label: "Senão (padrão)" },
] as const;

export function getParallelBranches(data: AutomationNodeData): ParallelBranch[] {
  const branches = data.config?.branches;
  if (Array.isArray(branches) && branches.length > 0) {
    return branches as ParallelBranch[];
  }
  return createDefaultParallelBranches();
}

export function createDefaultParallelBranches(): ParallelBranch[] {
  return [
    { id: `branch-${uuidv4().slice(0, 8)}`, label: "Ramo 1" },
    { id: `branch-${uuidv4().slice(0, 8)}`, label: "Ramo 2" },
  ];
}

export function getDecisionBranches(data: AutomationNodeData): DecisionBranch[] {
  const branches = data.config?.branches;
  if (Array.isArray(branches) && branches.length > 0) {
    return branches as DecisionBranch[];
  }
  return [];
}

export function summarizeAutomationGraph(graph?: TAutomationGraph) {
  const nodes = graph?.nodes ?? [];
  const trigger = nodes.find((n) => n.data.kind === "trigger");
  const actions = nodes.filter((n) => n.data.kind === "action").length;
  const decisions = nodes.filter((n) => n.data.kind === "decision").length;

  return {
    stepCount: nodes.length,
    triggerLabel: trigger?.data.label ?? null,
    actions,
    decisions,
  };
}

export function createDefaultDecisionBranches(): DecisionBranch[] {
  return [
    {
      id: `branch-${uuidv4().slice(0, 8)}`,
      label: "Condição 1",
      filter_key: "filter.state",
      filter_config: { state_ids: [] },
    },
    {
      id: `branch-${uuidv4().slice(0, 8)}`,
      label: "Senão",
      filter_key: "decision.else",
      filter_config: {},
    },
  ];
}

export function removeNodeFromGraph(graph: TAutomationGraph, nodeId: string): TAutomationGraph {
  return {
    nodes: graph.nodes.filter((n) => n.id !== nodeId),
    edges: graph.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
  };
}

export function removeEdgeFromGraph(graph: TAutomationGraph, edgeId: string): TAutomationGraph {
  return {
    ...graph,
    edges: graph.edges.filter((e) => e.id !== edgeId),
  };
}

export function removeBranchEdges(graph: TAutomationGraph, nodeId: string, branchId: string): TAutomationGraph {
  return {
    ...graph,
    edges: graph.edges.filter((e) => !(e.source === nodeId && e.sourceHandle === branchId)),
  };
}

function nodeTypeForKind(kind: AutomationNodeData["kind"], catalogKey?: string): string {
  if (kind === "decision") return DECISION_NODE_TYPE;
  if (kind === "parallel") return PARALLEL_NODE_TYPE;
  if (kind === "trigger" && catalogKey === "schedule.cron") return SCHEDULE_CRON_NODE_TYPE;
  return AUTOMATION_NODE_TYPE;
}

export type TAutomationGraphClip = {
  nodes: TAutomationGraphNode[];
  edges: TAutomationGraphEdge[];
};

export type TPasteGraphClipResult = {
  graph: TAutomationGraph;
  pastedNodeIds: string[];
  skippedTrigger: boolean;
};

export function extractGraphClip(graph: TAutomationGraph, nodeIds: readonly string[]): TAutomationGraphClip | null {
  if (nodeIds.length === 0) return null;

  const idSet = new Set(nodeIds);
  const nodes = graph.nodes.filter((n) => idSet.has(n.id));
  if (nodes.length === 0) return null;

  const edges = graph.edges.filter((e) => idSet.has(e.source) && idSet.has(e.target));
  return { nodes, edges };
}

export function pasteGraphClip(
  graph: TAutomationGraph,
  clip: TAutomationGraphClip,
  offset = { x: 48, y: 48 }
): TPasteGraphClipResult {
  const graphHasTrigger = graph.nodes.some((n) => n.data.kind === "trigger");
  let skippedTrigger = false;

  let nodesToPaste = clip.nodes;
  if (graphHasTrigger) {
    const withoutTrigger = clip.nodes.filter((n) => n.data.kind !== "trigger");
    if (withoutTrigger.length < clip.nodes.length) skippedTrigger = true;
    nodesToPaste = withoutTrigger;
  } else {
    let triggerIncluded = false;
    nodesToPaste = clip.nodes.filter((n) => {
      if (n.data.kind !== "trigger") return true;
      if (triggerIncluded) {
        skippedTrigger = true;
        return false;
      }
      triggerIncluded = true;
      return true;
    });
  }

  if (nodesToPaste.length === 0) {
    return { graph, pastedNodeIds: [], skippedTrigger };
  }

  const pasteIdSet = new Set(nodesToPaste.map((n) => n.id));
  const edgesToPaste = clip.edges.filter((e) => pasteIdSet.has(e.source) && pasteIdSet.has(e.target));

  const nodeIdMap: Record<string, string> = {};
  const branchIdMap: Record<string, Record<string, string>> = {};

  const newNodes: TAutomationGraphNode[] = nodesToPaste.map((node) => {
    const newId = `${node.data.kind}-${uuidv4().slice(0, 8)}`;
    nodeIdMap[node.id] = newId;

    const config = structuredClone(node.data.config ?? {});
    if (node.data.kind === "decision" && Array.isArray(config.branches)) {
      branchIdMap[node.id] = {};
      config.branches = (config.branches as DecisionBranch[]).map((branch) => {
        const newBranchId = `branch-${uuidv4().slice(0, 8)}`;
        branchIdMap[node.id][branch.id] = newBranchId;
        return { ...branch, id: newBranchId };
      });
    }

    return {
      ...node,
      id: newId,
      position: {
        x: (node.position?.x ?? 0) + offset.x,
        y: (node.position?.y ?? 0) + offset.y,
      },
      data: {
        ...node.data,
        config,
      },
    };
  });

  const newEdges: TAutomationGraphEdge[] = edgesToPaste.map((edge) => {
    let sourceHandle = edge.sourceHandle ?? null;
    if (sourceHandle && branchIdMap[edge.source]?.[sourceHandle]) {
      sourceHandle = branchIdMap[edge.source][sourceHandle];
    }

    return {
      id: `edge-${uuidv4().slice(0, 8)}`,
      source: nodeIdMap[edge.source],
      target: nodeIdMap[edge.target],
      sourceHandle,
      targetHandle: edge.targetHandle ?? null,
    };
  });

  return {
    graph: {
      nodes: [...graph.nodes, ...newNodes],
      edges: [...graph.edges, ...newEdges],
    },
    pastedNodeIds: newNodes.map((n) => n.id),
    skippedTrigger,
  };
}

export function graphToFlow(
  graph: TAutomationGraph,
  selectedNodeIds?: readonly string[] | null,
  selectedEdgeId?: string | null
): { nodes: Node<AutomationNodeData>[]; edges: Edge[] } {
  const selectedNodeSet = selectedNodeIds && selectedNodeIds.length > 0 ? new Set(selectedNodeIds) : null;
  const nodes: Node<AutomationNodeData>[] = (graph.nodes ?? []).map((n) => ({
    id: n.id,
    type: nodeTypeForKind(n.data.kind, n.data.catalog_key),
    position: n.position ?? { x: 0, y: 0 },
    selected: selectedNodeSet?.has(n.id) ?? false,
    data: {
      kind: n.data.kind,
      catalog_key: n.data.catalog_key,
      label: n.data.label,
      icon: n.data.icon,
      config: n.data.config ?? {},
    },
  }));
  const edges: Edge[] = (graph.edges ?? []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle ?? undefined,
    targetHandle: e.targetHandle ?? undefined,
    animated: true,
    selected: selectedEdgeId != null && e.id === selectedEdgeId,
  }));
  return { nodes, edges };
}

export function flowToGraph(nodes: Node<AutomationNodeData>[], edges: Edge[]): TAutomationGraph {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: nodeTypeForKind(n.data.kind, n.data.catalog_key),
      position: n.position ?? { x: 0, y: 0 },
      data: {
        kind: n.data.kind,
        catalog_key: n.data.catalog_key,
        label: n.data.label,
        icon: n.data.icon,
        config: n.data.config ?? {},
      },
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? null,
      targetHandle: e.targetHandle ?? null,
    })),
  };
}

export function createDefaultGraph(trigger: TAutomationCatalogItem): TAutomationGraph {
  const triggerId = `trigger-${uuidv4().slice(0, 8)}`;
  return {
    nodes: [
      {
        id: triggerId,
        type: AUTOMATION_NODE_TYPE,
        position: { x: 80, y: 120 },
        data: {
          kind: "trigger",
          catalog_key: trigger.key,
          label: trigger.label,
          config: { event_type: trigger.key },
        },
      },
    ],
    edges: [],
  };
}

export function createNodeFromCatalog(
  item: TAutomationCatalogItem,
  kind: AutomationNodeData["kind"],
  position: { x: number; y: number }
): Node<AutomationNodeData> {
  const config: Record<string, unknown> = {};
  if (kind === "trigger" && item.key === "schedule.cron") {
    Object.assign(config, {
      preset: "daily",
      time: "09:00",
      weekdays: [0, 1, 2, 3, 4],
      day_of_month: 1,
      cron: "0 9 * * *",
      timezone: "America/Sao_Paulo",
    });
  } else if (kind === "trigger") {
    config.event_type = item.key;
  }
  return {
    id: `${kind}-${uuidv4().slice(0, 8)}`,
    type: nodeTypeForKind(kind, item.key),
    position,
    data: {
      kind,
      catalog_key: item.key,
      label: item.label,
      icon: item.icon,
      config,
    },
  };
}

export function createParallelNode(
  item: TAutomationCatalogItem,
  position: { x: number; y: number }
): Node<AutomationNodeData> {
  return {
    id: `parallel-${uuidv4().slice(0, 8)}`,
    type: PARALLEL_NODE_TYPE,
    position,
    data: {
      kind: "parallel",
      catalog_key: item.key,
      label: item.label,
      icon: item.icon,
      config: { join_policy: "all", branches: createDefaultParallelBranches() },
    },
  };
}

export function createDecisionNode(
  position: { x: number; y: number },
  catalogKey: "decision.switch" | "decision.llm" = "decision.switch"
): Node<AutomationNodeData> {
  const isLlm = catalogKey === "decision.llm";
  return {
    id: `decision-${uuidv4().slice(0, 8)}`,
    type: DECISION_NODE_TYPE,
    position,
    data: {
      kind: "decision",
      catalog_key: catalogKey,
      label: isLlm ? "Decisão LLM" : "Tomada de decisão",
      icon: isLlm ? "sparkles" : "git-branch",
      config: isLlm
        ? { prompt: "", confidence_threshold: 80, human_branch_id: "", branches: [] }
        : { branches: createDefaultDecisionBranches() },
    },
  };
}

export function sampleDryRunEvent(
  boardId: string,
  workspace: string | { id: string },
  graph?: TAutomationGraph,
  ruleId?: string
) {
  const workspaceId = typeof workspace === "string" ? workspace : workspace.id;
  const trigger = graph?.nodes?.find((n) => n.data.kind === "trigger");
  const eventType = trigger?.data.catalog_key ?? "issue.updated";
  const issueId = uuidv4();
  const scheduleRuleId = ruleId ?? uuidv4();
  const slot = new Date().toISOString().slice(0, 16).replace("T", "T");

  if (eventType === "schedule.cron") {
    return {
      event_id: `schedule:${scheduleRuleId}:${slot}`,
      event_type: "schedule.cron",
      workspace_id: workspaceId,
      board_id: boardId,
      actor_id: null,
      entity_type: "schedule",
      entity_id: scheduleRuleId,
      project_id: null,
      payload: {
        rule_id: scheduleRuleId,
        slot,
        preset: trigger?.data.config?.preset ?? "daily",
        timezone: trigger?.data.config?.timezone ?? "America/Sao_Paulo",
      },
      occurred_at: new Date().toISOString(),
      automation_origin: false,
    };
  }

  const payload: Record<string, unknown> = { issue_id: issueId };
  if (eventType === "issue.updated" || eventType === "issue.state_changed") {
    payload.changed_fields = ["state_id"];
  }
  return {
    event_id: uuidv4(),
    event_type: eventType,
    workspace_id: workspaceId,
    board_id: boardId,
    actor_id: null,
    entity_type: "issue",
    entity_id: issueId,
    project_id: uuidv4(),
    payload,
    occurred_at: new Date().toISOString(),
    automation_origin: false,
  };
}
