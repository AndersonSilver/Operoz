// plane imports
import type { SyntheticEvent } from "react";
import { useMemo } from "react";
import { observer } from "mobx-react";
import { ChevronDownIcon } from "@operoz/propel/icons";
import { useTranslation } from "@operoz/i18n";
import type { IIssueDisplayProperties, TIssue } from "@operoz/types";
// components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
// hooks
import { WithDisplayPropertiesHOC } from "@/components/issues/issue-layouts/properties/with-display-properties-HOC";
import { getLocalizedStateName } from "@/components/project-states/state-display.utils";
import { useProjectState } from "@/hooks/store/use-project-state";

type BaseProps = {
  workspaceSlug: string;
  parentIssueId: string;
  issueId: string;
  canEdit: boolean;
  updateSubIssue: (
    workspaceSlug: string,
    projectId: string,
    parentIssueId: string,
    issueId: string,
    issueData: Partial<TIssue>,
    oldIssue?: Partial<TIssue>
  ) => Promise<void>;
  displayProperties: IIssueDisplayProperties;
  issue: TIssue;
};

const handleEventPropagation = (e: SyntheticEvent<HTMLDivElement>) => {
  e.stopPropagation();
  e.preventDefault();
};

export const SubIssuesListItemPriorityCell = observer(function SubIssuesListItemPriorityCell(props: BaseProps) {
  const { workspaceSlug, parentIssueId, issueId, canEdit, updateSubIssue, displayProperties, issue } = props;

  return (
    <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="priority">
      <div className="flex h-7 items-center justify-start" onClick={handleEventPropagation}>
        <PriorityDropdown
          value={issue.priority}
          onChange={(val) =>
            issue.project_id &&
            updateSubIssue(workspaceSlug, issue.project_id, parentIssueId, issueId, {
              priority: val,
            })
          }
          disabled={!canEdit}
          buttonVariant="border-without-text"
          showTooltip
        />
      </div>
    </WithDisplayPropertiesHOC>
  );
});

export const SubIssuesListItemAssigneeCell = observer(function SubIssuesListItemAssigneeCell(props: BaseProps) {
  const { workspaceSlug, parentIssueId, issueId, canEdit, updateSubIssue, displayProperties, issue } = props;

  return (
    <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="assignee">
      <div className="flex h-7 items-center justify-start" onClick={handleEventPropagation}>
        <MemberDropdown
          value={issue.assignee_ids}
          projectId={issue.project_id ?? undefined}
          onChange={(val) =>
            issue.project_id &&
            updateSubIssue(workspaceSlug, issue.project_id, parentIssueId, issueId, {
              assignee_ids: val,
            })
          }
          disabled={!canEdit}
          multiple
          buttonVariant={(issue?.assignee_ids || []).length > 0 ? "transparent-without-text" : "border-without-text"}
          buttonClassName={(issue?.assignee_ids || []).length > 0 ? "hover:bg-transparent px-0" : ""}
        />
      </div>
    </WithDisplayPropertiesHOC>
  );
});

export const SubIssuesListItemStateCell = observer(function SubIssuesListItemStateCell(props: BaseProps) {
  const { workspaceSlug, parentIssueId, issueId, canEdit, updateSubIssue, displayProperties, issue } = props;
  const { t } = useTranslation();
  const { getStateById } = useProjectState();

  const stateDetails = useMemo(() => getStateById(issue.state_id), [getStateById, issue.state_id]);
  const stateColor = stateDetails?.color ?? "var(--text-color-tertiary)";
  const stateName = stateDetails ? getLocalizedStateName(stateDetails, t) : t("state");

  return (
    <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="state">
      <div className="flex h-7 items-center justify-start" onClick={handleEventPropagation}>
        <StateDropdown
          buttonVariant="border-with-text"
          value={issue.state_id}
          projectId={issue.project_id ?? undefined}
          onChange={(val) =>
            issue.project_id &&
            updateSubIssue(
              workspaceSlug,
              issue.project_id,
              parentIssueId,
              issueId,
              {
                state_id: val,
              },
              { ...issue }
            )
          }
          disabled={!canEdit}
          hideIcon
          button={
            <span
              className="inline-flex max-w-full items-center gap-1 rounded-sm px-2 py-1 text-10 font-semibold tracking-wide uppercase"
              style={{
                backgroundColor: `${stateColor}22`,
                color: stateColor,
                border: `1px solid ${stateColor}55`,
              }}
            >
              <span className="truncate">{stateName}</span>
              <ChevronDownIcon className="size-2.5 shrink-0 opacity-70" strokeWidth={2.5} />
            </span>
          }
        />
      </div>
    </WithDisplayPropertiesHOC>
  );
});
