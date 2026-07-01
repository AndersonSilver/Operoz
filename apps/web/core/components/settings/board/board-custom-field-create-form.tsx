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
import type { IWorkspaceCustomField, TWorkspaceCustomFieldFormData } from "@plane/types";
import { Input, TextArea } from "@plane/ui";
import { fieldTypeNeedsOptions } from "@/constants/board-custom-field-types";
import { useBoardCustomField } from "@/hooks/store/use-board-custom-field";
import { BoardCustomFieldTypePicker } from "./board-custom-field-type-picker";
import {
  BoardCustomFieldOptionsEditor,
  getTrimmedFieldOptions,
} from "./board-custom-field-options-editor";

type Props = {
  workspaceSlug: string;
  onCancel: () => void;
  onCreated: (field: IWorkspaceCustomField) => void;
};

export function BoardCustomFieldCreateForm(props: Props) {
  const { workspaceSlug, onCancel, onCreated } = props;
  const { t } = useTranslation();
  const { createWorkspaceCustomField } = useBoardCustomField();
  const [options, setOptions] = useState<string[]>([""]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TWorkspaceCustomFieldFormData>({
    defaultValues: {
      name: "",
      description: "",
      field_type: "text",
      settings: {},
    },
  });

  const fieldType = watch("field_type");

  useEffect(() => {
    if (fieldTypeNeedsOptions(fieldType) && options.length === 0) {
      setOptions([""]);
    }
  }, [fieldType, options.length]);

  const onSubmit = async (data: TWorkspaceCustomFieldFormData) => {
    try {
      const trimmedOptions = getTrimmedFieldOptions(options);
      if (fieldTypeNeedsOptions(data.field_type) && trimmedOptions.length === 0) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("boards.settings.fields.options_required"),
        });
        return;
      }
      const settings = fieldTypeNeedsOptions(data.field_type) ? { options } : {};
      const created = await createWorkspaceCustomField(workspaceSlug, { ...data, settings });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("boards.settings.fields.create_workspace_success_title"),
        message: t("boards.settings.fields.create_workspace_success_message", { name: data.name }),
      });
      reset();
      setOptions([""]);
      onCreated(created);
    } catch (err: unknown) {
      const apiError = err as { name?: string; field_type?: string; settings?: string[]; error?: string };
      let message = t("something_went_wrong");
      if (apiError?.name === "FIELD_NAME_ALREADY_EXISTS") {
        message =
          apiError?.field_type === "FIELD_TYPE_MISMATCH"
            ? t("boards.settings.fields.name_type_mismatch", { name: data.name })
            : t("boards.settings.fields.name_exists");
      } else if (apiError?.settings?.[0] === "SELECT_REQUIRES_OPTIONS") {
        message = t("boards.settings.fields.options_required");
      } else if (Array.isArray(apiError?.name) && apiError.name[0]) {
        message = apiError.name[0];
      } else if (apiError?.error && apiError.error !== "The payload is not valid") {
        message = apiError.error;
      }
      setToast({ type: TOAST_TYPE.ERROR, title: t("toast.error"), message });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <Controller
          control={control}
          name="name"
          rules={{ required: t("name_is_required") }}
          render={({ field }) => (
            <div className="space-y-1.5">
              <p className="text-11 font-medium text-secondary">
                {t("boards.settings.fields.name_label")} <span className="text-danger">*</span>
              </p>
              <Input
                {...field}
                placeholder={t("boards.settings.fields.name_placeholder")}
                hasError={Boolean(errors.name)}
              />
            </div>
          )}
        />
        <Controller
          control={control}
          name="field_type"
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <div className="space-y-1.5">
              <p className="text-11 font-medium text-secondary">
                {t("boards.settings.fields.type_label")} <span className="text-danger">*</span>
              </p>
              <BoardCustomFieldTypePicker value={value} onChange={onChange} />
            </div>
          )}
        />
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <div className="space-y-1.5">
              <p className="text-11 font-medium text-secondary">{t("boards.settings.fields.description_label")}</p>
              <TextArea
                {...field}
                placeholder={t("boards.settings.fields.description_placeholder")}
                className="min-h-[72px]"
              />
            </div>
          )}
        />
        {fieldTypeNeedsOptions(fieldType) && (
          <BoardCustomFieldOptionsEditor options={options} onChange={setOptions} />
        )}
      </div>
      <div className="flex shrink-0 justify-end gap-2 border-t border-subtle px-5 py-4">
        <Button variant="secondary" type="button" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button variant="primary" type="submit" loading={isSubmitting}>
          {t("boards.settings.fields.create_workspace_submit")}
        </Button>
      </div>
    </form>
  );
}
