import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { WORKSPACE_TRACKER_ELEMENTS } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import type { IWorkspace } from "@operoz/types";
// components
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
import { useUser } from "@/hooks/store/user";
// local imports
import { DeleteWorkspaceModal } from "./delete-workspace-modal";

type TDeleteWorkspace = {
  workspace: IWorkspace | null;
  stacked?: boolean;
};

const getWorkspaceOwnerId = (workspace: IWorkspace | null): string | undefined => {
  if (!workspace?.owner) return undefined;
  return typeof workspace.owner === "string" ? workspace.owner : workspace.owner.id;
};

export const DeleteWorkspaceSection = observer(function DeleteWorkspaceSection(props: TDeleteWorkspace) {
  const { workspace, stacked } = props;
  // states
  const [deleteWorkspaceModal, setDeleteWorkspaceModal] = useState(false);
  // translation
  const { t } = useTranslation();
  const { data: currentUser } = useUser();

  const ownerId = getWorkspaceOwnerId(workspace);
  const isOwner = !!currentUser?.id && ownerId === currentUser.id;

  if (!workspace || !isOwner) return null;

  return (
    <>
      <DeleteWorkspaceModal
        data={workspace}
        isOpen={deleteWorkspaceModal}
        onClose={() => setDeleteWorkspaceModal(false)}
      />
      <SettingsBoxedControlItem
        stacked={stacked}
        className="border-danger-subtle/25 bg-danger-subtle/5"
        title={t("workspace_settings.settings.general.delete_workspace")}
        description={t("workspace_settings.settings.general.delete_workspace_description")}
        control={
          <Button
            variant="error-outline"
            onClick={() => setDeleteWorkspaceModal(true)}
            data-ph-element={WORKSPACE_TRACKER_ELEMENTS.DELETE_WORKSPACE_BUTTON}
          >
            {t("delete")}
          </Button>
        }
      />
    </>
  );
});
