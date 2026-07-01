import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import { Button } from "@operoz/propel/button";
import type { TBoardModuleStageFormData } from "@operoz/types";
import { EModalPosition, EModalWidth, Input, InputColorPicker, ModalCore } from "@operoz/ui";
import { useBoardModuleStage } from "@/hooks/store/use-board-module-stage";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  isOpen: boolean;
  onClose: () => void;
};

const DEFAULT_COLOR = "#00b8a9";

export function BoardModuleStageCreateModal(props: Props) {
  const { workspaceSlug, boardSlug, isOpen, onClose } = props;
  const { t } = useTranslation();
  const { createBoardModuleStage } = useBoardModuleStage();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TBoardModuleStageFormData>({
    defaultValues: { name: "", color: DEFAULT_COLOR },
  });

  const onSubmit = async (data: TBoardModuleStageFormData) => {
    try {
      await createBoardModuleStage(workspaceSlug, boardSlug, data);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.settings.module_stages.create_success_title"),
        message: t("boards.settings.module_stages.create_success_message", { name: data.name }),
      });
      reset({ name: "", color: DEFAULT_COLOR });
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
        <div className="border-b border-subtle px-4 py-3">
          <h3 className="text-16 font-semibold text-primary">{t("boards.settings.module_stages.add_stage")}</h3>
        </div>
        <div className="space-y-4 px-4 py-4">
          <Controller
            control={control}
            name="name"
            rules={{ required: t("name_is_required") }}
            render={({ field }) => (
              <div className="space-y-1">
                <p className="text-11 font-medium text-secondary">{t("boards.settings.module_stages.name_label")}</p>
                <Input
                  {...field}
                  placeholder={t("boards.settings.module_stages.name_placeholder")}
                  hasError={Boolean(errors.name)}
                />
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
                  name="stage-color"
                  value={value}
                  onChange={(val) => onChange(val?.startsWith("#") ? val : `#${val ?? DEFAULT_COLOR}`)}
                  placeholder={DEFAULT_COLOR}
                  hasError={false}
                  className="w-full"
                />
              </div>
            )}
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-subtle px-4 py-3">
          <Button variant="secondary" type="button" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            {t("boards.settings.module_stages.add_stage")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
