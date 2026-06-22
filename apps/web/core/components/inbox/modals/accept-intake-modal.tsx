import { useState } from "react";
import { useTranslation } from "@operis/i18n";
import type { TIssue } from "@operis/types";
import { AlertModalCore } from "@operis/ui";

type Props = {
  data: Partial<TIssue>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
};

export function AcceptIntakeModal(props: Props) {
  const { data, isOpen, onClose, onSubmit } = props;
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    setIsSubmitting(true);
    await onSubmit().finally(() => {
      setIsSubmitting(false);
      onClose();
    });
  };

  return (
    <AlertModalCore
      handleClose={onClose}
      handleSubmit={handleAccept}
      isSubmitting={isSubmitting}
      isOpen={isOpen}
      title={t("inbox_issue.modals.accept.title")}
      primaryButtonText={{
        loading: t("inbox_issue.modals.accept.loading"),
        default: t("inbox_issue.actions.accept"),
      }}
      content={
        <div className="space-y-2 text-13 text-secondary">
          <p>{t("inbox_issue.modals.accept.intake_description")}</p>
          {data?.name ? <p className="font-medium text-primary">{data.name}</p> : null}
        </div>
      }
    />
  );
}
