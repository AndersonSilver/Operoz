import type { Edge, Node } from "@xyflow/react";
import type {
  TAutomationCatalogItem,
  TAutomationDecisionBranch,
  TAutomationGraph,
  TAutomationGraphEdge,
  TAutomationGraphNode,
} from "@operis/types";
import { v4 as uuidv4 } from "uuid";

export const AUTOMATION_NODE_TYPE = "automationNode";
export const DECISION_NODE_TYPE = "decisionNode";

export const ACTION_BRANCH_SUCCESS = "success";
export const ACTION_BRANCH_ERROR = "error";

export const BRANCHING_ACTION_KEYS = new Set(["action.run_script", "action.send_email"]);

export function isBranchingAction(catalogKey: string): boolean {
  return BRANCHING_ACTION_KEYS.has(catalogKey);
}

export type DecisionBranch = TAutomationDecisionBranch;

export type AutomationNodeData = {
  kind: "trigger" | "filter" | "decision" | "action";
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

function nodeTypeForKind(kind: AutomationNodeData["kind"]): string {
  return kind === "decision" ? DECISION_NODE_TYPE : AUTOMATION_NODE_TYPE;
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

export function extractGraphClip(
  graph: TAutomationGraph,
  nodeIds: readonly string[]
): TAutomationGraphClip | null {
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
  const edgesToPaste = clip.edges.filter(
    (e) => pasteIdSet.has(e.source) && pasteIdSet.has(e.target)
  );

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
  const selectedNodeSet =
    selectedNodeIds && selectedNodeIds.length > 0 ? new Set(selectedNodeIds) : null;
  const nodes: Node<AutomationNodeData>[] = (graph.nodes ?? []).map((n) => ({
    id: n.id,
    type: nodeTypeForKind(n.data.kind),
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
      type: n.type,
      position: n.position,
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
  if (kind === "trigger") config.event_type = item.key;
  return {
    id: `${kind}-${uuidv4().slice(0, 8)}`,
    type: nodeTypeForKind(kind),
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

export function createDecisionNode(position: { x: number; y: number }): Node<AutomationNodeData> {
  return {
    id: `decision-${uuidv4().slice(0, 8)}`,
    type: DECISION_NODE_TYPE,
    position,
    data: {
      kind: "decision",
      catalog_key: "decision.switch",
      label: "Tomada de decisão",
      icon: "git-branch",
      config: { branches: createDefaultDecisionBranches() },
    },
  };
}

export function sampleDryRunEvent(
  boardId: string,
  workspace: string | { id: string },
  graph?: TAutomationGraph
) {
  const workspaceId = typeof workspace === "string" ? workspace : workspace.id;
  const trigger = graph?.nodes?.find((n) => n.data.kind === "trigger");
  const eventType = trigger?.data.catalog_key ?? "issue.updated";
  const issueId = uuidv4();
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
