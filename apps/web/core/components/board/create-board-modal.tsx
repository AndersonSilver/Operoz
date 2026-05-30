/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TBoardFormData } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
import useKeypress from "@/hooks/use-keypress";
import { CreateBoardForm } from "./create-board-form";

type Props = {
  workspaceSlug: string;
  isOpen: boolean;
  onClose: () => void;
};

export function CreateBoardModal(props: Props) {
  const { workspaceSlug, isOpen, onClose } = props;
  const { t } = useTranslation();

  useKeypress("Escape", () => {
    if (isOpen) onClose();
  });

  const handleCreated = (data: TBoardFormData & { slug: string }) => {
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: t("boards.create_success_title"),
      message: t("boards.create_success_message", { name: data.name }),
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
      <CreateBoardForm
        workspaceSlug={workspaceSlug}
        onClose={onClose}
        onCreated={handleCreated}
      />
    </ModalCore>
  );
}
