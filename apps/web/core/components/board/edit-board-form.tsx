/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Button } from "@plane/propel/button";
import { EmojiPicker, EmojiIconPickerTypes, Logo } from "@plane/propel/emoji-icon-picker";
import { CloseIcon } from "@plane/propel/icons";
import type { IBoard, TBoardFormData, TLogoProps } from "@plane/types";
import { Input, TextArea } from "@plane/ui";
import { useBoard } from "@/hooks/store/use-board";

type Props = {
  workspaceSlug: string;
  board: IBoard;
  onClose: () => void;
  onUpdated?: (board: IBoard) => void;
};

export function EditBoardForm(props: Props) {
  const { workspaceSlug, board, onClose, onUpdated } = props;
  const { t } = useTranslation();
  const { updateBoard } = useBoard();
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TBoardFormData>({
    defaultValues: {
      name: board.name,
      description: board.description ?? "",
      logo_props: board.logo_props,
    },
    mode: "onChange",
  });

  const onSubmit = async (data: TBoardFormData) => {
    try {
      const updated = await updateBoard(workspaceSlug, board.slug, data);
      onUpdated?.(updated);
      onClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("something_went_wrong"),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-subtle px-4 py-3">
        <div className="flex items-center gap-3">
          <Controller
            control={control}
            name="logo_props"
            render={({ field: { value, onChange } }) => (
              <EmojiPicker
                iconType="material"
                isOpen={isEmojiPickerOpen}
                handleToggle={setIsEmojiPickerOpen}
                label={
                  <span className="grid h-10 w-10 place-items-center rounded-md border border-subtle bg-layer-2">
                    <Logo logo={value} size={20} />
                  </span>
                }
                onChange={(val) => {
                  const logoValue =
                    val.type === EmojiIconPickerTypes.EMOJI
                      ? { value: val.value }
                      : val.value;
                  onChange({
                    in_use: val.type,
                    [val.type]: logoValue,
                  } as TLogoProps);
                  setIsEmojiPickerOpen(false);
                }}
              />
            )}
          />
          <div>
            <h3 className="text-16 font-semibold text-primary">{t("boards.edit")}</h3>
            <p className="text-11 text-tertiary">{t("boards.edit_subtitle")}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded p-1 text-placeholder hover:bg-layer-transparent-hover">
          <CloseIcon className="size-4" />
        </button>
      </div>

      <div className="space-y-4 px-4 py-4">
        <Controller
          control={control}
          name="name"
          rules={{
            required: t("name_is_required"),
            maxLength: { value: 255, message: t("title_should_be_less_than_255_characters") },
          }}
          render={({ field }) => (
            <div className="space-y-1">
              <p className="text-11 font-medium text-secondary">{t("boards.name_label")}</p>
              <Input
                {...field}
                placeholder={t("boards.name_placeholder")}
                hasError={Boolean(errors.name)}
                className="w-full"
              />
              {errors.name && (
                <p className="text-11 text-danger-primary">{String(errors.name.message ?? "")}</p>
              )}
            </div>
          )}
        />

        <div className="space-y-1">
          <p className="text-11 font-medium text-secondary">{t("boards.slug_label")}</p>
          <Input value={board.slug} disabled className="w-full opacity-70" />
          <p className="text-11 text-tertiary">{t("boards.slug_hint")}</p>
        </div>

        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <div className="space-y-1">
              <p className="text-11 font-medium text-secondary">{t("description")}</p>
              <TextArea
                {...field}
                placeholder={t("boards.description_placeholder")}
                rows={3}
                className="w-full"
              />
            </div>
          )}
        />
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-subtle px-4 py-3">
        <Button variant="secondary" type="button" onClick={onClose}>
          {t("cancel")}
        </Button>
        <Button variant="primary" type="submit" loading={isSubmitting}>
          {t("save_changes")}
        </Button>
      </div>
    </form>
  );
}