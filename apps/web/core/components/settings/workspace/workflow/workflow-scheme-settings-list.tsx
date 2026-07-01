import { Layers, Trash2 } from "lucide-react";
import { observer } from "mobx-react";
import { useState } from "react";
import { useTranslation } from "@operoz/i18n";
import { EmptyStateCompact } from "@operoz/propel/empty-state";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import { AlertModalCore } from "@operoz/ui";
import type { IWorkflowScheme } from "@operoz/types";
import { useAppRouter } from "@/hooks/use-app-router";

type Props = {
  workspaceSlug: string;
  schemes: IWorkflowScheme[];
  onDelete?: (schemeId: string) => Promise<void>;
};

export const WorkflowSchemeSettingsList = observer(function WorkflowSchemeSettingsList(props: Props) {
  const { workspaceSlug, schemes, onDelete } = props;
  const { t } = useTranslation();
  const router = useAppRouter();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const pendingScheme = schemes.find((scheme) => scheme.id === pendingDeleteId);

  const handleDelete = async () => {
    if (!pendingDeleteId || !onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(pendingDeleteId);
      setPendingDeleteId(null);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.workflow.schemes.saved"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.workflow.schemes.delete_failed"),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (schemes.length === 0) {
    return (
      <EmptyStateCompact
        title={t("workspace_settings.settings.workflow.schemes.empty_title")}
        description={t("workspace_settings.settings.workflow.schemes.empty_description")}
      />
    );
  }

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        {schemes.map((scheme) => (
          <div
            key={scheme.id}
            className="group/card flex flex-col gap-2 rounded-md border border-subtle bg-layer-1 p-4 transition-colors hover:bg-layer-1-hover"
          >
            <div className="flex items-start justify-between gap-2">
              <button
                type="button"
                onClick={() => router.push(`/${workspaceSlug}/settings/workflow/schemes/${scheme.id}`)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <Layers className="size-4 shrink-0 text-tertiary" strokeWidth={1.75} />
                <span className="truncate text-13 font-medium text-primary">{scheme.name}</span>
              </button>
              <div className="flex shrink-0 items-center gap-1">
                {scheme.is_default ? (
                  <span className="rounded-sm bg-accent-primary/10 px-1.5 py-0.5 text-11 text-accent-primary">
                    {t("workspace_settings.settings.workflow.schemes.default_badge")}
                  </span>
                ) : null}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => setPendingDeleteId(scheme.id)}
                    className="rounded-sm p-1 text-tertiary opacity-0 transition-opacity group-hover/card:opacity-100 hover:bg-layer-transparent-hover hover:text-danger-primary"
                    aria-label={t("workspace_settings.settings.workflow.schemes.delete_scheme")}
                  >
                    <Trash2 className="size-3.5" strokeWidth={1.75} />
                  </button>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/${workspaceSlug}/settings/workflow/schemes/${scheme.id}`)}
              className="text-left text-12 text-secondary"
            >
              {t("workspace_settings.settings.workflow.schemes.entries_count", {
                count: scheme.entries?.length ?? 0,
              })}
            </button>
          </div>
        ))}
      </div>

      <AlertModalCore
        isOpen={pendingDeleteId !== null}
        handleClose={() => setPendingDeleteId(null)}
        handleSubmit={handleDelete}
        title={t("workspace_settings.settings.workflow.schemes.delete_confirm_title")}
        content={t("workspace_settings.settings.workflow.schemes.delete_confirm_message", {
          name: pendingScheme?.name ?? "",
        })}
        primaryButtonText={{
          default: t("workspace_settings.settings.workflow.schemes.delete_confirm_action"),
          loading: t("workspace_settings.settings.workflow.schemes.deleting"),
        }}
        secondaryButtonText={t("common.cancel")}
        isSubmitting={isDeleting}
        variant="danger"
      />
    </>
  );
});

export const WorkflowSchemesHero = observer(function WorkflowSchemesHero(props: {
  schemeCount: number;
  onCreate: () => void;
  isCreating?: boolean;
}) {
  const { schemeCount, onCreate, isCreating = false } = props;
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 rounded-md border border-subtle bg-layer-1 p-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-accent-primary" strokeWidth={1.75} />
          <h2 className="text-16 font-medium text-primary">
            {t("workspace_settings.settings.workflow.schemes.title")}
          </h2>
        </div>
        <p className="text-13 text-secondary">{t("workspace_settings.settings.workflow.schemes.description")}</p>
        <p className="text-11 text-tertiary">
          {t("workspace_settings.settings.workflow.schemes.count", { count: schemeCount })}
        </p>
      </div>
      <button
        type="button"
        onClick={onCreate}
        disabled={isCreating}
        className="text-on-color-primary rounded-sm bg-accent-primary px-3 py-2 text-13 font-medium hover:opacity-90 disabled:opacity-60"
      >
        {isCreating
          ? t("workspace_settings.settings.workflow.schemes.creating")
          : t("workspace_settings.settings.workflow.schemes.add_scheme")}
      </button>
    </div>
  );
});
