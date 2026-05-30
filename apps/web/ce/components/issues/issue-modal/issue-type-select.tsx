/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { Controller, type Control, type UseFormSetValue, useWatch } from "react-hook-form";
import useSWR from "swr";
import { useParams } from "react-router";
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import type { TBulkIssueProperties, TIssue } from "@plane/types";
import { CustomSelect } from "@plane/ui";
import { cn } from "@plane/utils";
import { useBoardIssueType } from "@/hooks/store/use-board-issue-type";
import { issueFormControlBaseClass, issueFormControlWidthClass, type IssueFormControlWidth } from "./issue-form-field";

export type TIssueFields = TIssue & TBulkIssueProperties;

export type TIssueTypeDropdownVariant = "xs" | "sm";

export type TIssueTypeSelectProps<T extends Partial<TIssueFields>> = {
  control: Control<T>;
  setValue?: UseFormSetValue<T>;
  projectId: string | null;
  editorRef?: React.MutableRefObject<import("@plane/editor").EditorRefApi | null>;
  disabled?: boolean;
  variant?: TIssueTypeDropdownVariant;
  placeholder?: string;
  isRequired?: boolean;
  renderChevron?: boolean;
  dropDownContainerClassName?: string;
  controlWidth?: IssueFormControlWidth;
  showMandatoryFieldInfo?: boolean;
  handleFormChange?: () => void;
};

export const IssueTypeSelect = observer(function IssueTypeSelect<T extends Partial<TIssueFields>>(
  props: TIssueTypeSelectProps<T>
) {
  const {
    control,
    setValue,
    projectId,
    disabled = false,
    variant = "sm",
    placeholder,
    handleFormChange,
    dropDownContainerClassName,
    controlWidth = "medium",
  } = props;
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const { fetchProjectIssueTypes, getProjectIssueTypes } = useBoardIssueType();

  const typeId = useWatch({ control, name: "type_id" as keyof T & string });

  const { isLoading } = useSWR(
    workspaceSlug && projectId ? `PROJECT_ISSUE_TYPES_${workspaceSlug}_${projectId}` : null,
    () => fetchProjectIssueTypes(workspaceSlug!.toString(), projectId!.toString()),
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const issueTypes = projectId ? getProjectIssueTypes(projectId) : [];

  useEffect(() => {
    if (!setValue || !projectId || typeId || issueTypes.length === 0) return;
    const defaultType = issueTypes.find((type) => type.is_default) ?? issueTypes[0];
    setValue("type_id" as keyof T & string, defaultType.id as T[keyof T & string], { shouldValidate: true });
    handleFormChange?.();
  }, [typeId, issueTypes, projectId, setValue, handleFormChange]);

  if (!projectId || (!isLoading && issueTypes.length === 0)) {
    return null;
  }

  const selected = issueTypes.find((type) => type.id === typeId);

  return (
    <Controller
      control={control}
      name={"type_id" as keyof T & string}
      render={({ field: { value, onChange } }) => (
        <CustomSelect
          value={value ?? ""}
          onChange={(val: string) => {
            onChange(val);
            handleFormChange?.();
          }}
          label={
            selected ? (
              <span className="flex items-center gap-1.5">
                <Logo logo={selected.logo_props} size={14} />
                <span className="truncate">{selected.name}</span>
              </span>
            ) : (
              <span className="text-tertiary">{placeholder ?? t("issue.add.type")}</span>
            )
          }
          buttonClassName={cn(issueFormControlBaseClass, "w-full")}
          className={cn(issueFormControlWidthClass[controlWidth], dropDownContainerClassName)}
          disabled={disabled || isLoading}
        >
          {issueTypes.map((type) => (
            <CustomSelect.Option key={type.id} value={type.id}>
              <span className="flex items-center gap-2">
                <Logo logo={type.logo_props} size={14} />
                {type.name}
              </span>
            </CustomSelect.Option>
          ))}
        </CustomSelect>
      )}
    />
  );
});
