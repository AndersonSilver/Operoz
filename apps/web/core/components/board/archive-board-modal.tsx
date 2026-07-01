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
  onArchived?: () => void;
};

export function ArchiveBoardModal(props: Props) {
  const { workspaceSlug, board, isOpen, onClose, onArchived } = props;
  const { t } = useTranslation();
  const { archiveBoard } = useBoard();
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      await archiveBoard(workspaceSlug, board.slug);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.archive_success_title"),
        message: t("boards.archive_success_message", { name: board.name }),
      });
      onArchived?.();
      onClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("something_went_wrong"),
      });
    }
    setIsArchiving(false);
  };

  return (
    <AlertModalCore
      isOpen={isOpen}
      handleClose={onClose}
      handleSubmit={handleArchive}
      isSubmitting={isArchiving}
      title={t("boards.archive_modal_title")}
      content={<>{t("boards.archive_modal_content", { name: board.name })}</>}
      primaryButtonText={t("boards.archive")}
    />
  );
}
