import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import "./workflow-canvas.css";
import { WorkflowStateNode } from "./workflow-state-node";
import { WorkflowStepEdge, WORKFLOW_STEP_EDGE_TYPE } from "./workflow-step-edge";
import {
  WORKFLOW_STATE_NODE_TYPE,
  WORKFLOW_EDGE_TYPE,
  type WorkflowNodeData,
  type WorkflowEdgeData,
  graphToFlow,
  flowToGraph,
  removeNodeFromGraph,
  removeEdgeFromGraph,
} from "./workflow-utils";
import type { TWorkflowGraph } from "@operoz/types";

type Props = {
  graph: TWorkflowGraph;
  selectedNodeIds: string[];
  selectedEdgeId: string | null;
  onGraphChange: Dispatch<SetStateAction<TWorkflowGraph>>;
  onNodesSelect: (nodeIds: string[]) => void;
  onEdgeSelect: (edgeId: string | null) => void;
  readonly?: boolean;
};

const nodeTypes = {
  [WORKFLOW_STATE_NODE_TYPE]: WorkflowStateNode,
};

const edgeTypes = {
  [WORKFLOW_STEP_EDGE_TYPE]: WorkflowStepEdge,
  step: WorkflowStepEdge,
};

function CanvasInner(props: Props) {
  const {
    graph,
    selectedNodeIds,
    selectedEdgeId,
    onGraphChange,
    onNodesSelect,
    onEdgeSelect,
    readonly = false,
  } = props;
  const { t } = useTranslation();
  const { fitView } = useReactFlow();
  const skipGraphSyncRef = useRef(false);
  const isDraggingRef = useRef(false);
  const didFitViewRef = useRef(false);

  const flowFromGraph = useMemo(
    () => graphToFlow(graph, selectedNodeIds, selectedEdgeId),
    [graph, selectedNodeIds, selectedEdgeId]
  );

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(flowFromGraph.nodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(flowFromGraph.edges);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  const persistFlowToGraph = useCallback(
    (nextNodes: Node<WorkflowNodeData>[], nextEdges: Edge[]) => {
      skipGraphSyncRef.current = true;
      onGraphChange(flowToGraph(nextNodes, nextEdges as any));
    },
    [onGraphChange]
  );

  useEffect(() => {
    if (skipGraphSyncRef.current) {
      skipGraphSyncRef.current = false;
      return;
    }
    if (isDraggingRef.current) return;

    const { nodes: nextNodes, edges: nextEdges } = graphToFlow(graph, selectedNodeIds, selectedEdgeId);
    setNodes(nextNodes);
    setEdges(nextEdges);
  }, [graph, selectedNodeIds, selectedEdgeId, setNodes, setEdges]);

  useEffect(() => {
    if (didFitViewRef.current || nodes.length === 0) return;
    didFitViewRef.current = true;
    requestAnimationFrame(() => {
      void fitView({ padding: 0.2 });
    });
  }, [nodes.length, fitView]);

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<WorkflowNodeData>>[]) => {
      if (readonly) return;
      onNodesChangeInternal(changes);
      persistFlowToGraph(applyNodeChanges(changes, nodesRef.current), edgesRef.current);
    },
    [readonly, onNodesChangeInternal, persistFlowToGraph]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (readonly) return;
      onEdgesChangeInternal(changes as any);
      const updatedEdges = applyEdgeChanges(changes, edgesRef.current);
      persistFlowToGraph(nodesRef.current, updatedEdges);
    },
    [readonly, onEdgesChangeInternal, persistFlowToGraph]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (readonly) return;
      const newEdges = addEdge(connection, edgesRef.current);
      setEdges(newEdges);
      persistFlowToGraph(nodesRef.current, newEdges);
    },
    [readonly, setEdges, persistFlowToGraph]
  );

  const onNodeDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  const onNodeDragStop = useCallback(() => {
    isDraggingRef.current = false;
    persistFlowToGraph(nodesRef.current, edgesRef.current);
  }, [persistFlowToGraph]);

  const onSelectionChange = useCallback(
    (params: { nodes: Node[]; edges: Edge[] }) => {
      onNodesSelect(params.nodes.map((n) => n.id));
      onEdgeSelect(params.edges.length > 0 ? params.edges[0].id : null);
    },
    [onNodesSelect, onEdgeSelect]
  );

  const onNodeDelete = useCallback(() => {
    if (readonly) return;
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;

    const nextGraph = selectedNodes.reduce((acc, node) => removeNodeFromGraph(acc, node.id), graph);
    onGraphChange(nextGraph);
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: t("workflow.node_deleted"),
      message: t("workflow.node_deleted_message"),
    });
  }, [readonly, nodes, graph, onGraphChange, t]);

  const onEdgeDelete = useCallback(() => {
    if (readonly) return;
    const selectedEdges = edges.filter((e) => e.selected);
    if (selectedEdges.length === 0) return;

    const nextGraph = selectedEdges.reduce((acc, edge) => removeEdgeFromGraph(acc, edge.id), graph);
    onGraphChange(nextGraph);
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: t("workflow.transition_deleted"),
      message: t("workflow.transition_deleted_message"),
    });
  }, [readonly, edges, graph, onGraphChange, t]);

  const onFitView = useCallback(() => {
    void fitView({ padding: 0.2 });
  }, [fitView]);

  const selectedEdge = useMemo(() => edges.find((edge) => edge.id === selectedEdgeId), [edges, selectedEdgeId]);

  const selectedEdgeOffset =
    typeof (selectedEdge?.data as WorkflowEdgeData | undefined)?.pathOffset === "number"
      ? (selectedEdge?.data as WorkflowEdgeData).pathOffset!
      : 24;

  const updateSelectedEdgeOffset = useCallback(
    (pathOffset: number) => {
      if (!selectedEdgeId || readonly) return;
      const nextEdges = edgesRef.current.map((edge) => {
        if (edge.id !== selectedEdgeId) return edge;
        return {
          ...edge,
          data: {
            ...(edge.data as WorkflowEdgeData),
            pathOffset,
          },
        };
      });
      setEdges(nextEdges);
      persistFlowToGraph(nodesRef.current, nextEdges);
    },
    [persistFlowToGraph, readonly, selectedEdgeId, setEdges]
  );

  return (
    <div className="workflow-flow-host workflow-flow-height rounded-lg border border-subtle bg-surface-2">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange}
        onNodesDelete={onNodeDelete}
        onEdgesDelete={onEdgeDelete}
        fitView
        deleteKeyCode={readonly ? null : "Delete"}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{ type: WORKFLOW_EDGE_TYPE }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor={(node) => (node.data as WorkflowNodeData).color}
          maskColor="rgb(0 0 0 / 0.55)"
          style={{ width: 140, height: 100 }}
        />
        {!readonly && selectedEdgeId && (
          <Panel position="top-left" className="workflow-panel workflow-edge-panel">
            <p className="workflow-edge-panel-title">{t("workflow.edge_routing_title")}</p>
            <label className="workflow-edge-panel-label" htmlFor="workflow-edge-offset">
              {t("workflow.edge_routing_offset")}
            </label>
            <input
              id="workflow-edge-offset"
              type="range"
              min={8}
              max={120}
              step={4}
              value={selectedEdgeOffset}
              onChange={(event) => updateSelectedEdgeOffset(Number(event.target.value))}
              className="workflow-edge-panel-range"
            />
            <span className="workflow-edge-panel-value">{selectedEdgeOffset}px</span>
          </Panel>
        )}
        {!readonly && (
          <Panel position="top-right" className="workflow-panel">
            <button onClick={onFitView} className="workflow-panel-button">
              {t("workflow.fit_view")}
            </button>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

export function WorkflowCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
