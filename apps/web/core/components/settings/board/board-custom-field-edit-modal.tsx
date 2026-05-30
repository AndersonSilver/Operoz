/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Button } from "@plane/propel/button";
import type { IBoardCustomField, TWorkspaceCustomFieldUpdateData } from "@plane/types";
import { EModalPosition, EModalWidth, Input, ModalCore, TextArea } from "@plane/ui";
import { fieldTypeNeedsOptions } from "@/constants/board-custom-field-types";
import { useBoardCustomField } from "@/hooks/store/use-board-custom-field";
import { BoardCustomFieldTypeGlyph } from "./board-custom-field-type-glyph";
import {
  BoardCustomFieldOptionsEditor,
  getTrimmedFieldOptions,
} from "./board-custom-field-options-editor";

type Props = {
  workspaceSlug: string;
  boardSlug: string;
  boardField: IBoardCustomField;
  isOpen: boolean;
  onClose: () => void;
};

export function BoardCustomFieldEditModal(props: Props) {
  const { workspaceSlug, boardSlug, boardField, isOpen, onClose } = props;
  const { t } = useTranslation();
  const { updateWorkspaceCustomField } = useBoardCustomField();
  const [options, setOptions] = useState<string[]>([""]);
  const [initialOptionsKey, setInitialOptionsKey] = useState("");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<TWorkspaceCustomFieldUpdateData>({
    defaultValues: {
      name: boardField.name,
      description: boardField.description ?? "",
    },
  });

  useEffect(() => {
    const saved = boardField.settings?.options ?? [];
    const rows = saved.length > 0 ? [...saved] : [""];
    setOptions(rows);
    setInitialOptionsKey(getTrimmedFieldOptions(saved).join("\u0001"));
    reset({
      name: boardField.name,
      description: boardField.description ?? "",
    });
  }, [boardField.id, boardField.name, boardField.description, boardField.settings, reset]);

  const onSubmit = async (data: TWorkspaceCustomFieldUpdateData) => {
    try {
      const payload: TWorkspaceCustomFieldUpdateData = {
        name: data.name?.trim(),
        description: data.description ?? "",
      };
      if (fieldTypeNeedsOptions(boardField.field_type)) {
        const trimmedOptions = getTrimmedFieldOptions(options);
        if (trimmedOptions.length === 0) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("toast.error"),
            message: t("boards.settings.fields.options_required"),
          });
          return;
        }
        payload.settings = { options: trimmedOptions };
      }
      await updateWorkspaceCustomField(workspaceSlug, boardSlug, boardField.custom_field_id, payload);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.settings.fields.edit_success_title"),
        message: t("boards.settings.fields.edit_success_message", { name: payload.name ?? boardField.name }),
      });
      onClose();
    } catch (err: unknown) {
      const apiError = err as { name?: string[]; detail?: string };
      let message = t("something_went_wrong");
      if (Array.isArray(apiError?.name) && apiError.name[0]) {
        message = apiError.name[0];
      } else if (apiError?.detail) {
        message = apiError.detail;
      }
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message });
    }
  };

  const optionsDirty =
    fieldTypeNeedsOptions(boardField.field_type) &&
    getTrimmedFieldOptions(options).join("\u0001") !== initialOptionsKey;

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col">
        <div className="border-b border-subtle px-4 py-3">
          <h3 className="text-16 font-semibold text-primary">{t("boards.settings.fields.edit_field")}</h3>
        </div>
        <div className="space-y-4 px-4 py-4">
          <div className="flex items-center gap-3 rounded-lg border border-subtle bg-layer-2 px-3 py-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-md border border-subtle bg-[rgba(38,132,255,0.08)]">
              <BoardCustomFieldTypeGlyph fieldType={boardField.field_type} size="sm" />
            </span>
            <div className="min-w-0">
              <p className="text-11 font-medium text-secondary">{t("boards.settings.fields.type_label")}</p>
              <p className="text-body-sm-medium text-primary">
                {t(`boards.settings.fields.types.${boardField.field_type}`)}
              </p>
              <p className="text-11 text-tertiary">{t("boards.settings.fields.type_readonly_hint")}</p>
            </div>
          </div>
          <Controller
            control={control}
            name="name"
            rules={{ required: t("name_is_required") }}
            render={({ field }) => (
              <div className="space-y-1">
                <p className="text-11 font-medium text-secondary">{t("boards.settings.fields.name_label")}</p>
                <Input {...field} hasError={Boolean(errors.name)} />
              </div>
            )}
          />
          <Controller
            control={control}
            name="description"
            render={({ field }) => (
              <div className="space-y-1">
                <p className="text-11 font-medium text-secondary">{t("boards.settings.fields.description_label")}</p>
                <TextArea
                  {...field}
                  value={field.value ?? ""}
                  placeholder={t("boards.settings.fields.description_placeholder")}
                  rows={3}
                />
              </div>
            )}
          />
          {fieldTypeNeedsOptions(boardField.field_type) && (
            <BoardCustomFieldOptionsEditor options={options} onChange={setOptions} />
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-subtle px-4 py-3">
          <Button variant="secondary" type="button" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting} disabled={!isDirty && !optionsDirty}>
            {t("save_changes")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
