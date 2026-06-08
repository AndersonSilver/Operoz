import type { IBoard, TAutomationCatalog, TAutomationCatalogItem, TAutomationGraph } from "@operis/types";
import { BoardAutomationInspector } from "./board-automation-inspector";
import { BoardAutomationPalette } from "./board-automation-palette";
import type { AutomationNodeData } from "./automation-utils";

type Props = {
  workspaceSlug: string;
  board: IBoard;
  catalog: TAutomationCatalog;
  graph: TAutomationGraph;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onGraphChange: (graph: TAutomationGraph) => void;
  onUpdateNodeData: (nodeId: string, patch: Partial<AutomationNodeData>) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onAddNode: (item: TAutomationCatalogItem, kind: "trigger" | "filter" | "action") => void;
  onAddDecision: () => void;
};

export function BoardAutomationSidePanel(props: Props) {
  const {
    workspaceSlug,
    board,
    catalog,
    graph,
    selectedNodeId,
    selectedEdgeId,
    onGraphChange,
    onUpdateNodeData,
    onDeleteNode,
    onDeleteEdge,
    onAddNode,
    onAddDecision,
  } = props;

  const hasSelection = Boolean(selectedNodeId || selectedEdgeId);

  return (
    <div className="flex h-full min-h-0 w-80 shrink-0 flex-col overflow-hidden">
      {hasSelection ? (
        <BoardAutomationInspector
          workspaceSlug={workspaceSlug}
          board={board}
          catalog={catalog}
          graph={graph}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          onGraphChange={onGraphChange}
          onUpdateNodeData={onUpdateNodeData}
          onDeleteNode={onDeleteNode}
          onDeleteEdge={onDeleteEdge}
        />
      ) : (
        <BoardAutomationPalette catalog={catalog} onAdd={onAddNode} onAddDecision={onAddDecision} />
      )}
    </div>
  );
}
