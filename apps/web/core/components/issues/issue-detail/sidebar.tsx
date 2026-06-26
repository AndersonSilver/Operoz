import { observer } from "mobx-react";
import {
  CalendarClock,
  CalendarDays,
  Flag,
  Gauge,
  GitBranch,
  Info,
  Layers,
  PanelRight,
  RotateCw,
  Tags,
  Type,
  User,
  Users,
} from "lucide-react";
import { useTranslation } from "@operis/i18n";
import {
  cn,
  getDate,
  renderFormattedDateLong,
  renderFormattedPayloadDate,
  renderFormattedTime,
  shouldHighlightIssueDueDate,
} from "@operis/utils";
import { DateDropdown } from "@/components/dropdowns/date";
import { EstimateDropdown } from "@/components/dropdowns/estimate";
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { WorkItemAdditionalSidebarProperties } from "@/plane-web/components/issues/issue-details/additional-properties";
import { IssueParentSelectRoot } from "@/plane-web/components/issues/issue-details/parent-select-root";
import { DateAlert } from "@/plane-web/components/issues/issue-details/sidebar/date-alert";
import { TransferHopInfo } from "@/plane-web/components/issues/issue-details/sidebar/transfer-hop-info";
import { IssueWorklogProperty } from "@/plane-web/components/issues/worklog/property";
import { IssueCycleSelect } from "./cycle-select";
import { IssueLabel } from "./label";
import { IssueModuleSelect } from "./module-select";
import { IssueTypeSelect } from "./issue-type-select";
import {
  IssueDetailPropertyGroup,
  IssueDetailPropertyRow,
  IssueDetailSidebarAccordion,
} from "./sidebar-property-field";
import type { TIssueOperations } from "./root";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  isEditable: boolean;
};

const jiraDropdownProps = {
  buttonVariant: "transparent-with-text" as const,
  className: "group w-full",
  buttonContainerClassName: "w-full text-left",
  buttonClassName: "h-auto min-h-0 justify-start px-0 py-0.5 text-13 text-primary",
};

