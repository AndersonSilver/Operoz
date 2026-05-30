/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IBoard } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
import { useBoard } from "@/hooks/store/use-board";

type Props = {
  workspaceSlug: string;
  board: IBoard;
  isOpen: boolean;
  onClose: () => void;
};

export function UnarchiveBoardModal(props: Props) {
  const { workspaceSlug, board, isOpen, onClose } = props;
  const { t } = useTranslation();
  const { unarchiveBoard } = useBoard();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUnarchive = async () => {
    setIsSubmitting(true);
    try {
      await unarchiveBoard(workspaceSlug, board.slug);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.unarchive_success_title"),
        message: t("boards.unarchive_success_message", { name: board.name }),
      });
      onClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("something_went_wrong"),
      });
    }
    setIsSubmitting(false);
  };

  return (
    <AlertModalCore
      isOpen={isOpen}
      handleClose={onClose}
      handleSubmit={handleUnarchive}
      isSubmitting={isSubmitting}
      title={t("boards.unarchive_modal_title")}
      content={<>{t("boards.unarchive_modal_content", { name: board.name })}</>}
      primaryButtonText={{ default: t("boards.unarchive"), loading: t("boards.unarchive") }}
      variant="primary"
    />
  );
}
