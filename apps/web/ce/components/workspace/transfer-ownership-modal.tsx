import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IWorkspace } from "@operoz/types";
import { EModalPosition, EModalWidth, ModalCore } from "@operoz/ui";
import { WorkspaceMemberSelect } from "@/components/workspace/workspace-member-select";
import { useWorkspace } from "@/hooks/store/use-workspace";

type Props = {
  workspace: IWorkspace;
  isOpen: boolean;
  onClose: () => void;
};

export const TransferOwnershipModal = observer(function TransferOwnershipModal(props: Props) {
  const { workspace, isOpen, onClose } = props;
  const { t } = useTranslation();
  const { transferWorkspaceOwnership } = useWorkspace();
  const [newOwnerId, setNewOwnerId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTransfer = async () => {
    if (!newOwnerId || newOwnerId === "none") {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("workspace_settings.settings.general.transfer_ownership.errors.required"),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await transferWorkspaceOwnership(workspace.slug, newOwnerId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: t("workspace_settings.settings.general.transfer_ownership.success"),
      });
      setNewOwnerId("");
      onClose();
    } catch (err: unknown) {
      const error = err as { error?: string };
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: error?.error ?? t("something_went_wrong"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <div className="flex flex-col gap-5 p-6">
        <div>
          <h3 className="text-16 font-semibold text-primary">
            {t("workspace_settings.settings.general.transfer_ownership.title")}
          </h3>
          <p className="mt-1 text-13 text-tertiary">
            {t("workspace_settings.settings.general.transfer_ownership.description")}
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-11 font-medium text-secondary">
            {t("workspace_settings.settings.general.transfer_ownership.member_label")}
          </p>
          <WorkspaceMemberSelect
            workspaceSlug={workspace.slug}
            value={newOwnerId || null}
            onChange={(val) => setNewOwnerId(val === "none" ? "" : val)}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" loading={isSubmitting} onClick={handleTransfer}>
            {t("workspace_settings.settings.general.transfer_ownership.confirm")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
