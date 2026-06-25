import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "@operis/i18n";
import { TOAST_TYPE, setToast } from "@operis/propel/toast";
import { Button } from "@operis/propel/button";
import type { IBoardModuleStage, TBoardModuleStageFormData } from "@operis/types";
import { EModalPosition, EModalWidth, Input, InputColorPicker, ModalCore, ToggleSwitch } from "@operis/ui";
import { useBoardModuleStage } from "@/hooks/store/use-board-module-stage";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  stage: IBoardModuleStage;
  isOpen: boolean;
  onClose: () => void;
};

export function BoardModuleStageEditModal(props: Props) {
  const { workspaceSlug, boardSlug, stage, isOpen, onClose } = props;
  const { t } = useTranslation();
  const { updateBoardModuleStage } = useBoardModuleStage();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TBoardModuleStageFormData & { is_active: boolean }>({
    defaultValues: {
      name: stage.name,
      color: stage.color,
      is_default: stage.is_default,
      is_active: stage.is_active,
    },
  });

  useEffect(() => {
    reset({
      name: stage.name,
      color: stage.color,
      is_default: stage.is_default,
      is_active: stage.is_active,
    });
  }, [reset, stage]);

  const onSubmit = async (data: TBoardModuleStageFormData & { is_active: boolean }) => {
    try {
      await updateBoardModuleStage(workspaceSlug, boardSlug, stage.id, data);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.settings.module_stages.edit_success_title"),
        message: t("boards.settings.module_stages.edit_success_message", { name: data.name }),
      });
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
        <div className="border-b border-subtle px-4 py-3">
          <h3 className="text-16 font-semibold text-primary">{t("boards.settings.module_stages.edit_stage")}</h3>
        </div>
        <div className="space-y-4 px-4 py-4">
          <Controller
            control={control}
            name="name"
            rules={{ required: t("name_is_required") }}
            render={({ field }) => (
              <div className="space-y-1">
                <p className="text-11 font-medium text-secondary">{t("boards.settings.module_stages.name_label")}</p>
                <Input {...field} hasError={Boolean(errors.name)} />
              </div>
            )}
          />
          <Controller
            control={control}
            name="color"
            render={({ field: { value, onChange } }) => (
              <div className="space-y-1">
                <p className="text-11 font-medium text-secondary">{t("boards.settings.module_stages.color_label")}</p>
                <InputColorPicker
                  name="stage-color-edit"
                  value={value}
                  onChange={(val) => onChange(val?.startsWith("#") ? val : `#${val ?? stage.color}`)}
                  placeholder={stage.color}
                  hasError={false}
                  className="w-full"
                />
              </div>
            )}
          />
          <Controller
            control={control}
            name="is_active"
            render={({ field: { value, onChange } }) => (
              <div className="flex items-center justify-between gap-3 rounded-md border border-subtle px-3 py-2.5">
                <div>
                  <p className="text-13 font-medium text-primary">{t("boards.settings.module_stages.active_label")}</p>
                  <p className="text-11 text-tertiary">{t("boards.settings.module_stages.active_hint")}</p>
                </div>
                <ToggleSwitch value={Boolean(value)} onChange={onChange} size="sm" />
              </div>
            )}
          />
          <Controller
            control={control}
            name="is_default"
            render={({ field: { value, onChange } }) => (
              <div className="flex items-center justify-between gap-3 rounded-md border border-subtle px-3 py-2.5">
                <div>
                  <p className="text-13 font-medium text-primary">{t("boards.settings.module_stages.default_label")}</p>
                  <p className="text-11 text-tertiary">{t("boards.settings.module_stages.default_hint")}</p>
                </div>
                <ToggleSwitch value={Boolean(value)} onChange={onChange} size="sm" />
              </div>
            )}
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-subtle px-4 py-3">
          <Button variant="secondary" type="button" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            {t("save_changes")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
