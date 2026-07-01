import { type Edge, type Node, addEdge, type Connection, type OnConnect } from "@xyflow/react";
import type { TWorkflowGraph, TWorkflowGraphNode, TWorkflowGraphEdge } from "@operoz/types";

export const WORKFLOW_STATE_NODE_TYPE = "workflow-state";
export const WORKFLOW_EDGE_TYPE = "step";

function normalizeEdgeType(type?: string): string {
  if (!type || type === "transition" || type === "smoothstep" || type === "straight") {
    return WORKFLOW_EDGE_TYPE;
  }
  return type;
}

export type WorkflowNodeData = {
  state_id: string;
  name: string;
  color: string;
  group: string;
  is_initial?: boolean;
};

export type WorkflowEdgeData = {
  name: string;
  is_global: boolean;
  conditions: Array<{ type: string; config: Record<string, unknown> }>;
  validators: Array<{ type: string; config: Record<string, unknown> }>;
  post_functions: Array<{ type: string; config: Record<string, unknown> }>;
  screen?: { fields: Array<{ field_id: string; required: boolean }> };
  pathOffset?: number;
};

export function graphToFlow(
  graph: TWorkflowGraph,
  selectedNodeIds: string[] = [],
  selectedEdgeId: string | null = null
): { nodes: Node<WorkflowNodeData>[]; edges: Edge<WorkflowEdgeData>[] } {
  const nodes: Node<WorkflowNodeData>[] = graph.nodes.map((node) => ({
    id: node.id,
    type: WORKFLOW_STATE_NODE_TYPE,
    position: node.position,
    data: {
      state_id: node.data.state_id,
      name: node.data.name,
      color: node.data.color,
      group: node.data.group,
      is_initial: node.data.is_initial,
    },
    selected: selectedNodeIds.includes(node.id),
  }));

  const edges: Edge<WorkflowEdgeData>[] = graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: normalizeEdgeType(edge.type),
    data: {
      name: edge.data.name,
      is_global: edge.data.is_global,
      conditions: edge.data.conditions,
      validators: edge.data.validators,
      post_functions: edge.data.post_functions,
      screen: edge.data.screen,
    },
    selected: selectedEdgeId === edge.id,
  }));

  return { nodes, edges };
}

export function flowToGraph(nodes: Node<WorkflowNodeData>[], edges: Edge<WorkflowEdgeData>[]): TWorkflowGraph {
  const graphNodes: TWorkflowGraphNode[] = nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: {
      state_id: node.data.state_id,
      name: node.data.name,
      color: node.data.color,
      group: node.data.group,
      is_initial: node.data.is_initial,
    },
  }));

  const graphEdges: TWorkflowGraphEdge[] = edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    data: edge.data || {
      name: "Transition",
      is_global: false,
      conditions: [],
      validators: [],
      post_functions: [],
    },
  }));

  return { nodes: graphNodes, edges: graphEdges };
}

export function removeNodeFromGraph(graph: TWorkflowGraph, nodeId: string): TWorkflowGraph {
  return {
    nodes: graph.nodes.filter((node) => node.id !== nodeId),
    edges: graph.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
  };
}

export function removeEdgeFromGraph(graph: TWorkflowGraph, edgeId: string): TWorkflowGraph {
  return {
    nodes: graph.nodes,
    edges: graph.edges.filter((edge) => edge.id !== edgeId),
  };
}

export function createWorkflowNode(
  stateId: string,
  name: string,
  color: string,
  group: string,
  position: { x: number; y: number },
  isInitial: boolean = false
): TWorkflowGraphNode {
  return {
    id: `state-${stateId}`,
    type: WORKFLOW_STATE_NODE_TYPE,
    position,
    data: {
      state_id: stateId,
      name,
      color,
      group,
      is_initial: isInitial,
    },
  };
}

export function createWorkflowEdge(
  sourceId: string,
  targetId: string,
  name: string = "Transition"
): TWorkflowGraphEdge {
  return {
    id: `edge-${sourceId}-${targetId}`,
    source: sourceId,
    target: targetId,
    type: WORKFLOW_EDGE_TYPE,
    data: {
      name,
      is_global: false,
      conditions: [],
      validators: [],
      post_functions: [],
    },
  };
}

const STATE_GROUP_ORDER: Record<string, number> = {
  backlog: 0,
  unstarted: 1,
  started: 2,
  completed: 3,
  cancelled: 4,
};

const LAYOUT_COLUMNS = 4;
const LAYOUT_X_STEP = 280;
const LAYOUT_Y_STEP = 140;

function defaultNodePosition(index: number) {
  const column = index % LAYOUT_COLUMNS;
  const row = Math.floor(index / LAYOUT_COLUMNS);
  return { x: column * LAYOUT_X_STEP, y: row * LAYOUT_Y_STEP };
}

function nodesAreStacked(nodes: TWorkflowGraphNode[]) {
  if (nodes.length <= 1) return false;
  const first = nodes[0]?.position ?? { x: 0, y: 0 };
  return nodes.every((node) => Math.abs(node.position.x - first.x) < 1 && Math.abs(node.position.y - first.y) < 1);
}

/** Spread nodes that share (0,0) — legacy graphs before automatic layout. */
export function ensureGraphLayout(graph: TWorkflowGraph): TWorkflowGraph {
  if (!nodesAreStacked(graph.nodes)) return graph;

  const sorted = [...graph.nodes].sort((a, b) => {
    const groupDelta = (STATE_GROUP_ORDER[a.data.group] ?? 99) - (STATE_GROUP_ORDER[b.data.group] ?? 99);
    if (groupDelta !== 0) return groupDelta;
    return a.data.name.localeCompare(b.data.name);
  });

  const positionById = new Map<string, { x: number; y: number }>();
  sorted.forEach((node, index) => {
    positionById.set(node.id, defaultNodePosition(index));
  });

  return {
    ...graph,
    nodes: graph.nodes.map((node) => ({
      ...node,
      position: positionById.get(node.id) ?? node.position,
    })),
  };
}

const OPEN_WORKFLOW_NAME_SUFFIXES = [" — Open", " - Open"] as const;

const OPEN_WORKFLOW_DESCRIPTION_MARKERS = ["all state transitions allowed", "auto-generated open workflow"] as const;

/** True when edge count matches an all-to-all graph (legacy Open bootstrap). */
export function isFullyConnectedWorkflowGraph(graph: TWorkflowGraph): boolean {
  const nodeCount = graph.nodes.length;
  if (nodeCount < 3) return false;

  const openEdgeCount = nodeCount * (nodeCount - 1);
  return graph.edges.length >= openEdgeCount * 0.75;
}

export function isOpenBootstrapWorkflow(name: string, description: string | undefined, graph: TWorkflowGraph): boolean {
  const nameLooksOpen = OPEN_WORKFLOW_NAME_SUFFIXES.some((suffix) => name.endsWith(suffix));
  const normalizedDescription = description?.trim().toLowerCase() ?? "";
  const descriptionLooksOpen = OPEN_WORKFLOW_DESCRIPTION_MARKERS.some((marker) =>
    normalizedDescription.includes(marker)
  );

  return nameLooksOpen || descriptionLooksOpen || isFullyConnectedWorkflowGraph(graph);
}
