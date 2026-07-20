import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import type { TIssue } from "@operoz/types";
import { AlertModalCore } from "@operoz/ui";

type Props = {
  data: Partial<TIssue>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason?: string) => Promise<void>;
};

export function DeferIntakeModal(props: Props) {
  const { isOpen, onClose, data, onSubmit } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const { t } = useTranslation();

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onSubmit(reason.trim() || undefined).finally(() => {
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
      variant="primary"
      customIcon={<CalendarClock className="size-5" />}
      title={t("inbox_issue.modals.defer.title")}
      secondaryButtonText={t("common.cancel")}
      primaryButtonText={{
        loading: t("inbox_issue.modals.defer.loading"),
        default: t("inbox_issue.actions.defer"),
      }}
      content={
        <div className="space-y-4">
          <p className="text-secondary">{t("inbox_issue.modals.defer.description")}</p>
          {data?.name ? (
            <div className="rounded-md border border-subtle bg-layer-2 px-3 py-2">
              <p className="text-13 font-medium text-primary">{data.name}</p>
            </div>
          ) : null}
          <div className="space-y-1.5">
            <label className="text-12 font-medium text-secondary" htmlFor="defer-reason">
              {t("inbox_issue.modals.defer.reason_label")}
            </label>
            <textarea
              id="defer-reason"
              className="focus:border-accent-primary focus:ring-accent-primary/30 min-h-24 w-full resize-none rounded-md border border-subtle bg-layer-1 px-3 py-2.5 text-13 transition-colors outline-none placeholder:text-tertiary focus:ring-1"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("inbox_issue.modals.defer.reason_placeholder")}
            />
          </div>
        </div>
      }
    />
  );
}
