import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import { useNavigate } from "react-router";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IBoard, IBoardAutomationRule, TAutomationCatalog, TAutomationGraph } from "@operis/types";
import { BoardService } from "@/services/board/board.service";
import { BoardAutomationCanvas } from "./board-automation-canvas";
import { BoardAutomationSidePanel } from "./board-automation-side-panel";
import { AutomationRevisionHistoryPanel } from "./automation-revision-history-panel";
import { AutomationRuleEditorHeader } from "./automation-rule-editor-header";
import { prepareAutomationTestNavigation } from "./automation-test-utils";
import {
  createDecisionNode,
  createNodeFromCatalog,
  removeEdgeFromGraph,
  removeNodeFromGraph,
} from "./automation-utils";

const boardService = new BoardService();

type Props = {
  workspaceSlug: string;
  board: IBoard;
  rule: IBoardAutomationRule;
  catalog: TAutomationCatalog;
  onBack: () => void;
  onSaved: (rule: IBoardAutomationRule) => void;
};

function syncEditorFromRule(rule: IBoardAutomationRule) {
  return {
    name: rule.name,
    description: rule.description ?? "",
    enabled: rule.enabled,
    graph: rule.graph ?? { nodes: [], edges: [] },
  };
}

export const BoardAutomationEditor = observer(function BoardAutomationEditor(props: Props) {
  const { workspaceSlug, board, rule, catalog, onBack, onSaved } = props;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState(rule.name);
  const [description, setDescription] = useState(rule.description ?? "");
  const [enabled, setEnabled] = useState(rule.enabled);
  const [graph, setGraph] = useState<TAutomationGraph>(rule.graph ?? { nodes: [], edges: [] });
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const selectedNodeId = selectedNodeIds[selectedNodeIds.length - 1] ?? null;
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [showRevisions, setShowRevisions] = useState(false);

  const applyRule = useCallback(
    (updated: IBoardAutomationRule) => {
      const next = syncEditorFromRule(updated);
      setName(next.name);
      setDescription(next.description);
      setEnabled(next.enabled);
      setGraph(next.graph);
      onSaved(updated);
    },
    [onSaved]
  );

  const validateCurrentGraph = async () => {
    const validation = await boardService.validateAutomationGraph(workspaceSlug, board.slug, graph);
    if (!validation.valid) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: validation.errors.join("; "),
      });
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!(await validateCurrentGraph())) return;

    setSaving(true);
    try {
      const updated = await boardService.updateAutomationRule(workspaceSlug, board.slug, rule.id, {
        name,
        description,
        enabled: rule.is_published ? enabled : false,
        graph,
      });
      applyRule(updated);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.automation.editor.draft_saved"),
      });
    } catch (error: unknown) {
      const payload = error as { code?: string; error?: string; graph_errors?: string[] };
      if (payload?.code === "publish_required_before_enable") {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("boards.settings.automation.editor.enable_requires_publish"),
        });
        return;
      }
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: payload?.graph_errors?.join("; ") ?? payload?.error ?? t("something_went_wrong"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!(await validateCurrentGraph())) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("boards.settings.automation.editor.publish_requires_valid_graph"),
      });
      return;
    }

    setPublishing(true);
    try {
      await boardService.updateAutomationRule(workspaceSlug, board.slug, rule.id, {
        name,
        description,
        graph,
        enabled: rule.is_published ? enabled : false,
      });
      const updated = await boardService.publishAutomationRule(workspaceSlug, board.slug, rule.id);
      applyRule(updated);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.automation.editor.publish_success"),
      });
    } catch (error: unknown) {
      const payload = error as { error?: string; graph_errors?: string[] };
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: payload?.graph_errors?.join("; ") ?? payload?.error ?? t("something_went_wrong"),
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleEnabledChange = async (nextEnabled: boolean) => {
    if (!rule.is_published) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("boards.settings.automation.editor.enable_requires_publish"),
      });
      return;
    }

    setEnabled(nextEnabled);
    setSaving(true);
    try {
      const updated = await boardService.updateAutomationRule(workspaceSlug, board.slug, rule.id, {
        enabled: nextEnabled,
      });
      applyRule(updated);
    } catch (error: unknown) {
      setEnabled(!nextEnabled);
      const payload = error as { code?: string; error?: string };
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message:
          payload?.code === "publish_required_before_enable"
            ? t("boards.settings.automation.editor.enable_requires_publish")
            : payload?.error ?? t("something_went_wrong"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddNode = useCallback(
    (item: Parameters<typeof createNodeFromCatalog>[0], kind: "trigger" | "filter" | "action") => {
      const yOffset = graph.nodes.length * 80;
      const node = createNodeFromCatalog(item, kind, { x: 280, y: 80 + yOffset });
      setGraph((prev) => ({
        ...prev,
        nodes: [
          ...prev.nodes,
          {
            id: node.id,
            type: node.type,
            position: node.position,
            data: node.data,
          },
        ],
      }));
    },
    [graph.nodes.length]
  );

  const handleAddDecision = useCallback(() => {
    const yOffset = graph.nodes.length * 80;
    const node = createDecisionNode({ x: 320, y: 80 + yOffset });
    setGraph((prev) => ({
      ...prev,
      nodes: [
        ...prev.nodes,
        {
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        },
      ],
    }));
    setSelectedNodeIds([node.id]);
    setSelectedEdgeId(null);
  }, [graph.nodes.length]);

  const updateNodeData = (
    nodeId: string,
    patch: Partial<{ kind: string; catalog_key: string; label: string; config: Record<string, unknown> }>
  ) => {
    setGraph((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n)),
    }));
  };

  const deleteNode = (nodeId: string) => {
    setGraph((prev) => removeNodeFromGraph(prev, nodeId));
    setSelectedNodeIds((current) => current.filter((id) => id !== nodeId));
  };

  const deleteEdge = (edgeId: string) => {
    setGraph((prev) => removeEdgeFromGraph(prev, edgeId));
    setSelectedEdgeId((current) => (current === edgeId ? null : current));
  };

  const handleDryRun = () => {
    const href = prepareAutomationTestNavigation({
      workspaceSlug,
      board,
      rule,
      ruleName: name,
      graph,
    });
    navigate(href);
  };

  const handleRevisionRestored = async () => {
    const fresh = await boardService.getAutomationRules(workspaceSlug, board.slug);
    const updated = fresh.find((item) => item.id === rule.id);
    if (updated) {
      applyRule(updated);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("boards.settings.automation.editor.revision_restore_success"),
      });
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="shrink-0">
        <AutomationRuleEditorHeader
          rule={rule}
          name={name}
          description={description}
          enabled={enabled}
          graph={graph}
          saving={saving}
          publishing={publishing}
          historyHref={`/${workspaceSlug}/settings/boards/${board.slug}/automacao/historico`}
          onBack={onBack}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onEnabledChange={handleEnabledChange}
          onSaveDraft={handleSaveDraft}
          onPublish={handlePublish}
          onOpenRevisions={() => setShowRevisions(true)}
          onTest={handleDryRun}
        />
      </div>

      <div className="flex min-h-0 flex-1 items-stretch gap-3">
        <div className="h-full min-h-0 min-w-0 flex-1">
          <BoardAutomationCanvas
            graph={graph}
            selectedNodeIds={selectedNodeIds}
            selectedEdgeId={selectedEdgeId}
            onGraphChange={setGraph}
            onNodesSelect={setSelectedNodeIds}
            onEdgeSelect={setSelectedEdgeId}
          />
        </div>
        {showRevisions ? (
          <AutomationRevisionHistoryPanel
            workspaceSlug={workspaceSlug}
            boardSlug={board.slug}
            ruleId={rule.id}
            onClose={() => setShowRevisions(false)}
            onRestored={handleRevisionRestored}
          />
        ) : (
          <BoardAutomationSidePanel
            workspaceSlug={workspaceSlug}
            board={board}
            catalog={catalog}
            graph={graph}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            onGraphChange={setGraph}
            onUpdateNodeData={updateNodeData}
            onDeleteNode={deleteNode}
            onDeleteEdge={deleteEdge}
            onAddNode={handleAddNode}
            onAddDecision={handleAddDecision}
          />
        )}
      </div>
    </div>
  );
});
