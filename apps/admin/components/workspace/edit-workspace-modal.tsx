import { Fragment, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Dialog, Transition } from "@headlessui/react";
import { useTranslation } from "@operis/i18n";
import { WEB_BASE_URL, ORGANIZATION_SIZE, RESTRICTED_URLS } from "@operis/constants";
import { Button } from "@operis/propel/button";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import type { IWorkspace } from "@operis/types";
import { CustomSelect, Input } from "@operis/ui";
import { validateSlug, validateWorkspaceName } from "@operis/utils";
import { AdminFieldLabel } from "@/components/settings/admin-settings-panel";
import { InstanceWorkspaceService } from "@operis/services";
import { useWorkspace } from "@/hooks/store";

const instanceWorkspaceService = new InstanceWorkspaceService();

type Props = {
  workspace: IWorkspace | null;
  isOpen: boolean;
  onClose: () => void;
};

type EditFormValues = Pick<IWorkspace, "name" | "slug" | "organization_size">;

export const EditWorkspaceModal = observer(function EditWorkspaceModal(props: Props) {
  const { workspace, isOpen, onClose } = props;
  const { t } = useTranslation();
  const { updateWorkspace } = useWorkspace();
  const [slugError, setSlugError] = useState(false);
  const [invalidSlug, setInvalidSlug] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<EditFormValues>({
    mode: "onChange",
    defaultValues: {
      name: "",
      slug: "",
      organization_size: "",
    },
  });

  useEffect(() => {
    if (workspace && isOpen) {
      reset({
        name: workspace.name,
        slug: workspace.slug,
        organization_size: workspace.organization_size ?? "",
      });
      setSlugError(false);
      setInvalidSlug(false);
    }
  }, [workspace, isOpen, reset]);

  const workspaceBaseURL = encodeURI(
    WEB_BASE_URL || (typeof window !== "undefined" ? window.location.origin : "") + "/"
  );

  const onSubmit = async (values: EditFormValues) => {
    if (!workspace) return;

    const slugChanged = values.slug !== workspace.slug;
    if (slugChanged) {
      const check = await instanceWorkspaceService.slugCheck(values.slug);
      if (!check?.status || RESTRICTED_URLS.includes(values.slug)) {
        setSlugError(true);
        return;
      }
    }

    try {
      await updateWorkspace(workspace.id, values);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("god_mode.common.success"),
        message: t("god_mode.pages.workspace.updated_message"),
      });
      onClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("god_mode.common.error"),
        message: t("god_mode.pages.workspace.update_error"),
      });
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="relative w-full max-w-lg transform overflow-hidden rounded-xl border border-subtle bg-surface-1 shadow-raised-200 transition-all">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="border-b border-subtle px-5 py-4">
                    <Dialog.Title className="text-16 font-semibold text-primary">
                      {t("god_mode.pages.workspace.edit_title")}
                    </Dialog.Title>
                    <p className="mt-1 text-13 text-secondary">{t("god_mode.pages.workspace.edit_description")}</p>
                  </div>

                  <div className="space-y-4 px-5 py-4">
                    <div className="space-y-2">
                      <AdminFieldLabel>{t("god_mode.pages.workspace.create_name_label")}</AdminFieldLabel>
                      <Controller
                        control={control}
                        name="name"
                        rules={{ validate: (value) => validateWorkspaceName(value, true) }}
                        render={({ field }) => (
                          <Input {...field} className="w-full rounded-xl" hasError={Boolean(errors.name)} />
                        )}
                      />
                      {errors.name?.message ? (
                        <span className="text-11 text-danger-primary">{String(errors.name.message)}</span>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <AdminFieldLabel>{t("god_mode.pages.workspace.create_url_label")}</AdminFieldLabel>
                      <div className="flex w-full items-center gap-0.5 rounded-xl border border-subtle bg-layer-2/40 px-3">
                        <span className="text-13 whitespace-nowrap text-secondary">{workspaceBaseURL}</span>
                        <Controller
                          control={control}
                          name="slug"
                          rules={{ validate: (value) => validateSlug(value) }}
                          render={({ field: { onChange, value, ref } }) => (
                            <Input
                              ref={ref}
                              value={value}
                              onChange={(e) => {
                                if (/^[a-zA-Z0-9_-]+$/.test(e.target.value)) setInvalidSlug(false);
                                else setInvalidSlug(true);
                                onChange(e.target.value.toLowerCase());
                              }}
                              className="block w-full rounded-xl border-none bg-transparent !px-0 py-2 text-13"
                              hasError={Boolean(errors.slug) || slugError || invalidSlug}
                            />
                          )}
                        />
                      </div>
                      {slugError ? (
                        <p className="text-11 text-danger-primary">{t("god_mode.pages.workspace.create_url_taken")}</p>
                      ) : null}
                      {invalidSlug ? (
                        <p className="text-11 text-danger-primary">
                          {t("god_mode.pages.workspace.create_url_invalid")}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <AdminFieldLabel>{t("god_mode.pages.workspace.create_size_label")}</AdminFieldLabel>
                      <Controller
                        control={control}
                        name="organization_size"
                        rules={{ required: t("god_mode.pages.workspace.create_required") }}
                        render={({ field: { value, onChange } }) => (
                          <CustomSelect
                            value={value}
                            onChange={onChange}
                            label={
                              ORGANIZATION_SIZE.find((item) => item === value) ?? (
                                <span className="text-placeholder">
                                  {t("god_mode.pages.workspace.create_size_placeholder")}
                                </span>
                              )
                            }
                            buttonClassName="!w-full !rounded-xl !border !border-subtle !bg-layer-2/50 !px-3 !py-2.5"
                            className="w-full"
                            input
                          >
                            {ORGANIZATION_SIZE.map((item) => (
                              <CustomSelect.Option key={item} value={item}>
                                {item}
                              </CustomSelect.Option>
                            ))}
                          </CustomSelect>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-subtle px-5 py-4">
                    <Button type="button" variant="secondary" size="lg" onClick={onClose}>
                      {t("cancel")}
                    </Button>
                    <Button type="submit" variant="primary" size="lg" loading={isSubmitting} disabled={!isValid}>
                      {isSubmitting ? t("god_mode.common.saving") : t("god_mode.common.save")}
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
