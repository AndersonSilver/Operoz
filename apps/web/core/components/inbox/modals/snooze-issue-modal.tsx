import { useState } from "react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { Calendar } from "@operoz/propel/calendar";
import { EModalPosition, EModalWidth, ModalCore } from "@operoz/ui";

export type InboxIssueSnoozeModalProps = {
  isOpen: boolean;
  value: Date | undefined;
  onConfirm: (value: Date, snoozeReason?: string) => void;
  handleClose: () => void;
};

export function InboxIssueSnoozeModal(props: InboxIssueSnoozeModalProps) {
  const { isOpen, handleClose, value, onConfirm } = props;
  const [date, setDate] = useState(value || new Date());
  const [snoozeReason, setSnoozeReason] = useState("");
  const { t } = useTranslation();

  return (
    <ModalCore
      isOpen={isOpen}
      handleClose={handleClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.SM}
      className="w-auto"
    >
      <div className="flex h-full w-full flex-col gap-y-3 px-5 py-8 sm:p-6">
        <Calendar
          className="rounded-md border border-subtle p-3"
          captionLayout="dropdown"
          selected={date ? new Date(date) : undefined}
          defaultMonth={date ? new Date(date) : undefined}
          onSelect={(nextDate: Date | undefined) => {
            if (!nextDate) return;
            setDate(nextDate);
          }}
          mode="single"
          disabled={[
            {
              before: new Date(),
            },
          ]}
        />
        <div className="space-y-1">
          <label className="text-12 font-medium text-secondary" htmlFor="snooze-reason">
            {t("inbox_issue.modals.snooze.reason_label")}
          </label>
          <textarea
            id="snooze-reason"
            className="min-h-20 w-full rounded-md border border-subtle bg-layer-1 px-3 py-2 text-13"
            value={snoozeReason}
            onChange={(event) => setSnoozeReason(event.target.value)}
            placeholder={t("inbox_issue.modals.snooze.reason_placeholder")}
          />
        </div>
        <Button
          variant="primary"
          onClick={() => {
            handleClose();
            onConfirm(date, snoozeReason.trim() || undefined);
          }}
        >
          {t("inbox_issue.actions.snooze")}
        </Button>
      </div>
    </ModalCore>
  );
}
