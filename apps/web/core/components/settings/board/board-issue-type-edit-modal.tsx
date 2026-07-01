import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "@operoz/i18n";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import { Button } from "@operoz/propel/button";
import { EmojiPicker, EmojiIconPickerTypes, Logo } from "@operoz/propel/emoji-icon-picker";
import type { IBoardIssueType, TBoardIssueTypeFormData, TLogoProps } from "@operoz/types";
import { EModalPosition, EModalWidth, Input, ModalCore } from "@operoz/ui";
import { useBoardIssueType } from "@/hooks/store/use-board-issue-type";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  boardIssueType: IBoardIssueType;
  isOpen: boolean;
  onClose: () => void;
};

export function BoardIssueTypeEditModal(props: Props) {
  const { workspaceSlug, boardSlug, boardIssueType, isOpen, onClose } = props;
  const { t } = useTranslation();
  const { updateBoardIssueType } = useBoardIssueType();
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<TBoardIssueTypeFormData>({
    defaultValues: {
      name: boardIssueType.name,
      logo_props: boardIssueType.logo_props,
    },
  });

  useEffect(() => {
    reset({ name: boardIssueType.name, logo_props: boardIssueType.logo_props });
  }, [boardIssueType.id, boardIssueType.name, boardIssueType.logo_props, reset]);

  const onSubmit = async (data: TBoardIssueTypeFormData) => {
    try {
      await updateBoardIssueType(workspaceSlug, boardSlug, boardIssueType.id, data);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.settings.issue_types.edit_success_title"),
        message: t("boards.settings.issue_types.edit_success_message", { name: data.name }),
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
          <h3 className="text-16 font-semibold text-primary">{t("boards.settings.issue_types.edit_type")}</h3>
        </div>
        <div className="space-y-4 px-4 py-4">
          <Controller
            control={control}
            name="logo_props"
            render={({ field: { value, onChange } }) => (
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
            )}
          />
          <Controller
            control={control}
            name="name"
            rules={{ required: t("name_is_required") }}
            render={({ field }) => (
              <div className="space-y-1">
                <p className="text-11 font-medium text-secondary">{t("boards.settings.issue_types.name_label")}</p>
                <Input {...field} hasError={Boolean(errors.name)} />
              </div>
            )}
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-subtle px-4 py-3">
          <Button variant="secondary" type="button" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting} disabled={!isDirty}>
            {t("save_changes")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
