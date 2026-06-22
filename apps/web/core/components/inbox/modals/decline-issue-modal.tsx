import React, { useState } from "react";
import { useTranslation } from "@operis/i18n";
import type { TInboxIssueDeclineCategory, TIssue } from "@operis/types";
import { AlertModalCore } from "@operis/ui";
import { useProject } from "@/hooks/store/use-project";

const DECLINE_CATEGORIES: TInboxIssueDeclineCategory[] = [
  "out_of_scope",
  "duplicate",
  "insufficient_info",
  "spam",
  "other",
];

type Props = {
  data: Partial<TIssue>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { decline_category: TInboxIssueDeclineCategory; decline_reason: string }) => Promise<void>;
};

export function DeclineIssueModal(props: Props) {
  const { isOpen, onClose, data, onSubmit } = props;
  const [isDeclining, setIsDeclining] = useState(false);
  const [category, setCategory] = useState<TInboxIssueDeclineCategory>("other");
  const [reason, setReason] = useState("");
  const { getProjectById } = useProject();
  const { t } = useTranslation();
  const projectDetails = data.project_id ? getProjectById(data?.project_id) : undefined;
  const ticketLabel = `${projectDetails?.identifier}-${data?.sequence_id}`;

  const handleClose = () => {
    setIsDeclining(false);
    setReason("");
    onClose();
  };

  const handleDecline = async () => {
    if (reason.trim().length < 3) {
      return;
    }
    setIsDeclining(true);
    await onSubmit({ decline_category: category, decline_reason: reason.trim() }).finally(() => {
      setIsDeclining(false);
      handleClose();
    });
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleDecline}
      isSubmitting={isDeclining}
      isOpen={isOpen}
      title={t("inbox_issue.modals.decline.title")}
      primaryButtonText={{
        loading: t("declining"),
        default: t("inbox_issue.actions.decline"),
      }}
      content={
        <div className="space-y-4">
          <p>{t("inbox_issue.modals.decline.content", { value: ticketLabel })}</p>
          <div className="space-y-1">
            <label className="text-12 font-medium text-secondary" htmlFor="decline-category">
              {t("inbox_issue.modals.decline.category_label")}
            </label>
            <select
              id="decline-category"
              className="w-full rounded-md border border-subtle bg-layer-1 px-3 py-2 text-13"
              value={category}
              onChange={(event) => setCategory(event.target.value as TInboxIssueDeclineCategory)}
            >
              {DECLINE_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {t(`inbox_issue.decline_categories.${item}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-12 font-medium text-secondary" htmlFor="decline-reason">
              {t("inbox_issue.modals.decline.reason_label")}
            </label>
            <textarea
              id="decline-reason"
              className="min-h-24 w-full rounded-md border border-subtle bg-layer-1 px-3 py-2 text-13"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t("inbox_issue.modals.decline.reason_placeholder")}
            />
          </div>
        </div>
      }
    />
  );
}
