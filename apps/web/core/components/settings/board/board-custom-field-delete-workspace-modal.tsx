/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IBoardCustomField } from "@plane/types";
import { AlertModalCore } from "@plane/ui";
import { useBoardCustomField } from "@/hooks/store/use-board-custom-field";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  boardField: IBoardCustomField;
  isOpen: boolean;
  onClose: () => void;
};

export function BoardCustomFieldDeleteWorkspaceModal(props: Props) {
  const { workspaceSlug, boardSlug, boardField, isOpen, onClose } = props;
  const { t } = useTranslation();
  const { deleteWorkspaceCustomField } = useBoardCustomField();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteWorkspaceCustomField(workspaceSlug, boardSlug, boardField.custom_field_id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.settings.fields.delete_workspace_success_title"),
        message: t("boards.settings.fields.delete_workspace_success_message", { name: boardField.name }),
      });
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertModalCore
      isOpen={isOpen}
      handleClose={onClose}
      handleSubmit={handleDelete}
      isSubmitting={isSubmitting}
      variant="danger"
      title={t("boards.settings.fields.delete_workspace_title")}
      content={
        <p className="text-13 text-secondary">
          {t("boards.settings.fields.delete_workspace_content", { name: boardField.name })}
        </p>
      }
      primaryButtonText={{
        default: t("boards.settings.fields.delete_workspace_confirm"),
        loading: t("deleting"),
      }}
      secondaryButtonText={t("cancel")}
    />
  );
}
