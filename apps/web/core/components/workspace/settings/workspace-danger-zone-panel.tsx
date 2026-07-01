import { observer } from "mobx-react";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import type { IWorkspace } from "@operoz/types";
import { useUser } from "@/hooks/store/user";
import { DeleteWorkspaceSection } from "@/plane-web/components/workspace/delete-workspace-section";
import { TransferOwnershipSection } from "@/plane-web/components/workspace/transfer-ownership-section";
import "./workspace-general-settings.css";

type Props = {
  workspace: IWorkspace;
};

const getWorkspaceOwnerId = (workspace: IWorkspace): string | undefined => {
  if (!workspace.owner) return undefined;
  return typeof workspace.owner === "string" ? workspace.owner : workspace.owner.id;
};

export const WorkspaceDangerZonePanel = observer(function WorkspaceDangerZonePanel(props: Props) {
  const { workspace } = props;
  const { t } = useTranslation();
  const { data: currentUser } = useUser();

  const ownerId = getWorkspaceOwnerId(workspace);
  const isOwner = !!currentUser?.id && ownerId === currentUser.id;

  if (!isOwner) return null;

  return (
    <aside className="workspace-general-danger-panel flex h-full flex-col overflow-hidden rounded-xl border border-danger-subtle/30 bg-layer-1">
      <div className="workspace-general-danger-header border-b border-danger-subtle/20 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-danger-subtle/40 bg-danger-subtle/30 text-danger-primary">
            <AlertTriangle className="size-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h2 className="text-14 font-semibold text-primary">
              {t("workspace_settings.settings.general.danger_zone.title")}
            </h2>
            <p className="mt-1 text-12 leading-relaxed text-tertiary">
              {t("workspace_settings.settings.general.danger_zone.description")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 lg:p-5">
        <TransferOwnershipSection workspace={workspace} />
        <DeleteWorkspaceSection workspace={workspace} />
      </div>
    </aside>
  );
});