export const IssueDetailsSidebar = observer(function IssueDetailsSidebar(props: Props) {
  const { t } = useTranslation();
  const { workspaceSlug, projectId, issueId, issueOperations, isEditable } = props;
  const { getProjectById } = useProject();
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { getUserDetails } = useMember();
  const { getStateById } = useProjectState();
  const issue = getIssueById(issueId);
  if (!issue) return <></>;

  const createdByDetails = getUserDetails(issue.created_by);
  const projectDetails = getProjectById(issue.project_id);
  const stateDetails = getStateById(issue.state_id);
  const stateColor = stateDetails?.color ?? "var(--text-color-tertiary)";

  const minDate = issue.start_date ? getDate(issue.start_date) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = issue.target_date ? getDate(issue.target_date) : null;
  maxDate?.setDate(maxDate.getDate());

  const createdFooterLabel =
    issue.created_at &&
    t("issue_detail_created_footer", {
      date: renderFormattedDateLong(issue.created_at) ?? "",
      time: renderFormattedTime(issue.created_at),
    });

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-layer-1">
      <div className={cn("shrink-0 px-3.5 pt-4 pb-3.5", !isEditable && "opacity-60")}>
        <p className="tracking-widest mb-2 flex items-center gap-1.5 px-0.5 text-10 font-semibold text-tertiary uppercase">
          <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: stateColor }} />
          {t("common.state")}
        </p>
        <div
          className="relative overflow-hidden rounded-xl"
          style={{
            backgroundColor: `color-mix(in srgb, ${stateColor} 14%, var(--background-color-layer-1))`,
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${stateColor} 32%, transparent), 0 2px 6px color-mix(in srgb, ${stateColor} 14%, transparent)`,
          }}
        >
          <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: stateColor }} />
          <StateDropdown
            value={issue?.state_id}
            onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { state_id: val })}
            projectId={projectId?.toString() ?? ""}
            disabled={!isEditable}
            buttonVariant="transparent-with-text"
            className="w-full"
            buttonContainerClassName="w-full"
            buttonClassName="w-full justify-between gap-2 pl-4 pr-3.5 py-3 text-12 font-bold tracking-widest text-primary uppercase"
            iconSize="size-3.5"
            dropdownArrow
            dropdownArrowClassName="size-3.5 shrink-0 text-tertiary"
          />
        </div>
      </div>

      <div className={cn("flex-1 space-y-2.5 overflow-y-auto px-3.5 py-3", !isEditable && "opacity-60")}>
        <IssueDetailSidebarAccordion icon={Info} title={t("issue_detail_section_information")}>
          <IssueDetailPropertyGroup title={t("issue_detail_section_people")}>
            <IssueDetailPropertyRow icon={Users} label={t("common.assignees")}>
              <MemberDropdown
                value={issue?.assignee_ids ?? undefined}
                onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { assignee_ids: val })}
                disabled={!isEditable}
                projectId={projectId?.toString() ?? ""}
                placeholder={t("issue.add.assignee")}
                multiple
                {...jiraDropdownProps}
                buttonVariant={issue?.assignee_ids?.length > 1 ? "transparent-without-text" : "transparent-with-text"}
                buttonClassName={cn(
                  jiraDropdownProps.buttonClassName,
                  issue?.assignee_ids?.length > 0 ? "text-primary" : "text-placeholder"
                )}
                hideIcon={issue.assignee_ids?.length === 0}
                dropdownArrow
                dropdownArrowClassName="size-3.5 text-tertiary opacity-0 transition-opacity group-hover:opacity-100"
              />
            </IssueDetailPropertyRow>

            {createdByDetails && (
              <IssueDetailPropertyRow icon={User} label={t("common.created_by")}>
                <div className="flex items-center gap-2">
                  <ButtonAvatars showTooltip userIds={createdByDetails.id} />
                  <span className="truncate text-13 text-primary">{createdByDetails.display_name}</span>
                </div>
              </IssueDetailPropertyRow>
            )}
          </IssueDetailPropertyGroup>

          <IssueDetailPropertyGroup title={t("issue_detail_section_workflow")} withTopBorder>
            <IssueDetailPropertyRow icon={Type} label={t("issue_modal_type_label")}>
              <IssueTypeSelect
                className="min-h-6 w-full"
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                issueOperations={issueOperations}
                disabled={!isEditable}
              />
            </IssueDetailPropertyRow>

            <IssueDetailPropertyRow icon={Flag} label={t("common.priority")}>
              <PriorityDropdown
                value={issue?.priority}
                onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { priority: val })}
                disabled={!isEditable}
                {...jiraDropdownProps}
                buttonClassName={cn(jiraDropdownProps.buttonClassName, "px-0 [&_svg]:size-3.5")}
              />
            </IssueDetailPropertyRow>
          </IssueDetailPropertyGroup>

          <IssueDetailPropertyGroup title={t("issue_detail_section_dates")} withTopBorder>
            <IssueDetailPropertyRow icon={CalendarDays} label={t("common.order_by.start_date")}>
              <DateDropdown
                placeholder={t("common.none")}
                value={issue.start_date}
                onChange={(val) =>
                  issueOperations.update(workspaceSlug, projectId, issueId, {
                    start_date: val ? renderFormattedPayloadDate(val) : null,
                  })
                }
                maxDate={maxDate ?? undefined}
                disabled={!isEditable}
                {...jiraDropdownProps}
                buttonClassName={cn(
                  jiraDropdownProps.buttonClassName,
                  issue?.start_date ? "text-primary" : "text-placeholder"
                )}
                hideIcon
                clearIconClassName="size-3 text-tertiary opacity-0 transition-opacity group-hover:opacity-100"
              />
            </IssueDetailPropertyRow>

            <IssueDetailPropertyRow icon={CalendarClock} label={t("common.order_by.due_date")}>
              <div className="flex w-full flex-col items-start gap-1.5">
                <DateDropdown
                  placeholder={t("common.none")}
                  value={issue.target_date}
                  onChange={(val) =>
                    issueOperations.update(workspaceSlug, projectId, issueId, {
                      target_date: val ? renderFormattedPayloadDate(val) : null,
                    })
                  }
                  minDate={minDate ?? undefined}
                  disabled={!isEditable}
                  {...jiraDropdownProps}
                  buttonClassName={cn(jiraDropdownProps.buttonClassName, {
                    "text-placeholder": !issue.target_date,
                    "text-danger-primary": shouldHighlightIssueDueDate(issue.target_date, stateDetails?.group),
                  })}
                  hideIcon
                  clearIconClassName="size-3 text-tertiary opacity-0 transition-opacity group-hover:opacity-100"
                />
                {issue.target_date && (
                  <DateAlert date={issue.target_date ?? ""} workItem={issue} projectId={projectId} />
                )}
              </div>
            </IssueDetailPropertyRow>

            {projectId && areEstimateEnabledByProjectId(projectId) && (
              <IssueDetailPropertyRow icon={Gauge} label={t("common.estimate")}>
                <EstimateDropdown
                  value={issue?.estimate_point ?? undefined}
                  onChange={(val: string | undefined) =>
                    issueOperations.update(workspaceSlug, projectId, issueId, { estimate_point: val })
                  }
                  projectId={projectId}
                  disabled={!isEditable}
                  {...jiraDropdownProps}
                  buttonClassName={cn(
                    jiraDropdownProps.buttonClassName,
                    issue?.estimate_point !== null ? "text-primary" : "text-placeholder"
                  )}
                  placeholder={t("common.none")}
                  hideIcon
                  dropdownArrow
                  dropdownArrowClassName="size-3.5 text-tertiary opacity-0 transition-opacity group-hover:opacity-100"
                />
              </IssueDetailPropertyRow>
            )}
          </IssueDetailPropertyGroup>
        </IssueDetailSidebarAccordion>

        <IssueDetailSidebarAccordion icon={PanelRight} title={t("issue_detail_section_context")} defaultOpen>
          <div className="flex flex-col px-2 pb-2">
            {projectDetails?.module_view && (
              <IssueDetailPropertyRow icon={Layers} label={t("common.modules")}>
                <IssueModuleSelect
                  className="w-full"
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  issueId={issueId}
                  issueOperations={issueOperations}
                  disabled={!isEditable}
                />
              </IssueDetailPropertyRow>
            )}

            {projectDetails?.cycle_view && (
              <IssueDetailPropertyRow
                icon={RotateCw}
                label={t("common.cycle")}
                appendElement={<TransferHopInfo workItem={issue} />}
              >
                <IssueCycleSelect
                  className="min-h-6 w-full"
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  issueId={issueId}
                  issueOperations={issueOperations}
                  disabled={!isEditable}
                />
              </IssueDetailPropertyRow>
            )}

            <IssueDetailPropertyRow icon={GitBranch} label={t("common.parent")}>
              <IssueParentSelectRoot
                className="min-h-6 w-full"
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                issueOperations={issueOperations}
                disabled={!isEditable}
              />
            </IssueDetailPropertyRow>

            <IssueDetailPropertyRow icon={Tags} label={t("common.labels")}>
              <IssueLabel
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={issueId}
                disabled={!isEditable}
              />
            </IssueDetailPropertyRow>

            <IssueWorklogProperty
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              disabled={!isEditable}
            />

            <WorkItemAdditionalSidebarProperties
              workItemId={issue.id}
              workItemTypeId={issue.type_id}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
              isEditable={isEditable}
            />
          </div>
        </IssueDetailSidebarAccordion>
      </div>

      {createdFooterLabel && (
        <div className="shrink-0 border-t border-subtle bg-surface-1 px-3.5 py-3 text-11 leading-relaxed text-tertiary">
          {createdFooterLabel}
        </div>
      )}
    </div>
  );
});
