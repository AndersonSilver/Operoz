/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IBoard } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import useKeypress from "@/hooks/use-keypress";
import { EditBoardForm } from "./edit-board-form";

type Props = {
  workspaceSlug: string;
  board: IBoard;
  isOpen: boolean;
  onClose: () => void;
};

export function EditBoardModal(props: Props) {
  const { workspaceSlug, board, isOpen, onClose } = props;
  const { t } = useTranslation();

  useKeypress("Escape", () => {
    if (isOpen) onClose();
  });

  const handleUpdated = (updated: IBoard) => {
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: t("boards.edit_success_title"),
      message: t("boards.edit_success_message", { name: updated.name }),
    });
  };

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={onClose}
      position={EModalPosition.TOP}
      width={EModalWidth.LG}
      className="overflow-hidden rounded-lg"
    >
      <EditBoardForm workspaceSlug={workspaceSlug} board={board} onClose={onClose} onUpdated={handleUpdated} />
    </ModalCore>
  );
}
