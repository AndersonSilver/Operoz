import React, { Fragment, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { Dialog, Transition } from "@headlessui/react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { Button } from "@operoz/propel/button";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IIssueTransition, TTransitionExecutePayload } from "@operoz/types";
import { Input, TextArea } from "@operoz/ui";
import { getLocalizedStateName, getLocalizedTransitionName } from "@/components/project-states/state-display.utils";

type Props = {
  isOpen: boolean;
  transition: IIssueTransition | null;
  onClose: () => void;
  onSubmit: (payload: TTransitionExecutePayload) => Promise<void>;
};

export const IssueTransitionScreenModal = observer(function IssueTransitionScreenModal(props: Props) {
  const { isOpen, transition, onClose, onSubmit } = props;
  const { t } = useTranslation();
  const [comment, setComment] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const screenFields = useMemo(() => transition?.screen?.fields ?? [], [transition]);
  const localizedTransitionName = transition
    ? getLocalizedTransitionName(transition.name, transition.to_state_name, transition.to_state_group, t)
    : "";
  const localizedTargetStateName = transition
    ? getLocalizedStateName({ name: transition.to_state_name, group: transition.to_state_group }, t)
    : "";

  const handleClose = () => {
    if (isSubmitting) return;
    setComment("");
    setFields({});
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!transition) return;

    for (const field of screenFields) {
      if (field.required && !fields[field.field_id]?.trim()) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("workflow.execute.error.validation"),
          message: t("workflow.transition.validator.required", { field: field.field_id }),
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        comment: comment.trim() || undefined,
        fields: Object.keys(fields).length > 0 ? fields : undefined,
      });
      setComment("");
      setFields({});
      onClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workflow.execute.error.validation"),
        message: t("workflow.execute.error.generic"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!transition) return null;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-30" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-backdrop" />
        </Transition.Child>

        <div className="fixed inset-0 z-30 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-2 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-2 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-md rounded-md border border-subtle bg-surface-1 p-4 shadow-raised-200">
                <Dialog.Title className="text-16 font-medium text-primary">{localizedTransitionName}</Dialog.Title>
                <p className="mt-1 text-13 text-secondary">
                  {t("workflow.execute.screen_hint", { state: localizedTargetStateName })}
                </p>

                <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
                  {screenFields.map((field) => (
                    <div key={field.field_id} className="space-y-1">
                      <label className="text-12 font-medium text-secondary" htmlFor={`wf-field-${field.field_id}`}>
                        {field.field_id}
                        {field.required ? " *" : ""}
                      </label>
                      <Input
                        id={`wf-field-${field.field_id}`}
                        value={fields[field.field_id] ?? ""}
                        onChange={(event) =>
                          setFields((current) => ({ ...current, [field.field_id]: event.target.value }))
                        }
                        className="w-full"
                        disabled={isSubmitting}
                      />
                    </div>
                  ))}

                  <div className="space-y-1">
                    <label className="text-12 font-medium text-secondary" htmlFor="wf-transition-comment">
                      {t("workflow.execute.comment_label")}
                    </label>
                    <TextArea
                      id="wf-transition-comment"
                      value={comment}
                      onChange={(event) => setComment(event.target.value)}
                      textAreaSize="sm"
                      className="w-full"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
                      {t("common.cancel")}
                    </Button>
                    <Button type="submit" variant="primary" disabled={isSubmitting}>
                      {isSubmitting ? t("workflow.execute.submitting") : t("workflow.execute.confirm")}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
