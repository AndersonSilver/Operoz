import { useMemo } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import { Logo } from "@operoz/propel/emoji-icon-picker";
import { CustomSelect } from "@operoz/ui";
import type { IProjectIssueTypeLite } from "@operoz/types";

const ALL_TYPES_VALUE = "__all__";

type Props = {
  value: string | null;
  issueTypes: IProjectIssueTypeLite[];
  onChange: (issueTypeId: string | null) => void;
  disabled?: boolean;
  className?: string;
};

export const WorkflowSchemeIssueTypeSelect = observer(function WorkflowSchemeIssueTypeSelect(props: Props) {
  const { value, issueTypes, onChange, disabled = false, className = "" } = props;
  const { t } = useTranslation();

  const selected = useMemo(
    () => (value ? issueTypes.find((type) => type.id === value) : undefined),
    [issueTypes, value]
  );

  return (
    <CustomSelect
      value={value ?? ALL_TYPES_VALUE}
      onChange={(nextValue: string) => {
        onChange(nextValue === ALL_TYPES_VALUE ? null : nextValue);
      }}
      label={
        selected ? (
          <span className="flex items-center gap-1.5">
            <Logo logo={selected.logo_props} size={14} />
            <span className="truncate">{selected.name}</span>
          </span>
        ) : (
          <span className="text-secondary">
            {t("workspace_settings.settings.workflow.schemes.editor.issue_type_all")}
          </span>
        )
      }
      buttonVariant="border-with-text"
      buttonClassName="text-12 w-full justify-between"
      className={className}
      dropdownArrow
      disabled={disabled}
    >
      <CustomSelect.Option value={ALL_TYPES_VALUE}>
        {t("workspace_settings.settings.workflow.schemes.editor.issue_type_all")}
      </CustomSelect.Option>
      {issueTypes.map((type) => (
        <CustomSelect.Option key={type.id} value={type.id}>
          <span className="flex items-center gap-2">
            <Logo logo={type.logo_props} size={14} />
            {type.name}
          </span>
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
});
