import React from "react";
import { observer } from "mobx-react";
import type { IWorkspace } from "@operoz/types";
// ui
import { EModalPosition, EModalWidth, ModalCore } from "@operoz/ui";
// constants
// hooks

import { DeleteWorkspaceForm } from "@/components/workspace/delete-workspace-form";

type Props = {
  isOpen: boolean;
  data: IWorkspace | null;
  onClose: () => void;
};

export const DeleteWorkspaceModal = observer(function DeleteWorkspaceModal(props: Props) {
  const { isOpen, data, onClose } = props;

  return (
    <ModalCore isOpen={isOpen} handleClose={() => onClose()} position={EModalPosition.CENTER} width={EModalWidth.XL}>
      <DeleteWorkspaceForm data={data} onClose={onClose} />
    </ModalCore>
  );
});
