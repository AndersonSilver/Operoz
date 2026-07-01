import { observer } from "mobx-react";
import { PanelRight } from "lucide-react";
// i18n
import { useTranslation } from "@operoz/i18n";
// ui icons
import {
  CycleIcon,
  StatePropertyIcon,
  ModuleIcon,
  MembersPropertyIcon,
  PriorityPropertyIcon,
  StartDatePropertyIcon,
  DueDatePropertyIcon,
  LabelPropertyIcon,
  UserCirclePropertyIcon,
  EstimatePropertyIcon,
  ParentPropertyIcon,
  WorkItemsIcon,
} from "@operoz/propel/icons";
import { cn, getDate, renderFormattedPayloadDate, shouldHighlightIssueDueDate } from "@operoz/utils";
// components
import { DateDropdown } from "@/components/dropdowns/date";
import { EstimateDropdown } from "@/components/dropdowns/estimate";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { IssueWorkflowStateControl } from "../issue-detail/issue-workflow-state-control";
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { issueDetailPropertyDropdownProps } from "../issue-detail/sidebar-property-field";
// helpers
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
// plane web components
import { WorkItemAdditionalSidebarProperties } from "@/plane-web/components/issues/issue-details/additional-properties";
import { IssueParentSelectRoot } from "@/plane-web/components/issues/issue-details/parent-select-root";
import { DateAlert } from "@/plane-web/components/issues/issue-details/sidebar/date-alert";
import { TransferHopInfo } from "@/plane-web/components/issues/issue-details/sidebar/transfer-hop-info";
import { IssueWorklogProperty } from "@/plane-web/components/issues/worklog/property";
import type { TIssueOperations } from "../issue-detail";
import { IssueCycleSelect } from "../issue-detail/cycle-select";
import { IssueLabel } from "../issue-detail/label";
import { IssueModuleSelect } from "../issue-detail/module-select";
import { IssueTypeSelect } from "../issue-detail/issue-type-select";

interface IPeekOverviewProperties {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueOperations: TIssueOperations;
}

const dropdownArrowClassName = "size-3.5 text-tertiary opacity-0 transition-opacity group-hover:opacity-100";

