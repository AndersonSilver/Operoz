import { observer } from "mobx-react";
import useSWR from "swr";
import { useTranslation } from "@operis/i18n";
import { Logo } from "@operis/propel/emoji-icon-picker";
import { CustomSelect } from "@operis/ui";
import { cn } from "@operis/utils";
import { useBoardIssueType } from "@/hooks/store/use-board-issue-type";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import type { TIssueOperations } from "./root";

type TIssueTypeSelectProps = {
  className?: string;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  disabled?: boolean;
};

export const IssueTypeSelect = observer(function IssueTypeSelect(props: TIssueTypeSelectProps) {
  const { className = "", workspaceSlug, projectId, issueId, issueOperations, disabled = false } = props;
  const { t } = useTranslation();
  const { fetchProjectIssueTypes, getProjectIssueTypes } = useBoardIssueType();
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  const issue = getIssueById(issueId);

  const { isLoading } = useSWR(
    workspaceSlug && projectId ? `PROJECT_ISSUE_TYPES_${workspaceSlug}_${projectId}` : null,
    () => fetchProjectIssueTypes(workspaceSlug, projectId),
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const issueTypes = getProjectIssueTypes(projectId);
  const selected = issueTypes.find((type) => type.id === issue?.type_id);

  if (!issue || isLoading || issueTypes.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex h-full w-full items-center", className)}>
      <CustomSelect
        value={issue.type_id ?? ""}
        onChange={(val: string) => {
          issueOperations.update(workspaceSlug, projectId, issueId, { type_id: val });
        }}
        label={
          selected ? (
            <span className="flex items-center gap-1.5">
              <Logo logo={selected.logo_props} size={14} />
              <span className="truncate">{selected.name}</span>
            </span>
          ) : (
            <span className="text-placeholder">{t("issue.add.type")}</span>
          )
        }
        buttonVariant="transparent-with-text"
        buttonClassName={`text-body-xs-medium w-full ${issue.type_id ? "" : "text-placeholder"}`}
        className="group h-7.5 w-full grow"
        buttonContainerClassName="w-full text-left h-7.5 rounded-sm"
        dropdownArrow
        dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
        disabled={disabled}
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
    </div>
  );
});
