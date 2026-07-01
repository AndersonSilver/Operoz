import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import type { IWorkspace } from "@operoz/types";
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
import { useUser } from "@/hooks/store/user";
import { TransferOwnershipModal } from "./transfer-ownership-modal";

type Props = {
  workspace: IWorkspace | null;
  stacked?: boolean;
};

const getWorkspaceOwnerId = (workspace: IWorkspace | null): string | undefined => {
  if (!workspace?.owner) return undefined;
  return typeof workspace.owner === "string" ? workspace.owner : workspace.owner.id;
};

export const TransferOwnershipSection = observer(function TransferOwnershipSection(props: Props) {
  const { workspace, stacked } = props;
  const { t } = useTranslation();
  const { data: currentUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  const ownerId = getWorkspaceOwnerId(workspace);
  const isOwner = !!currentUser?.id && ownerId === currentUser.id;

  if (!workspace || !isOwner) return null;

  return (
    <>
      <TransferOwnershipModal workspace={workspace} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <SettingsBoxedControlItem
        stacked={stacked}
        title={t("workspace_settings.settings.general.transfer_ownership.section_title")}
        description={t("workspace_settings.settings.general.transfer_ownership.section_description")}
        control={
          <Button variant="secondary" onClick={() => setIsOpen(true)}>
            {t("workspace_settings.settings.general.transfer_ownership.button")}
          </Button>
        }
      />
    </>
  );
});
