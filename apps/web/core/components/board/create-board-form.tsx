/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { RANDOM_EMOJI_CODES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Button } from "@plane/propel/button";
import { EmojiPicker, EmojiIconPickerTypes, Logo } from "@plane/propel/emoji-icon-picker";
import { CloseIcon } from "@plane/propel/icons";
import type { TBoardFormData, TLogoProps } from "@plane/types";
import { Input, TextArea } from "@plane/ui";
import { validateSlug } from "@plane/utils";
import { useBoard } from "@/hooks/store/use-board";
import { boardSlugFromName } from "./board-slug";

type Props = {
  workspaceSlug: string;
  onClose: () => void;
  onCreated?: (data: TBoardFormData & { slug: string }) => void;
};

const defaultLogo = (): TLogoProps => ({
  in_use: "emoji",
  emoji: {
    value: RANDOM_EMOJI_CODES[Math.floor(Math.random() * RANDOM_EMOJI_CODES.length)],
  },
});

export function CreateBoardForm(props: Props) {
  const { workspaceSlug, onClose, onCreated } = props;
  const { t } = useTranslation();
  const { createBoard } = useBoard();
  const [slugPreview, setSlugPreview] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TBoardFormData>({
    defaultValues: {
      name: "",
      description: "",
      logo_props: defaultLogo(),
    },
    mode: "onChange",
  });

  const nameValue = watch("name");

  useEffect(() => {
    if (autoSlug) setSlugPreview(boardSlugFromName(nameValue ?? ""));
  }, [nameValue, autoSlug]);

  const onSubmit = async (data: TBoardFormData) => {
    const slug = slugPreview || boardSlugFromName(data.name);
    if (validateSlug(slug) !== true) return;

    try {
      const board = await createBoard(workspaceSlug, { ...data, slug });
      onCreated?.({ ...data, slug: board.slug });
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
            <h3 className="text-16 font-semibold text-primary">{t("boards.create")}</h3>
            <p className="text-11 text-tertiary">{t("boards.create_subtitle")}</p>
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
          <Input
            value={slugPreview}
            onChange={(e) => {
              setAutoSlug(false);
              setSlugPreview(e.target.value);
            }}
            placeholder="squad-as-a-service"
            hasError={Boolean(slugPreview && validateSlug(slugPreview) !== true)}
          />
          {slugPreview && validateSlug(slugPreview) !== true && (
            <p className="text-11 text-danger-primary">{String(validateSlug(slugPreview))}</p>
          )}
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
          {t("boards.create")}
        </Button>
      </div>
    </form>
  );
}
