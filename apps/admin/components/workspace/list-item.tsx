import { useState } from "react";
import { observer } from "mobx-react";
import { ExternalLink, Mail, Pencil, Plug, Trash2 } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { WEB_BASE_URL } from "@operoz/constants";
import { Button } from "@operoz/propel/button";
import { Tooltip } from "@operoz/propel/tooltip";
import { getFileURL, cn } from "@operoz/utils";
import { useWorkspace } from "@/hooks/store";
import { DeleteWorkspaceModal } from "./delete-workspace-modal";
import { EditWorkspaceModal } from "./edit-workspace-modal";
import { WorkspaceEmailConfigModal } from "./workspace-email-config-modal";
import { WorkspaceIntegrationConfigModal } from "./workspace-integration-config-modal";
import { WORKSPACE_NOTIFICATION_FLAGS } from "./workspace-notification-flags";
import { WORKSPACE_INTEGRATION_FLAGS } from "./workspace-integration-flags";

type TWorkspaceListItemProps = {
  workspaceId: string;
};

export const WorkspaceListItem = observer(function WorkspaceListItem({ workspaceId }: TWorkspaceListItemProps) {
  const { t } = useTranslation();
  const { getWorkspaceById } = useWorkspace();
  const workspace = getWorkspaceById(workspaceId);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isIntegrationOpen, setIsIntegrationOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (!workspace) return null;

  const workspaceUrl = `${WEB_BASE_URL}/${encodeURIComponent(workspace.slug)}`;
  const activeFlags = WORKSPACE_NOTIFICATION_FLAGS.filter((flag) => Boolean(workspace[flag.key])).length;
  const totalFlags = WORKSPACE_NOTIFICATION_FLAGS.length;
  const activeIntegrations = WORKSPACE_INTEGRATION_FLAGS.filter((flag) => Boolean(workspace[flag.key])).length;

  const openWorkspace = () => {
    window.open(workspaceUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <article className="shadow-xs relative flex h-full flex-col overflow-hidden rounded-xl border border-subtle bg-layer-1 transition-all duration-150 hover:border-strong hover:shadow-raised-100">
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent"
          aria-hidden
        />
        <div className="flex items-start justify-between gap-3 border-b border-subtle px-4 py-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                "relative mt-0.5 flex size-9 shrink-0 items-center justify-center text-11 uppercase",
                !workspace.logo_url && "rounded-xl bg-accent-primary text-on-color"
              )}
            >
              {workspace.logo_url ? (
                <img
                  src={getFileURL(workspace.logo_url)}
                  className="absolute inset-0 size-full rounded-xl object-cover"
                  alt=""
                />
              ) : (
                (workspace.name?.[0] ?? "…")
              )}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-14 font-semibold text-primary capitalize">{workspace.name}</h3>
                <Tooltip tooltipContent={workspace.slug}>
                  <span className="font-mono rounded-full bg-layer-2 px-2 py-0.5 text-10 text-tertiary">
                    {workspace.slug}
                  </span>
                </Tooltip>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-11 text-tertiary">
                {workspace.owner.email ? <span>{workspace.owner.email}</span> : null}
                {workspace.total_projects !== null ? (
                  <span>{t("god_mode.pages.workspace.meta_projects", { count: workspace.total_projects })}</span>
                ) : null}
                {workspace.total_members !== null ? (
                  <span>{t("god_mode.pages.workspace.meta_members", { count: workspace.total_members })}</span>
                ) : null}
              </div>
            </div>
          </div>
          <Tooltip tooltipContent={t("god_mode.pages.workspace.open_workspace_tooltip")}>
            <button
              type="button"
              onClick={openWorkspace}
              className="flex shrink-0 items-center justify-center rounded-lg border border-subtle bg-layer-2/60 p-2 text-tertiary transition-colors hover:border-strong hover:bg-layer-1-hover hover:text-accent-primary"
              aria-label={t("god_mode.pages.workspace.open_button")}
            >
              <ExternalLink className="size-3.5" strokeWidth={1.75} />
            </button>
          </Tooltip>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-2 p-4">
          <button
            type="button"
            onClick={() => setIsConfigOpen(true)}
            className="group flex w-full flex-col gap-2 rounded-xl border border-subtle bg-layer-2/30 px-3 py-3 text-left transition-colors hover:border-strong hover:bg-layer-1-hover"
          >
            <span className="flex items-center gap-2 text-12 font-medium text-primary">
              <Mail className="size-3.5 text-accent-primary" strokeWidth={1.75} />
              {t("god_mode.pages.workspace.config_title")}
            </span>
            <span
              className={cn(
                "inline-flex w-fit rounded-full px-2 py-0.5 text-10 font-semibold tracking-wide uppercase",
                activeFlags > 0 ? "bg-success-subtle text-success-primary" : "bg-layer-2 text-tertiary"
              )}
            >
              {activeFlags > 0
                ? t("god_mode.pages.workspace.email_flags_summary", { active: activeFlags, total: totalFlags })
                : t("god_mode.pages.workspace.email_flags_none")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setIsIntegrationOpen(true)}
            className="group flex w-full flex-col gap-2 rounded-xl border border-subtle bg-layer-2/30 px-3 py-3 text-left transition-colors hover:border-strong hover:bg-layer-1-hover"
          >
            <span className="flex items-center gap-2 text-12 font-medium text-primary">
              <Plug className="size-3.5 text-accent-primary" strokeWidth={1.75} />
              {t("god_mode.pages.workspace.integrations.card_title")}
            </span>
            <span
              className={cn(
                "inline-flex w-fit rounded-full px-2 py-0.5 text-10 font-semibold tracking-wide uppercase",
                activeIntegrations > 0 ? "bg-success-subtle text-success-primary" : "bg-layer-2 text-tertiary"
              )}
            >
              {activeIntegrations > 0
                ? t("god_mode.pages.workspace.integrations.flags_summary", { count: activeIntegrations })
                : t("god_mode.pages.workspace.integrations.flags_none")}
            </span>
          </button>
        </div>

        <div
          className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-subtle bg-surface-1/70 px-3 py-2"
          onClick={(event) => event.stopPropagation()}
        >
          <Button variant="secondary" size="sm" className="h-8" onClick={() => setIsConfigOpen(true)}>
            <Mail className="size-3.5" strokeWidth={1.75} />
            {t("god_mode.pages.workspace.config_button")}
          </Button>
          <Button variant="secondary" size="sm" className="h-8" onClick={() => setIsIntegrationOpen(true)}>
            <Plug className="size-3.5" strokeWidth={1.75} />
            {t("god_mode.pages.workspace.integrations.button")}
          </Button>
          <Button variant="secondary" size="sm" className="h-8" onClick={() => setIsEditOpen(true)}>
            <Pencil className="size-3.5" strokeWidth={1.75} />
            {t("god_mode.pages.workspace.edit_button")}
          </Button>
          <Button variant="error-outline" size="sm" className="h-8" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 className="size-3.5" strokeWidth={1.75} />
            {t("god_mode.pages.workspace.delete_button")}
          </Button>
          <Button variant="secondary" size="sm" className="ml-auto h-8" onClick={openWorkspace}>
            <ExternalLink className="size-3.5" strokeWidth={1.75} />
            {t("god_mode.pages.workspace.open_button")}
          </Button>
        </div>
      </article>

      <WorkspaceEmailConfigModal workspace={workspace} isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
      <WorkspaceIntegrationConfigModal
        workspace={workspace}
        isOpen={isIntegrationOpen}
        onClose={() => setIsIntegrationOpen(false)}
      />
      <EditWorkspaceModal workspace={workspace} isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
      <DeleteWorkspaceModal workspace={workspace} isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} />
    </>
  );
});
