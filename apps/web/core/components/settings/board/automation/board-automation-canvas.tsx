import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type OnSelectionChangeParams,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ClipboardPaste, Copy } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import "./automation-canvas.css";
import { AutomationFlowNode } from "./automation-node";
import { DecisionFlowNode } from "./decision-flow-node";
import {
  AUTOMATION_NODE_TYPE,
  DECISION_NODE_TYPE,
  type AutomationNodeData,
  type TAutomationGraphClip,
  extractGraphClip,
  flowToGraph,
  graphToFlow,
  pasteGraphClip,
  removeEdgeFromGraph,
  removeNodeFromGraph,
} from "./automation-utils";
import type { TAutomationGraph } from "@operis/types";

type Props = {
  graph: TAutomationGraph;
  selectedNodeIds: string[];
  selectedEdgeId: string | null;
  onGraphChange: (graph: TAutomationGraph) => void;
  onNodesSelect: (nodeIds: string[]) => void;
  onEdgeSelect: (edgeId: string | null) => void;
};

const nodeTypes = {
  [AUTOMATION_NODE_TYPE]: AutomationFlowNode,
  [DECISION_NODE_TYPE]: DecisionFlowNode,
};

const STRUCTURAL_NODE_CHANGES = new Set(["add", "remove", "position", "replace", "reset"]);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

function minimapNodeColor(node: Node<AutomationNodeData>): string {
  switch (node.data?.kind) {
    case "trigger":
      return "var(--text-accent-primary)";
    case "filter":
      return "var(--text-warning-primary)";
    case "decision":
      return "var(--text-link-primary)";
    case "action":
      return "var(--text-success-primary)";
    default:
      return "var(--text-tertiary)";
  }
}

