import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import { AlertModalCore } from "@operoz/ui";
import { WorkflowCanvas } from "./workflow-canvas";
import { WorkflowOpenBanner } from "./workflow-open-banner";
import "./workflow-editor.css";
import { ensureGraphLayout, isOpenBootstrapWorkflow } from "./workflow-utils";
import type { TWorkflowGraph } from "@operoz/types";

type Props = {
  workspaceSlug: string;
  workflowId: string;
  workflowName: string;
  workflowDescription?: string;
  graph: TWorkflowGraph;
  onSave: (graph: TWorkflowGraph) => Promise<void>;
  onPublish: () => Promise<void>;
  onUpdateMetadata?: (data: { name: string; description: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
  isDraft: boolean;
  readonly?: boolean;
};

export const WorkflowEditor = observer((props: Props) => {
  const {
    workspaceSlug,
    workflowId,
    workflowName,
    workflowDescription = "",
    graph,
    onSave,
    onPublish,
    onUpdateMetadata,
    onDelete,
    isDraft,
    readonly = false,
  } = props;
  const { t } = useTranslation();
  const [localGraph, setLocalGraph] = useState<TWorkflowGraph>(graph);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingMeta, setIsUpdatingMeta] = useState(false);
  const [editName, setEditName] = useState(workflowName);
  const [editDescription, setEditDescription] = useState(workflowDescription);

  useEffect(() => {
    setLocalGraph(ensureGraphLayout(graph));
  }, [graph]);

  useEffect(() => {
    setEditName(workflowName);
    setEditDescription(workflowDescription);
  }, [workflowDescription, workflowName]);

  const showOpenBootstrapBanner = useMemo(
    () => isOpenBootstrapWorkflow(workflowName, workflowDescription, localGraph),
    [localGraph, workflowDescription, workflowName]
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localGraph);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workflow.saved"),
        message: t("workflow.saved_message"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workflow.save_failed"),
        message: t("workflow.save_failed_message"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await onPublish();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workflow.published"),
        message: t("workflow.published_message"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workflow.publish_failed"),
        message: t("workflow.publish_failed_message"),
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUpdateMetadata = async () => {
    if (!onUpdateMetadata) return;
    setIsUpdatingMeta(true);
    try {
      await onUpdateMetadata({
        name: editName.trim() || workflowName,
        description: editDescription.trim(),
      });
      setIsEditOpen(false);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workflow.edit_saved"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workflow.save_failed"),
      });
    } finally {
      setIsUpdatingMeta(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workflow.delete_failed"),
      });
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="workflow-editor-header shrink-0">
        <div className="workflow-editor-title">
          <h2>{workflowName}</h2>
          {isDraft && <span className="workflow-editor-badge">{t("workflow.draft")}</span>}
        </div>
        <div className="workflow-editor-actions">
          {!readonly && (
            <>
              {onUpdateMetadata && (
                <Button variant="secondary" onClick={() => setIsEditOpen(true)}>
                  <Pencil className="size-3.5" strokeWidth={1.75} />
                  {t("workflow.edit")}
                </Button>
              )}
              <Button variant="secondary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? t("workflow.saving") : t("workflow.save")}
              </Button>
              {isDraft && (
                <Button variant="primary" onClick={handlePublish} disabled={isPublishing}>
                  {isPublishing ? t("workflow.publishing") : t("workflow.publish")}
                </Button>
              )}
              {onDelete && (
                <Button variant="secondary" onClick={() => setIsDeleteOpen(true)}>
                  <Trash2 className="size-3.5 text-danger-primary" strokeWidth={1.75} />
                  {t("workflow.delete")}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {isEditOpen && onUpdateMetadata && (
        <section className="flex flex-col gap-3 rounded-md border border-subtle bg-layer-1 p-4">
          <h3 className="text-13 font-medium text-primary">{t("workflow.edit_title")}</h3>
          <div className="flex flex-col gap-1">
            <label className="text-11 text-tertiary" htmlFor="workflow-edit-name">
              {t("workflow.edit_name")}
            </label>
            <input
              id="workflow-edit-name"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              className="rounded-sm border border-subtle bg-surface-1 px-3 py-2 text-13 text-primary"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-11 text-tertiary" htmlFor="workflow-edit-description">
              {t("workflow.edit_description")}
            </label>
            <textarea
              id="workflow-edit-description"
              value={editDescription}
              onChange={(event) => setEditDescription(event.target.value)}
              rows={3}
              className="rounded-sm border border-subtle bg-surface-1 px-3 py-2 text-13 text-primary"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" onClick={handleUpdateMetadata} disabled={isUpdatingMeta}>
              {isUpdatingMeta ? t("workflow.saving") : t("workflow.edit_save")}
            </Button>
            <Button variant="secondary" onClick={() => setIsEditOpen(false)}>
              {t("common.cancel")}
            </Button>
          </div>
        </section>
      )}

      {showOpenBootstrapBanner && <WorkflowOpenBanner workspaceSlug={workspaceSlug} workflowId={workflowId} />}
      <div className="min-h-0 flex-1">
        <WorkflowCanvas
          graph={localGraph}
          selectedNodeIds={selectedNodeIds}
          selectedEdgeId={selectedEdgeId}
          onGraphChange={setLocalGraph}
          onNodesSelect={setSelectedNodeIds}
          onEdgeSelect={setSelectedEdgeId}
          readonly={readonly}
        />
      </div>

      <AlertModalCore
        isOpen={isDeleteOpen}
        handleClose={() => setIsDeleteOpen(false)}
        handleSubmit={handleDelete}
        title={t("workflow.delete_confirm_title")}
        content={t("workflow.delete_confirm_message", { name: workflowName })}
        primaryButtonText={{
          default: t("workflow.delete_confirm_action"),
          loading: t("workflow.deleting"),
        }}
        secondaryButtonText={t("common.cancel")}
        isSubmitting={isDeleting}
        variant="danger"
      />
    </div>
  );
});
