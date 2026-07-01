import React, { useState } from "react";
import { observer } from "mobx-react";
import { PROJECT_ERROR_MESSAGES } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { TIssue } from "@operoz/types";
import { AlertModalCore } from "@operoz/ui";
import { useProject } from "@/hooks/store/use-project";

type Props = {
  data: Partial<TIssue>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (deleteReason: string) => Promise<void>;
};

export const DeleteInboxIssueModal = observer(function DeleteInboxIssueModal({
  isOpen,
  onClose,
  onSubmit,
  data,
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const { getProjectById } = useProject();
  const { t } = useTranslation();
  const projectDetails = data.project_id ? getProjectById(data?.project_id) : undefined;
  const ticketLabel = `${projectDetails?.identifier}-${data?.sequence_id}`;

  const handleClose = () => {
    setIsDeleting(false);
    setDeleteReason("");
    onClose();
  };

  const handleDelete = async () => {
    if (deleteReason.trim().length < 5) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("error"),
        message: t("inbox_issue.modals.delete.reason_required"),
      });
      return;
    }

    setIsDeleting(true);
    await onSubmit(deleteReason.trim())
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: `${t("success")}`,
          message: `${t("inbox_issue.modals.delete.success")}`,
        });
      })
      .catch((errors) => {
        const isPermissionError = errors?.error === "Only board admin can delete the support ticket";
        const currentError = isPermissionError
          ? { i18n_title: "error", i18n_message: "inbox_issue.errors.delete_permission" }
          : PROJECT_ERROR_MESSAGES.issueDeleteError;
        setToast({
          title: t(currentError.i18n_title),
          type: TOAST_TYPE.ERROR,
          message: currentError.i18n_message ? t(currentError.i18n_message) : undefined,
        });
      })
      .finally(() => handleClose());
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDelete}
      isSubmitting={isDeleting}
      isOpen={isOpen}
      title={t("inbox_issue.modals.delete.title")}
      content={
        <div className="space-y-4">
          <p>{t("inbox_issue.modals.delete.content", { value: ticketLabel })}</p>
          <div className="space-y-1">
            <label className="text-12 font-medium text-secondary" htmlFor="delete-reason">
              {t("inbox_issue.modals.delete.reason_label")}
            </label>
            <textarea
              id="delete-reason"
              className="min-h-24 w-full rounded-md border border-subtle bg-layer-1 px-3 py-2 text-13"
              value={deleteReason}
              onChange={(event) => setDeleteReason(event.target.value)}
              placeholder={t("inbox_issue.modals.delete.reason_placeholder")}
            />
          </div>
        </div>
      }
    />
  );
});
