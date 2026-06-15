import { useTranslation } from "@operis/i18n";
import type { IBoard, TAutomationCatalog, TAutomationGraph } from "@operis/types";
import { AutomationNodeConfigForm } from "./automation-node-config-form";
import type { AutomationNodeData } from "./automation-utils";
import { getDecisionBranches } from "./automation-utils";
import { DecisionInspector } from "./decision-inspector";
import { LlmDecisionInspector } from "./llm-decision-inspector";
import { ParallelInspector } from "./parallel-inspector";
import { getParallelBranches } from "./automation-utils";
import { ConfigField, ConfigTextInput } from "./automation-config-primitives";
import { useAutomationBoardContext } from "./use-automation-board-context";

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
};

export function BoardAutomationInspector(props: Props) {
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
  } = props;
  const { t } = useTranslation();
  const boardContext = useAutomationBoardContext(workspaceSlug, board);

  const node = graph.nodes.find((n) => n.id === selectedNodeId);
  const edge = graph.edges.find((e) => e.id === selectedEdgeId);

  if (edge) {
    const source = graph.nodes.find((n) => n.id === edge.source);
    const target = graph.nodes.find((n) => n.id === edge.target);
    const branch =
      source?.data.kind === "decision" && edge.sourceHandle
        ? getDecisionBranches({
            kind: "decision",
            catalog_key: source.data.catalog_key,
            label: source.data.label,
            config: source.data.config ?? {},
          }).find((b) => b.id === edge.sourceHandle)
        : source?.data.kind === "parallel" && edge.sourceHandle
          ? getParallelBranches({
              kind: "parallel",
              catalog_key: source.data.catalog_key,
              label: source.data.label,
              config: source.data.config ?? {},
            }).find((b) => b.id === edge.sourceHandle)
          : null;

    return (
      <div className="flex h-full min-h-0 flex-col overflow-y-auto rounded-lg border border-subtle bg-surface-1 p-3">
        <p className="mb-2 text-11 font-semibold tracking-wide text-tertiary uppercase">
          {t("boards.settings.automation.inspector.connection")}
        </p>
        <p className="text-13 text-primary">
          {source?.data.label ?? edge.source}
          {branch ? ` → ${branch.label}` : ""} → {target?.data.label ?? edge.target}
        </p>
        <p className="mt-2 text-11 text-tertiary">{t("boards.settings.automation.inspector.delete_hint")}</p>
        <button
          type="button"
          className="border-danger-primary mt-4 rounded-md border px-3 py-1.5 text-13 text-danger-primary hover:bg-danger-primary/10"
          onClick={() => onDeleteEdge(edge.id)}
        >
          {t("boards.settings.automation.inspector.delete_connection")}
        </button>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-y-auto rounded-lg border border-subtle bg-surface-1 p-3">
        <p className="text-13 text-tertiary">{t("boards.settings.automation.inspector.empty")}</p>
        <p className="mt-3 text-11 text-tertiary">{t("boards.settings.automation.inspector.delete_hint")}</p>
      </div>
    );
  }

  if (node.data.kind === "parallel") {
    return (
      <ParallelInspector
        graph={graph}
        nodeId={node.id}
        label={node.data.label}
        config={node.data.config ?? {}}
        onUpdateLabel={(label) => onUpdateNodeData(node.id, { label })}
        onUpdateConfig={(config) => onUpdateNodeData(node.id, { config })}
        onGraphChange={onGraphChange}
        onDeleteNode={() => onDeleteNode(node.id)}
      />
    );
  }

  if (node.data.kind === "decision" && node.data.catalog_key === "decision.llm") {
    return (
      <LlmDecisionInspector
        graph={graph}
        nodeId={node.id}
        label={node.data.label}
        config={node.data.config ?? {}}
        onUpdateLabel={(label) => onUpdateNodeData(node.id, { label })}
        onUpdateConfig={(config) => onUpdateNodeData(node.id, { config })}
        onGraphChange={onGraphChange}
        onDeleteNode={() => onDeleteNode(node.id)}
      />
    );
  }

  if (node.data.kind === "decision") {
    return (
      <DecisionInspector
        graph={graph}
        nodeId={node.id}
        label={node.data.label}
        config={node.data.config ?? {}}
        boardContext={boardContext}
        onUpdateLabel={(label) => onUpdateNodeData(node.id, { label })}
        onUpdateConfig={(config) => onUpdateNodeData(node.id, { config })}
        onGraphChange={onGraphChange}
        onDeleteNode={() => onDeleteNode(node.id)}
      />
    );
  }

  const nodeData: AutomationNodeData = {
    kind: node.data.kind,
    catalog_key: node.data.catalog_key,
    label: node.data.label,
    config: node.data.config ?? {},
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto rounded-lg border border-subtle bg-surface-1 p-3">
      <p className="mb-2 text-11 font-semibold tracking-wide text-tertiary uppercase">
        {t("boards.settings.automation.inspector.node")}
      </p>

      {boardContext.isLoading ? (
        <p className="text-13 text-tertiary">{t("loading")}</p>
      ) : (
        <>
          <ConfigField label={t("boards.settings.automation.inspector.label")}>
            <ConfigTextInput value={node.data.label} onChange={(label) => onUpdateNodeData(node.id, { label })} />
          </ConfigField>

          <AutomationNodeConfigForm
            data={nodeData}
            catalog={catalog}
            boardContext={boardContext}
            workspaceSlug={workspaceSlug}
            boardSlug={board.slug}
            onUpdateData={(patch) => onUpdateNodeData(node.id, patch)}
          />
        </>
      )}

      <p className="mt-3 text-11 text-tertiary">{t("boards.settings.automation.inspector.delete_hint")}</p>
      <button
        type="button"
        className="border-danger-primary mt-3 rounded-md border px-3 py-1.5 text-13 text-danger-primary hover:bg-danger-primary/10"
        onClick={() => onDeleteNode(node.id)}
      >
        {t("boards.settings.automation.inspector.delete_node")}
      </button>
    </div>
  );
}
