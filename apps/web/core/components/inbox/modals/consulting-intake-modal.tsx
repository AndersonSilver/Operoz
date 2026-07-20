import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import type { TIssue } from "@operoz/types";
import { AlertModalCore } from "@operoz/ui";

type Props = {
  data: Partial<TIssue>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (note: string) => Promise<void>;
};

export function ConsultingIntakeModal(props: Props) {
  const { isOpen, onClose, data, onSubmit } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [note, setNote] = useState("");
  const { t } = useTranslation();

  const handleClose = () => {
    setNote("");
    onClose();
  };

  const handleSubmit = async () => {
    if (note.trim().length < 3) return;
    setIsSubmitting(true);
    await onSubmit(note.trim()).finally(() => {
      setIsSubmitting(false);
      handleClose();
    });
  };

  const remaining = note.trim().length;

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleSubmit}
      isSubmitting={isSubmitting || note.trim().length < 3}
      isOpen={isOpen}
      variant="primary"
      customIcon={<MessageSquare className="size-5" />}
      title={t("inbox_issue.modals.consulting.title")}
      secondaryButtonText={t("common.cancel")}
      primaryButtonText={{
        loading: t("inbox_issue.modals.consulting.loading"),
        default: t("inbox_issue.actions.consulting"),
      }}
      content={
        <div className="space-y-4">
          <p className="text-secondary">{t("inbox_issue.modals.consulting.description")}</p>
          {data?.name ? (
            <div className="rounded-md border border-subtle bg-layer-2 px-3 py-2">
              <p className="text-13 font-medium text-primary">{data.name}</p>
            </div>
          ) : null}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-12 font-medium text-secondary" htmlFor="consulting-note">
                {t("inbox_issue.modals.consulting.note_label")}
                <span className="ml-1 text-danger-primary">*</span>
              </label>
              {remaining > 0 && <span className="text-11 text-tertiary">{remaining} caracteres</span>}
            </div>
            <textarea
              id="consulting-note"
              autoFocus
              className="focus:border-accent-primary focus:ring-accent-primary/30 min-h-28 w-full resize-none rounded-md border border-subtle bg-layer-1 px-3 py-2.5 text-13 transition-colors outline-none placeholder:text-tertiary focus:ring-1"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("inbox_issue.modals.consulting.note_placeholder")}
            />
          </div>
        </div>
      }
    />
  );
}