export const PeekOverviewProperties = observer(function PeekOverviewProperties(props: IPeekOverviewProperties) {
  const { workspaceSlug, projectId, issueId, issueOperations, disabled } = props;
  const { t } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getStateById } = useProjectState();
  const { getUserDetails } = useMember();
  // derived values
  const issue = getIssueById(issueId);
  if (!issue) return <></>;
  const createdByDetails = getUserDetails(issue?.created_by);
  const projectDetails = getProjectById(issue.project_id);
  const isEstimateEnabled = projectDetails?.estimate;
  const stateDetails = getStateById(issue.state_id);

  const minDate = getDate(issue.start_date);
  minDate?.setDate(minDate.getDate());

  const maxDate = getDate(issue.target_date);
  maxDate?.setDate(maxDate.getDate());

  return (
    <section
      className={cn("shadow-sm overflow-hidden rounded-xl border border-subtle bg-surface-1", disabled && "opacity-60")}
    >
      <header className="flex items-center gap-2 border-b border-subtle px-3.5 py-3">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-layer-2 text-tertiary">
          <PanelRight className="size-3" strokeWidth={1.75} />
        </span>
        <h6 className="tracking-wider text-11 font-semibold text-secondary uppercase">{t("common.properties")}</h6>
      </header>

      <div className="flex flex-col gap-0.5 px-1 py-2">
        <SidebarPropertyListItem icon={StatePropertyIcon} label={t("common.state")}>
          <IssueWorkflowStateControl
            workspaceSlug={workspaceSlug}
            issueId={issueId}
            value={issue?.state_id}
            onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { state_id: val })}
            projectId={projectId}
            disabled={disabled}
            variant="compact"
            buttonVariant="transparent-with-text"
            className="group w-full grow"
            buttonContainerClassName="w-full text-left"
            buttonClassName={cn(
              issueDetailPropertyDropdownProps.buttonClassName,
              !issue?.state_id && "text-placeholder"
            )}
            dropdownArrow
            dropdownArrowClassName={dropdownArrowClassName}
          />
        </SidebarPropertyListItem>

        <SidebarPropertyListItem icon={WorkItemsIcon} label={t("issue_modal_type_label")}>
          <IssueTypeSelect
            className="min-h-6 w-full grow"
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            issueId={issueId}
            issueOperations={issueOperations}
            disabled={disabled}
          />
        </SidebarPropertyListItem>

        <SidebarPropertyListItem icon={MembersPropertyIcon} label={t("common.assignees")}>
          <MemberDropdown
            value={issue?.assignee_ids ?? undefined}
            onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { assignee_ids: val })}
            disabled={disabled}
            projectId={projectId}
            placeholder={t("issue.add.assignee")}
            multiple
            {...issueDetailPropertyDropdownProps}
            buttonVariant={issue?.assignee_ids?.length > 1 ? "transparent-without-text" : "transparent-with-text"}
            buttonClassName={cn(
              issueDetailPropertyDropdownProps.buttonClassName,
              issue?.assignee_ids?.length > 0 ? "text-primary" : "text-placeholder"
            )}
            hideIcon={issue.assignee_ids?.length === 0}
            dropdownArrow
            dropdownArrowClassName={dropdownArrowClassName}
          />
        </SidebarPropertyListItem>

        <SidebarPropertyListItem icon={PriorityPropertyIcon} label={t("common.priority")}>
          <PriorityDropdown
            value={issue?.priority}
            onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { priority: val })}
            disabled={disabled}
            {...issueDetailPropertyDropdownProps}
            buttonClassName={cn(
              issueDetailPropertyDropdownProps.buttonClassName,
              "px-0 [&_svg]:size-3.5",
              !issue?.priority || issue?.priority === "none" ? "text-placeholder" : ""
            )}
          />
        </SidebarPropertyListItem>

        {createdByDetails && (
          <SidebarPropertyListItem icon={UserCirclePropertyIcon} label={t("common.created_by")}>
            <div className="flex items-center gap-2">
              <ButtonAvatars
                showTooltip
                userIds={createdByDetails?.display_name.includes("-intake") ? null : createdByDetails?.id}
              />
              <span className="grow truncate text-13 text-primary">
                {createdByDetails?.display_name.includes("-intake") ? "Plane" : createdByDetails?.display_name}
              </span>
            </div>
          </SidebarPropertyListItem>
        )}

        <SidebarPropertyListItem icon={StartDatePropertyIcon} label={t("common.order_by.start_date")}>
          <DateDropdown
            value={issue.start_date}
            onChange={(val) =>
              issueOperations.update(workspaceSlug, projectId, issueId, {
                start_date: val ? renderFormattedPayloadDate(val) : null,
              })
            }
            placeholder={t("issue.add.start_date")}
            maxDate={maxDate ?? undefined}
            disabled={disabled}
            {...issueDetailPropertyDropdownProps}
            buttonClassName={cn(
              issueDetailPropertyDropdownProps.buttonClassName,
              issue?.start_date ? "text-primary" : "text-placeholder"
            )}
            hideIcon
            clearIconClassName="size-3 text-tertiary opacity-0 transition-opacity group-hover:opacity-100"
          />
        </SidebarPropertyListItem>

        <SidebarPropertyListItem icon={DueDatePropertyIcon} label={t("common.order_by.due_date")} layout="stacked">
          <div className="flex w-full flex-col items-start gap-1.5">
            <DateDropdown
              value={issue.target_date}
              onChange={(val) =>
                issueOperations.update(workspaceSlug, projectId, issueId, {
                  target_date: val ? renderFormattedPayloadDate(val) : null,
                })
              }
              placeholder={t("issue.add.due_date")}
              minDate={minDate ?? undefined}
              disabled={disabled}
              {...issueDetailPropertyDropdownProps}
              buttonClassName={cn(issueDetailPropertyDropdownProps.buttonClassName, {
                "text-placeholder": !issue.target_date,
                "text-danger-primary": shouldHighlightIssueDueDate(issue.target_date, stateDetails?.group),
              })}
              hideIcon
              clearIconClassName="size-3 text-tertiary opacity-0 transition-opacity group-hover:opacity-100"
            />
            {issue.target_date && <DateAlert date={issue.target_date ?? ""} workItem={issue} projectId={projectId} />}
          </div>
        </SidebarPropertyListItem>

        {isEstimateEnabled && (
          <SidebarPropertyListItem icon={EstimatePropertyIcon} label={t("common.estimate")}>
            <EstimateDropdown
              value={issue.estimate_point ?? undefined}
              onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { estimate_point: val })}
              projectId={projectId}
              disabled={disabled}
              {...issueDetailPropertyDropdownProps}
              buttonClassName={cn(
                issueDetailPropertyDropdownProps.buttonClassName,
                issue?.estimate_point !== undefined ? "text-primary" : "text-placeholder"
              )}
              placeholder={t("common.none")}
              hideIcon
              dropdownArrow
              dropdownArrowClassName={dropdownArrowClassName}
            />
          </SidebarPropertyListItem>
        )}

        {projectDetails?.module_view && (
          <SidebarPropertyListItem icon={ModuleIcon} label={t("common.modules")}>
            <IssueModuleSelect
              className="w-full grow"
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              issueOperations={issueOperations}
              disabled={disabled}
            />
          </SidebarPropertyListItem>
        )}

        {projectDetails?.cycle_view && (
          <SidebarPropertyListItem
            icon={CycleIcon}
            label={t("common.cycle")}
            appendElement={<TransferHopInfo workItem={issue} />}
          >
            <IssueCycleSelect
              className="min-h-6 w-full grow"
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              issueOperations={issueOperations}
              disabled={disabled}
            />
          </SidebarPropertyListItem>
        )}

        <SidebarPropertyListItem icon={ParentPropertyIcon} label={t("common.parent")}>
          <IssueParentSelectRoot
            className="min-h-6 w-full grow"
            disabled={disabled}
            issueId={issueId}
            issueOperations={issueOperations}
            projectId={projectId}
            workspaceSlug={workspaceSlug}
          />
        </SidebarPropertyListItem>

        <SidebarPropertyListItem icon={LabelPropertyIcon} label={t("common.labels")} layout="stacked">
          <IssueLabel workspaceSlug={workspaceSlug} projectId={projectId} issueId={issueId} disabled={disabled} />
        </SidebarPropertyListItem>

        <IssueWorklogProperty
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={issueId}
          disabled={disabled}
        />

        <WorkItemAdditionalSidebarProperties
          workItemId={issue.id}
          workItemTypeId={issue.type_id}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
          isEditable={!disabled}
          isPeekView
        />
      </div>
    </section>
  );
});
