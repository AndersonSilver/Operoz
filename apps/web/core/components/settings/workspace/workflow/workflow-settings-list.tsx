import { GitBranch, Trash2 } from "lucide-react";
import { observer } from "mobx-react";
import { useState } from "react";
import { useTranslation } from "@operoz/i18n";
import { EmptyStateCompact } from "@operoz/propel/empty-state";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import { AlertModalCore } from "@operoz/ui";
import type { IWorkflow } from "@operoz/types";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  workspaceSlug: string;
  workflows: IWorkflow[];
  onDelete?: (workflowId: string) => Promise<void>;
};

export const WorkflowSettingsList = observer(function WorkflowSettingsList(props: Props) {
  const { workspaceSlug, workflows, onDelete } = props;
  const { t } = useTranslation();
  const router = useAppRouter();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const pendingWorkflow = workflows.find((workflow) => workflow.id === pendingDeleteId);

  const handleDelete = async () => {
    if (!pendingDeleteId || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(pendingDeleteId);
      setPendingDeleteId(null);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workflow.deleted"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workflow.delete_failed"),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (workflows.length === 0) {
    return (
      <EmptyStateCompact
        title={t("workspace_settings.settings.workflow.empty_title")}
        description={t("workspace_settings.settings.workflow.empty_description")}
      />
    );
  }

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className="group/card flex flex-col gap-2 rounded-md border border-subtle bg-layer-1 p-4 transition-colors hover:bg-layer-1-hover"
          >
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => router.push(`/${workspaceSlug}/settings/workflow/${workflow.id}`)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <GitBranch className="size-4 shrink-0 text-tertiary" strokeWidth={1.75} />
                <span className="truncate text-13 font-medium text-primary">{workflow.name}</span>
              </button>
              <div className="flex shrink-0 items-center gap-1">
                {workflow.is_draft ? (
                  <span className="rounded-sm bg-warning-subtle px-1.5 py-0.5 text-11 text-warning-primary">
                    {t("workflow.draft")}
                  </span>
                ) : (
                  <span className="rounded-sm bg-success-subtle px-1.5 py-0.5 text-11 text-success-primary">
                    {t("workspace_settings.settings.workflow.published_badge")}
                  </span>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => setPendingDeleteId(workflow.id)}
                    className="rounded-sm p-1 text-tertiary opacity-0 transition-opacity group-hover/card:opacity-100 hover:bg-layer-transparent-hover hover:text-danger-primary"
                    aria-label={t("workflow.delete")}
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.75} />
                  </button>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/${workspaceSlug}/settings/workflow/${workflow.id}`)}
              className="text-left"
            >
              {workflow.description ? (
                <p className="line-clamp-2 text-12 text-secondary">{workflow.description}</p>
              ) : (
                <p className="text-12 text-tertiary">{t("workspace_settings.settings.workflow.no_description")}</p>
              )}
              <p className="mt-1 text-11 text-tertiary">
                {t("workspace_settings.settings.workflow.version", { version: workflow.published_version })}
              </p>
            </button>
          </div>
        ))}
      </div>

      <AlertModalCore
        isOpen={pendingDeleteId !== null}
        handleClose={() => setPendingDeleteId(null)}
        handleSubmit={handleDelete}
        title={t("workflow.delete_confirm_title")}
        content={t("workflow.delete_confirm_message", { name: pendingWorkflow?.name ?? "" })}
        primaryButtonText={{
          default: t("workflow.delete_confirm_action"),
          loading: t("workflow.deleting"),
        }}
        secondaryButtonText={t("common.cancel")}
        isSubmitting={isDeleting}
        variant="danger"
      />
    </>
  );
});
