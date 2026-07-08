import { useMemo } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { NETWORK_CHOICES } from "@operoz/constants";
import { useTranslation } from "@operoz/i18n";
import type { IBoardProjectFieldLayout, IProject, TProjectStandardFieldKey } from "@operoz/types";
import { CustomSelect, Input, TextArea } from "@operoz/ui";
import { cn, projectIdentifierSanitizer } from "@operoz/utils";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ProjectNetworkIcon } from "@/components/project/project-network-icon";
import { TimezoneSelect } from "@/components/global";
import { BoardCustomFieldFormField } from "@/plane-web/components/issues/issue-modal/board-custom-field-form-field";
import { getBoardProjectFieldDisplayName } from "@/components/settings/board/board-project-field-display";
import {
  getIssueFormControlClass,
  issueFormControlBaseClass,
  IssueFormField,
} from "@/plane-web/components/issues/issue-modal/issue-form-field";
import type { IProjectCustomFieldLite } from "@operoz/types";
import type { TCustomFieldValue } from "@operoz/types";
import { projectFieldRequiredRules } from "./project-layout-validation";
import {
  ProjectFormFieldError,
  projectFormTextAreaErrorBgClass,
  withProjectFormControlError,
} from "./project-form-validation-ui";

const PINNED_ON_CREATE: TProjectStandardFieldKey[] = ["name", "identifier"];

type Props = {
  layout: IBoardProjectFieldLayout[];
  workspaceSlug: string;
  mode: "create" | "edit";
  customFieldValues: Record<string, TCustomFieldValue>;
  onCustomFieldChange: (fieldId: string, value: TCustomFieldValue) => void;
  projectCustomFields: IProjectCustomFieldLite[];
  projectId?: string;
  disabled?: boolean;
  /** Em create, nome/chave ficam no bloco fixo acima. */
  omitPinnedOnCreate?: boolean;
};

