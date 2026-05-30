/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import type { IProjectCustomFieldLite, TCustomFieldValue } from "@plane/types";
import { Input, TextArea, ToggleSwitch } from "@plane/ui";
import { cn } from "@plane/utils";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import {
  getIssueFormControlClass,
  issueFormControlWidthClass,
  IssueFormField,
  IssueFormNativeSelect,
  issueFormControlBorderClass,
} from "./issue-form-field";

type Props = {
  field: IProjectCustomFieldLite;
  value: TCustomFieldValue | undefined;
  projectId?: string;
  onChange: (value: TCustomFieldValue) => void;
};

export function BoardCustomFieldFormField(props: Props) {
  const { field, value, projectId = "", onChange } = props;
  const { t } = useTranslation();
  const hint = field.description?.trim() || undefined;

  switch (field.field_type) {
    case "paragraph":
      return (
        <IssueFormField label={field.name} hint={hint} controlWidth="full">
          <TextArea
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("boards.settings.fields.value_placeholder")}
            className={cn(getIssueFormControlClass("full"), "min-h-[88px] w-full cursor-text resize-y py-2 pr-3")}
          />
        </IssueFormField>
      );
    case "date":
      return (
        <IssueFormField label={field.name} hint={hint} controlWidth="custom">
          <Input
            type="date"
            className={getIssueFormControlClass("custom")}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </IssueFormField>
      );
    case "datetime":
      return (
        <IssueFormField label={field.name} hint={hint} controlWidth="custom">
          <Input
            type="datetime-local"
            className={getIssueFormControlClass("custom")}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </IssueFormField>
      );
    case "checkbox":
      return (
        <div className={issueFormControlWidthClass.custom}>
          <div className={cn("flex items-start gap-3 rounded-[3px] bg-layer-2 px-3 py-2.5", issueFormControlBorderClass)}>
            <ToggleSwitch value={Boolean(value)} onChange={(checked) => onChange(checked)} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-12 text-secondary">{field.name}</p>
              {hint ? <p className="mt-1 text-12 leading-snug text-tertiary">{hint}</p> : null}
            </div>
          </div>
        </div>
      );
    case "number":
      return (
        <IssueFormField label={field.name} hint={hint} controlWidth="custom">
          <Input
            type="number"
            className={getIssueFormControlClass("custom")}
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
            placeholder={t("boards.settings.fields.value_placeholder")}
          />
        </IssueFormField>
      );
    case "url":
      return (
        <IssueFormField label={field.name} hint={hint} controlWidth="custom">
          <Input
            type="url"
            className={getIssueFormControlClass("custom")}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://"
          />
        </IssueFormField>
      );
    case "select":
    case "categories": {
      const options = field.settings?.options ?? [];
      const selected = typeof value === "string" ? value : "";
      return (
        <IssueFormField label={field.name} hint={hint} controlWidth="custom">
          <IssueFormNativeSelect
            value={selected}
            onChange={onChange}
            placeholder={t("boards.settings.fields.select_placeholder")}
            options={options}
          />
        </IssueFormField>
      );
    }
    case "multi_select": {
      const options = field.settings?.options ?? [];
      const selected = Array.isArray(value) ? value : typeof value === "string" && value ? [value] : [];
      const toggleOption = (opt: string) => {
        const next = selected.includes(opt) ? selected.filter((o) => o !== opt) : [...selected, opt];
        onChange(next);
      };
      return (
        <IssueFormField label={field.name} hint={hint} controlWidth="custom">
          <div className={cn("w-full overflow-hidden rounded-[3px] bg-layer-2", issueFormControlBorderClass)}>
            {options.map((opt, index) => (
              <label
                key={opt}
                className={cn(
                  "flex cursor-pointer items-center gap-3 px-3 py-2.5 text-13 text-primary hover:bg-layer-transparent-hover",
                  index > 0 && "border-t border-subtle"
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggleOption(opt)}
                  className="size-4 rounded border-subtle-1 accent-accent-primary"
                />
                <span className="truncate">{opt}</span>
              </label>
            ))}
          </div>
        </IssueFormField>
      );
    }
    case "member": {
      const memberId =
        typeof value === "object" && value !== null && "member_id" in value
          ? String((value as { member_id?: string }).member_id ?? "")
          : typeof value === "string"
            ? value
            : undefined;
      return (
        <IssueFormField label={field.name} hint={hint} controlWidth="custom">
          <MemberDropdown
            projectId={projectId}
            multiple={false}
            value={memberId || null}
            onChange={(id) => onChange(id ? { member_id: id } : null)}
            buttonVariant="border-with-text"
            buttonClassName={getIssueFormControlClass("custom")}
            buttonContainerClassName="w-full"
            className="w-full"
            placeholder={t("boards.settings.fields.member_placeholder")}
          />
        </IssueFormField>
      );
    }
    default:
      return (
        <IssueFormField label={field.name} hint={hint} controlWidth="custom">
          <Input
            className={getIssueFormControlClass("custom")}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("boards.settings.fields.value_placeholder")}
          />
        </IssueFormField>
      );
  }
}
