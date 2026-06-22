import { Fragment } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Dialog, Transition } from "@headlessui/react";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "@operis/i18n";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IWorkspace } from "@operis/types";
import { Input } from "@operis/ui";
import { AdminFieldLabel } from "@/components/settings/admin-settings-panel";
import { useWorkspace } from "@/hooks/store";

type Props = {
  workspace: IWorkspace | null;
  isOpen: boolean;
  onClose: () => void;
};

type DeleteFormValues = {
  confirmDelete: string;
};

export const DeleteWorkspaceModal = observer(function DeleteWorkspaceModal(props: Props) {
  const { workspace, isOpen, onClose } = props;
  const { t } = useTranslation();
  const { deleteWorkspace } = useWorkspace();

  const confirmPhrase = t("god_mode.pages.workspace.delete_confirm_phrase");

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<DeleteFormValues>({
    defaultValues: { confirmDelete: "" },
  });

  const canDelete = workspace && watch("confirmDelete").trim().toUpperCase() === confirmPhrase.toUpperCase();

  const handleClose = () => {
    reset({ confirmDelete: "" });
    onClose();
  };

  const onSubmit = async () => {
    if (!workspace || !canDelete) return;

    try {
      await deleteWorkspace(workspace.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("god_mode.common.success"),
        message: t("god_mode.pages.workspace.deleted_message"),
      });
      handleClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("god_mode.common.error"),
        message: t("god_mode.pages.workspace.delete_error"),
      });
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-backdrop transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto p-4">
          <div className="flex min-h-full items-center justify-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-3 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-3 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded-xl border border-subtle bg-surface-1 shadow-raised-200 transition-all">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="flex items-start gap-3 border-b border-subtle px-5 py-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-danger-subtle bg-danger-subtle/20 text-danger-primary">
                      <AlertTriangle className="size-5" strokeWidth={1.75} />
                    </span>
                    <div>
                      <Dialog.Title className="text-16 font-semibold text-primary">
                        {t("god_mode.pages.workspace.delete_title")}
                      </Dialog.Title>
                      <p className="mt-1 text-13 leading-relaxed text-secondary">
                        {t("god_mode.pages.workspace.delete_description")}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 py-4">
                    <div className="space-y-2">
                      <AdminFieldLabel>
                        {t("god_mode.pages.workspace.delete_confirm_label", { phrase: confirmPhrase })}
                      </AdminFieldLabel>
                      <Controller
                        control={control}
                        name="confirmDelete"
                        render={({ field }) => (
                          <Input
                            {...field}
                            placeholder={confirmPhrase}
                            className="w-full rounded-xl"
                            autoComplete="off"
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-subtle px-5 py-4">
                    <Button type="button" variant="secondary" size="lg" onClick={handleClose}>
                      {t("cancel")}
                    </Button>
                    <Button type="submit" variant="error-fill" size="lg" loading={isSubmitting} disabled={!canDelete}>
                      {t("god_mode.pages.workspace.delete_button")}
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
