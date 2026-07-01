import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import { Button } from "@operoz/propel/button";
import { EmojiPicker, EmojiIconPickerTypes, Logo } from "@operoz/propel/emoji-icon-picker";
import type { TBoardIssueTypeFormData, TLogoProps } from "@operoz/types";
import { EModalPosition, EModalWidth, Input, ModalCore } from "@operoz/ui";
import { useBoardIssueType } from "@/hooks/store/use-board-issue-type";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  isOpen: boolean;
  onClose: () => void;
};

const defaultLogo = (): TLogoProps => ({
  in_use: "icon",
  icon: { name: "add_task", color: "#5e6ad2" },
});

export function BoardIssueTypeCreateModal(props: Props) {
  const { workspaceSlug, boardSlug, isOpen, onClose } = props;
  const { t } = useTranslation();
  const { createBoardIssueType } = useBoardIssueType();
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TBoardIssueTypeFormData>({
    defaultValues: { name: "", logo_props: defaultLogo() },
  });

  const onSubmit = async (data: TBoardIssueTypeFormData) => {
    try {
      await createBoardIssueType(workspaceSlug, boardSlug, data);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.settings.issue_types.create_success_title"),
        message: t("boards.settings.issue_types.create_success_message", { name: data.name }),
      });
      reset({ name: "", logo_props: defaultLogo() });
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message: t("something_went_wrong") });
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
        <div className="border-b border-subtle px-4 py-3">
          <h3 className="text-16 font-semibold text-primary">{t("boards.settings.issue_types.add_type")}</h3>
        </div>
        <div className="space-y-4 px-4 py-4">
          <Controller
            control={control}
            name="logo_props"
            render={({ field: { value, onChange } }) => (
              <div className="flex items-center gap-3">
                <EmojiPicker
                  iconType="material"
                  defaultOpen={EmojiIconPickerTypes.ICON}
                  isOpen={isEmojiPickerOpen}
                  handleToggle={setIsEmojiPickerOpen}
                  label={
                    <span className="grid h-10 w-10 place-items-center rounded-md border border-subtle bg-layer-2">
                      <Logo logo={value} size={20} />
                    </span>
                  }
                  onChange={(val) => {
                    const logoValue = val.type === EmojiIconPickerTypes.EMOJI ? { value: val.value } : val.value;
                    onChange({ in_use: val.type, [val.type]: logoValue } as TLogoProps);
                    setIsEmojiPickerOpen(false);
                  }}
                />
                <p className="text-11 text-tertiary">{t("boards.settings.change_icon")}</p>
              </div>
            )}
          />
          <Controller
            control={control}
            name="name"
            rules={{ required: t("name_is_required") }}
            render={({ field }) => (
              <div className="space-y-1">
                <p className="text-11 font-medium text-secondary">{t("boards.settings.issue_types.name_label")}</p>
                <Input
                  {...field}
                  placeholder={t("boards.settings.issue_types.name_placeholder")}
                  hasError={Boolean(errors.name)}
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
            {t("boards.settings.issue_types.add_type")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
