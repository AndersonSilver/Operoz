import { useState } from "react";
import { useTranslation } from "@operis/i18n";
import type { TIssue } from "@operis/types";
import { AlertModalCore, TextArea } from "@operis/ui";
import { useProject } from "@/hooks/store/use-project";

type Props = {
  data: Partial<TIssue>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (resolutionNote: string) => Promise<void>;
};

export function CloseSupportTicketModal(props: Props) {
  const { isOpen, onClose, data, onSubmit } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const { getProjectById } = useProject();
  const { t } = useTranslation();
  const projectDetails = data.project_id ? getProjectById(data?.project_id) : undefined;
  const ticketLabel = `${projectDetails?.identifier}-${data?.sequence_id}`;

  const handleClose = () => {
    setIsSubmitting(false);
    setResolutionNote("");
    onClose();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit(resolutionNote.trim()).finally(() => {
      setIsSubmitting(false);
      handleClose();
    });
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      isOpen={isOpen}
      title={t("inbox_issue.modals.close.title")}
      primaryButtonText={{
        loading: t("inbox_issue.modals.close.loading"),
        default: t("inbox_issue.actions.close"),
      }}
      content={
        <div className="space-y-4">
          <p>{t("inbox_issue.modals.close.content", { value: ticketLabel })}</p>
          <TextArea
            value={resolutionNote}
            onChange={(event) => setResolutionNote(event.target.value)}
            placeholder={t("inbox_issue.modals.close.resolution_placeholder")}
            rows={4}
          />
        </div>
      }
    />
  );
}
