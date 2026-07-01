import { useTranslation } from "@operoz/i18n";
import type { IProjectCustomFieldLite, TCustomFieldValue } from "@operoz/types";
import { CustomSearchSelect, Input, TextArea, ToggleSwitch } from "@operoz/ui";
import { cn } from "@operoz/utils";
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
          <div
            className={cn("flex items-start gap-3 rounded-[3px] bg-layer-2 px-3 py-2.5", issueFormControlBorderClass)}
          >
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
      const formattedOptions = options.map((opt) => ({
        value: opt,
        query: opt.toLowerCase(),
        content: <span className="truncate">{opt}</span>,
      }));
      const selectedSummary =
        selected.length === 0
          ? null
          : selected.length <= 2
            ? selected.join(", ")
            : `${selected.slice(0, 2).join(", ")} +${selected.length - 2}`;

      return (
        <IssueFormField label={field.name} hint={hint} controlWidth="custom">
          <CustomSearchSelect
            multiple
            input
            value={selected}
            onChange={onChange}
            options={formattedOptions}
            className="w-full"
            buttonClassName={cn(getIssueFormControlClass("custom"), "justify-between gap-2")}
            label={
              <span className={cn("min-w-0 truncate text-left", !selectedSummary && "text-tertiary")}>
                {selectedSummary ?? t("boards.settings.fields.select_placeholder")}
              </span>
            }
            searchPlaceholder={t("search")}
            noResultsMessage={t("no_matching_results")}
            maxHeight="md"
          />
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