export function BoardProjectDynamicFields(props: Props) {
  const {
    layout,
    workspaceSlug,
    mode,
    customFieldValues,
    onCustomFieldChange,
    projectCustomFields,
    projectId = "",
    disabled = false,
    omitPinnedOnCreate = false,
  } = props;
  const { t } = useTranslation();
  const { control } = useFormContext<IProject>();

  const sorted = useMemo(
    () =>
      [...layout]
        .filter((f) => f.is_enabled)
        .filter((f) => {
          if (mode === "create" && omitPinnedOnCreate && f.field_source === "system") {
            return !PINNED_ON_CREATE.includes(f.standard_field_key as TProjectStandardFieldKey);
          }
          return true;
        })
        .sort((a, b) => a.sort_order - b.sort_order),
    [layout, mode, omitPinnedOnCreate]
  );

  const customById = useMemo(() => {
    const map = new Map<string, IProjectCustomFieldLite>();
    projectCustomFields.forEach((f) => map.set(f.id, f));
    return map;
  }, [projectCustomFields]);

  const renderSystem = (item: IBoardProjectFieldLayout) => {
    const key = item.standard_field_key as TProjectStandardFieldKey;
    const label = getBoardProjectFieldDisplayName(item, t);
    const required = item.is_required;
    const requiredRules = projectFieldRequiredRules(required, t("field_is_required"));
    const spanClass = item.form_span === "full" ? "sm:col-span-2" : "";

    switch (key) {
      case "name":
        return (
          <div key={item.id} className={spanClass}>
            <IssueFormField label={label} controlWidth="full" required={required}>
              <Controller
                control={control}
                name="name"
                rules={required ? { required: t("name_is_required") } : undefined}
                render={({ field }) => (
                  <input
                    {...field}
                    className={cn(getIssueFormControlClass("full"), "w-full")}
                    placeholder={t("common.project_name")}
                    disabled={disabled}
                  />
                )}
              />
            </IssueFormField>
          </div>
        );
      case "identifier":
        if (mode === "edit") return null;
        return (
          <div key={item.id} className={spanClass}>
            <IssueFormField label={label} controlWidth="medium" required={required}>
              <Controller
                control={control}
                name="identifier"
                rules={required ? { required: t("project_id_is_required") } : undefined}
                render={({ field: { value, onChange } }) => (
                  <input
                    value={value ?? ""}
                    onChange={(e) => onChange(projectIdentifierSanitizer(e.target.value))}
                    className={cn(getIssueFormControlClass("medium"), "w-full uppercase")}
                    placeholder="OPS"
                    disabled={disabled}
                  />
                )}
              />
            </IssueFormField>
          </div>
        );
      case "description":
        return (
          <div key={item.id} className={spanClass}>
            <IssueFormField label={label} controlWidth="full" required={required}>
              <Controller
                control={control}
                name="description"
                rules={requiredRules}
                render={({ field, fieldState }) => (
                  <>
                    <TextArea
                      {...field}
                      value={field.value ?? ""}
                      hasError={Boolean(fieldState.error)}
                      className={cn(
                        "min-h-[88px] w-full resize-y rounded-md text-13",
                        fieldState.error && projectFormTextAreaErrorBgClass
                      )}
                      placeholder={t("description")}
                      disabled={disabled}
                    />
                    <ProjectFormFieldError message={fieldState.error?.message} />
                  </>
                )}
              />
            </IssueFormField>
          </div>
        );
      case "project_lead":
        return (
          <div key={item.id} className={spanClass}>
            <IssueFormField label={label} controlWidth="medium" required={required}>
              <Controller
                control={control}
                name="project_lead"
                rules={requiredRules}
                render={({ field: { value, onChange }, fieldState }) => (
                  <>
                    <MemberDropdown
                      value={(value as unknown as string | null) ?? null}
                      onChange={onChange as (val: string | null) => void}
                      placeholder={t("lead")}
                      disabled={disabled}
                      buttonVariant="border-with-text"
                      buttonClassName={withProjectFormControlError(
                        Boolean(fieldState.error),
                        issueFormControlBaseClass,
                        "w-full"
                      )}
                      buttonContainerClassName="w-full"
                      multiple={false}
                      showUserDetails
                    />
                    <ProjectFormFieldError message={fieldState.error?.message} />
                  </>
                )}
              />
            </IssueFormField>
          </div>
        );
      case "responsible_stakeholder":
        return (
          <div key={item.id} className={spanClass}>
            <IssueFormField label={label} controlWidth="medium" required={required}>
              <Controller
                control={control}
                name="responsible_stakeholder"
                rules={requiredRules}
                render={({ field: { value, onChange }, fieldState }) => (
                  <>
                    <Input
                      value={value ?? ""}
                      onChange={onChange}
                      hasError={Boolean(fieldState.error)}
                      className={cn(getIssueFormControlClass("medium"), "w-full")}
                      placeholder={t("project.responsible_stakeholder_placeholder")}
                      disabled={disabled}
                    />
                    <ProjectFormFieldError message={fieldState.error?.message} />
                  </>
                )}
              />
            </IssueFormField>
          </div>
        );
      case "default_assignee":
        return (
          <div key={item.id} className={spanClass}>
            <IssueFormField label={label} controlWidth="medium" required={required}>
              <Controller
                control={control}
                name="default_assignee"
                rules={requiredRules}
                render={({ field: { value, onChange }, fieldState }) => (
                  <>
                    <MemberDropdown
                      value={(value as unknown as string | null) ?? null}
                      onChange={onChange as (val: string | null) => void}
                      placeholder={t("assignees")}
                      disabled={disabled}
                      buttonVariant="border-with-text"
                      buttonClassName={withProjectFormControlError(
                        Boolean(fieldState.error),
                        issueFormControlBaseClass,
                        "w-full"
                      )}
                      buttonContainerClassName="w-full"
                      multiple={false}
                      showUserDetails
                    />
                    <ProjectFormFieldError message={fieldState.error?.message} />
                  </>
                )}
              />
            </IssueFormField>
          </div>
        );
      case "network":
        return (
          <div key={item.id} className={spanClass}>
            <IssueFormField label={label} controlWidth="medium" required={required}>
              <Controller
                control={control}
                name="network"
                rules={requiredRules}
                render={({ field: { value, onChange }, fieldState }) => {
                  const current = NETWORK_CHOICES.find((n) => n.key === value);
                  return (
                    <>
                      <CustomSelect
                        value={value}
                        onChange={onChange}
                        label={
                          <div className="flex h-full items-center gap-1 px-2">
                            {current ? (
                              <>
                                <ProjectNetworkIcon iconKey={current.iconKey} />
                                {t(current.i18n_label)}
                              </>
                            ) : (
                              <span className="text-placeholder">{t("select_network")}</span>
                            )}
                          </div>
                        }
                        buttonClassName={withProjectFormControlError(
                          Boolean(fieldState.error),
                          issueFormControlBaseClass,
                          "w-full"
                        )}
                        className="w-full"
                        disabled={disabled}
                      >
                        {NETWORK_CHOICES.map((network) => (
                          <CustomSelect.Option key={network.key} value={network.key}>
                            <div className="flex items-center gap-2">
                              <ProjectNetworkIcon iconKey={network.iconKey} />
                              {t(network.i18n_label)}
                            </div>
                          </CustomSelect.Option>
                        ))}
                      </CustomSelect>
                      <ProjectFormFieldError message={fieldState.error?.message} />
                    </>
                  );
                }}
              />
            </IssueFormField>
          </div>
        );
      case "timezone":
        return (
          <div key={item.id} className={spanClass}>
            <IssueFormField label={label} controlWidth="medium" required={required}>
              <Controller
                control={control}
                name="timezone"
                rules={requiredRules}
                render={({ field: { value, onChange }, fieldState }) => (
                  <>
                    <TimezoneSelect
                      value={value ?? "UTC"}
                      onChange={onChange}
                      disabled={disabled}
                      error={Boolean(fieldState.error)}
                    />
                    <ProjectFormFieldError message={fieldState.error?.message} />
                  </>
                )}
              />
            </IssueFormField>
          </div>
        );
      default:
        return null;
    }
  };

  const renderCustom = (item: IBoardProjectFieldLayout) => {
    const fieldId = item.custom_field_id;
    if (!fieldId) return null;
    const field = customById.get(fieldId);
    if (!field) return null;
    const spanClass = item.form_span === "full" ? "sm:col-span-2" : "";
    return (
      <div key={item.id} className={spanClass}>
        <BoardCustomFieldFormField
          field={field}
          value={customFieldValues[fieldId]}
          projectId={projectId}
          onChange={(val) => onCustomFieldChange(fieldId, val)}
        />
      </div>
    );
  };

  if (sorted.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      {sorted.map((item) => (item.field_source === "system" ? renderSystem(item) : renderCustom(item)))}
    </div>
  );
}