function CanvasInner(props: Props) {
  const {
    graph,
    selectedNodeIds,
    selectedEdgeId,
    onGraphChange,
    onNodesSelect,
    onEdgeSelect,
  } = props;
  const { t } = useTranslation();
  const clipboardRef = useRef<TAutomationGraphClip | null>(null);
  const pasteOffsetRef = useRef(0);
  const [hasClipboard, setHasClipboard] = useState(false);

  const { nodes, edges } = useMemo(
    () => graphToFlow(graph, selectedNodeIds, selectedEdgeId),
    [graph, selectedNodeIds, selectedEdgeId]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<Node<AutomationNodeData>>[]) => {
      const structuralChanges = changes.filter((change) => STRUCTURAL_NODE_CHANGES.has(change.type));
      if (structuralChanges.length === 0) return;

      const nextNodes = applyNodeChanges(structuralChanges, nodes);
      const removedIds = new Set(
        structuralChanges.filter((c) => c.type === "remove").map((c) => c.id)
      );
      const nextEdges =
        removedIds.size > 0
          ? edges.filter((e) => !removedIds.has(e.source) && !removedIds.has(e.target))
          : edges;

      onGraphChange(flowToGraph(nextNodes, nextEdges));
      if (removedIds.size > 0) {
        onNodesSelect(selectedNodeIds.filter((id) => !removedIds.has(id)));
      }
    },
    [nodes, edges, onGraphChange, onNodesSelect, selectedNodeIds]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      const structuralChanges = changes.filter((change) => change.type !== "select");
      if (structuralChanges.length === 0) return;

      const nextEdges = applyEdgeChanges(structuralChanges, edges);
      const removedIds = new Set(
        structuralChanges.filter((c) => c.type === "remove").map((c) => c.id)
      );
      onGraphChange(flowToGraph(nodes, nextEdges));
      if (selectedEdgeId && removedIds.has(selectedEdgeId)) onEdgeSelect(null);
    },
    [nodes, edges, onGraphChange, onEdgeSelect, selectedEdgeId]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const nextEdges = addEdge({ ...connection, animated: true }, edges);
      onGraphChange(flowToGraph(nodes, nextEdges));
    },
    [nodes, edges, onGraphChange]
  );

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: OnSelectionChangeParams) => {
      if (selectedEdges.length > 0) {
        onNodesSelect([]);
        onEdgeSelect(selectedEdges[selectedEdges.length - 1]?.id ?? null);
        return;
      }
      onEdgeSelect(null);
      onNodesSelect(selectedNodes.map((node) => node.id));
    },
    [onEdgeSelect, onNodesSelect]
  );

  const handlePaneClick = useCallback(() => {
    onNodesSelect([]);
    onEdgeSelect(null);
  }, [onEdgeSelect, onNodesSelect]);

  const handleCopy = useCallback(() => {
    const clip = extractGraphClip(graph, selectedNodeIds);
    if (!clip) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("boards.settings.automation.editor.copy_empty"),
      });
      return;
    }
    clipboardRef.current = clip;
    pasteOffsetRef.current = 0;
    setHasClipboard(true);
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: t("toast.success"),
      message: t("boards.settings.automation.editor.copy_success", { count: clip.nodes.length }),
    });
  }, [graph, selectedNodeIds, t]);

  const handlePaste = useCallback(() => {
    const clip = clipboardRef.current;
    if (!clip) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("boards.settings.automation.editor.paste_empty"),
      });
      return;
    }

    pasteOffsetRef.current += 1;
    const step = pasteOffsetRef.current;
    const offset = { x: 48 + step * 24, y: 48 + step * 24 };
    const result = pasteGraphClip(graph, clip, offset);

    if (result.pastedNodeIds.length === 0) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: result.skippedTrigger
          ? t("boards.settings.automation.editor.paste_skipped_trigger")
          : t("boards.settings.automation.editor.paste_empty"),
      });
      return;
    }

    onGraphChange(result.graph);
    onNodesSelect(result.pastedNodeIds);
    onEdgeSelect(null);

    if (result.skippedTrigger) {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.automation.editor.paste_success_skipped_trigger", {
          count: result.pastedNodeIds.length,
        }),
      });
      return;
    }

    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: t("toast.success"),
      message: t("boards.settings.automation.editor.paste_success", { count: result.pastedNodeIds.length }),
    });
  }, [graph, onEdgeSelect, onGraphChange, onNodesSelect, t]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) return;
      if (isEditableTarget(event.target)) return;

      if (event.key === "c" || event.key === "C") {
        event.preventDefault();
        handleCopy();
      }
      if (event.key === "v" || event.key === "V") {
        event.preventDefault();
        handlePaste();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCopy, handlePaste]);

  const handleNodesDelete = useCallback(
    (deletedNodes: Node<AutomationNodeData>[]) => {
      let nextGraph = graph;
      for (const node of deletedNodes) {
        nextGraph = removeNodeFromGraph(nextGraph, node.id);
      }
      onGraphChange(nextGraph);
      const deletedIds = new Set(deletedNodes.map((node) => node.id));
      onNodesSelect(selectedNodeIds.filter((id) => !deletedIds.has(id)));
    },
    [graph, onGraphChange, onNodesSelect, selectedNodeIds]
  );

  const handleEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      let nextGraph = graph;
      for (const edge of deletedEdges) {
        nextGraph = removeEdgeFromGraph(nextGraph, edge.id);
      }
      onGraphChange(nextGraph);
      if (selectedEdgeId && deletedEdges.some((e) => e.id === selectedEdgeId)) {
        onEdgeSelect(null);
      }
    },
    [graph, onEdgeSelect, onGraphChange, selectedEdgeId]
  );

  const canCopy = selectedNodeIds.length > 0;
  const canPaste = hasClipboard;

  return (
    <div className="automation-flow-host automation-workspace-height rounded-lg border border-subtle bg-surface-2">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={handleSelectionChange}
        onPaneClick={handlePaneClick}
        onNodesDelete={handleNodesDelete}
        onEdgesDelete={handleEdgesDelete}
        deleteKeyCode={["Backspace", "Delete"]}
        elementsSelectable
        nodesDeletable
        edgesDeletable
        selectionOnDrag
        panOnDrag={[1, 2]}
        multiSelectionKeyCode="Shift"
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} />
        <Controls position="bottom-left" showInteractive={false} />
        <MiniMap
          position="bottom-right"
          pannable
          zoomable
          nodeColor={minimapNodeColor}
          maskColor="rgb(0 0 0 / 0.55)"
          style={{ width: 140, height: 100 }}
        />
        <Panel position="top-left" className="automation-canvas-clipboard-panel">
          <button
            type="button"
            className="automation-canvas-clipboard-btn"
            disabled={!canCopy}
            title={t("boards.settings.automation.editor.copy_shortcut")}
            aria-label={t("boards.settings.automation.editor.copy")}
            onClick={handleCopy}
          >
            <Copy className="size-3.5" />
            <span>{t("boards.settings.automation.editor.copy")}</span>
          </button>
          <button
            type="button"
            className="automation-canvas-clipboard-btn"
            disabled={!canPaste}
            title={t("boards.settings.automation.editor.paste_shortcut")}
            aria-label={t("boards.settings.automation.editor.paste")}
            onClick={handlePaste}
          >
            <ClipboardPaste className="size-3.5" />
            <span>{t("boards.settings.automation.editor.paste")}</span>
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function BoardAutomationCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
