import type { ReactNode, SyntheticEvent } from "react";
import { useCallback, useMemo } from "react";
import { xor } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// icons
import { Paperclip } from "lucide-react";
// i18n
import { useTranslation } from "@operis/i18n";
import { LinkIcon, StartDatePropertyIcon, ViewsIcon, DueDatePropertyIcon } from "@operis/propel/icons";
import { Tooltip } from "@operis/propel/tooltip";
import type { TIssue, IIssueDisplayProperties, TIssuePriorities } from "@operis/types";
import { EIssuesStoreType } from "@operis/types";
// ui
import {
  cn,
  getDate,
  renderFormattedPayloadDate,
  generateWorkItemLink,
  shouldHighlightIssueDueDate,
} from "@operis/utils";
// components
import { CycleDropdown } from "@/components/dropdowns/cycle";
import { DateDropdown } from "@/components/dropdowns/date";
import { DateRangeDropdown } from "@/components/dropdowns/date-range";
import { EstimateDropdown } from "@/components/dropdowns/estimate";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ModuleDropdown } from "@/components/dropdowns/module/dropdown";
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useIssues } from "@/hooks/store/use-issues";
import { useLabel } from "@/hooks/store/use-label";
import { useProject } from "@/hooks/store/use-project";
import { useProjectState } from "@/hooks/store/use-project-state";
import { useAppRouter } from "@/hooks/use-app-router";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import { useListGridColumnsContextOptional } from "../list/list-grid-columns-context";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { WorkItemLayoutAdditionalProperties } from "@/plane-web/components/issues/issue-layouts/additional-properties";
// local components
import { IssuePropertyLabels } from "./labels";
import {
  buildListPropertyColumns,
  buildListPropertyGridTemplateColumns,
  getListPropertyColumnMeta,
  type TListPropertyColumn,
} from "./list-property-columns";
import { ListPropertyGridCell } from "./list-property-grid-cell";
import { WithDisplayPropertiesHOC } from "./with-display-properties-HOC";

export type TIssuePropertiesLayoutVariant = "flex" | "list-grid";

export interface IIssueProperties {
  issue: TIssue;
  updateIssue: ((projectId: string | null, issueId: string, data: Partial<TIssue>) => Promise<void>) | undefined;
  displayProperties: IIssueDisplayProperties | undefined;
  isReadOnly: boolean;
  className: string;
  activeLayout: string;
  isEpic?: boolean;
  layoutVariant?: TIssuePropertiesLayoutVariant;
}

export const IssueProperties = observer(function IssueProperties(props: IIssueProperties) {
  const {
    issue,
    updateIssue,
    displayProperties,
    isReadOnly,
    className,
    isEpic = false,
    layoutVariant = "flex",
  } = props;
  // i18n
  const { t } = useTranslation();
  // store hooks
  const { getProjectById } = useProject();
  const { labelMap } = useLabel();
  const storeType = useIssueStoreType();
  const {
    issues: { changeModulesInIssue },
  } = useIssues(storeType);
  const {
    issues: { addCycleToIssue, removeCycleFromIssue },
  } = useIssues(storeType);
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const { getStateById } = useProjectState();
  const { isMobile } = usePlatformOS();
  const projectDetails = getProjectById(issue.project_id);

  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();

  // derived values
  const stateDetails = getStateById(issue.state_id);
  const subIssueCount = issue?.sub_issues_count ?? 0;

  const issueOperations = useMemo(
    () => ({
      addModulesToIssue: async (moduleIds: string[]) => {
        if (!workspaceSlug || !issue.project_id || !issue.id) return;
        await changeModulesInIssue?.(workspaceSlug.toString(), issue.project_id, issue.id, moduleIds, []);
      },
      removeModulesFromIssue: async (moduleIds: string[]) => {
        if (!workspaceSlug || !issue.project_id || !issue.id) return;
        await changeModulesInIssue?.(workspaceSlug.toString(), issue.project_id, issue.id, [], moduleIds);
      },
      addIssueToCycle: async (cycleId: string) => {
        if (!workspaceSlug || !issue.project_id || !issue.id) return;
        await addCycleToIssue?.(workspaceSlug.toString(), issue.project_id, cycleId, issue.id);
      },
      removeIssueFromCycle: async () => {
        if (!workspaceSlug || !issue.project_id || !issue.id) return;
        await removeCycleFromIssue?.(workspaceSlug.toString(), issue.project_id, issue.id);
      },
    }),
    [workspaceSlug, issue, changeModulesInIssue, addCycleToIssue, removeCycleFromIssue]
  );

  const handleState = async (stateId: string) => {
    if (updateIssue) await updateIssue(issue.project_id, issue.id, { state_id: stateId });
  };

  const handlePriority = async (value: TIssuePriorities) => {
    if (updateIssue) await updateIssue(issue.project_id, issue.id, { priority: value });
  };

  const handleLabel = async (ids: string[]) => {
    if (updateIssue) await updateIssue(issue.project_id, issue.id, { label_ids: ids });
  };

  const handleAssignee = async (ids: string[]) => {
    if (updateIssue) await updateIssue(issue.project_id, issue.id, { assignee_ids: ids });
  };

  const handleModule = useCallback(
    (moduleIds: string[] | null) => {
      if (!issue || !issue.module_ids || !moduleIds) return;

      const updatedModuleIds = xor(issue.module_ids, moduleIds);
      const modulesToAdd: string[] = [];
      const modulesToRemove: string[] = [];
      for (const moduleId of updatedModuleIds)
        if (issue.module_ids.includes(moduleId)) modulesToRemove.push(moduleId);
        else modulesToAdd.push(moduleId);
      if (modulesToAdd.length > 0) issueOperations.addModulesToIssue(modulesToAdd);
      if (modulesToRemove.length > 0) issueOperations.removeModulesFromIssue(modulesToRemove);
    },
    [issueOperations, issue]
  );

  const handleCycle = useCallback(
    (cycleId: string | null) => {
      if (!issue || issue.cycle_id === cycleId) return;
      if (cycleId) issueOperations.addIssueToCycle?.(cycleId);
      else issueOperations.removeIssueFromCycle?.();
    },
    [issue, issueOperations]
  );

  const handleStartDate = async (date: Date | null) => {
    if (updateIssue)
      await updateIssue(issue.project_id, issue.id, { start_date: date ? renderFormattedPayloadDate(date) : null });
  };

  const handleTargetDate = async (date: Date | null) => {
    if (updateIssue)
      await updateIssue(issue.project_id, issue.id, { target_date: date ? renderFormattedPayloadDate(date) : null });
  };

  const handleEstimate = async (value: string | undefined) => {
    if (updateIssue) await updateIssue(issue.project_id, issue.id, { estimate_point: value });
  };

  const workItemLink = generateWorkItemLink({
    workspaceSlug: workspaceSlug?.toString(),
    projectId: issue?.project_id,
    issueId: issue?.id,
    projectIdentifier: projectDetails?.identifier,
    sequenceId: issue?.sequence_id,
    isArchived: !!issue?.archived_at,
    isEpic,
  });

  const redirectToIssueDetail = () => router.push(`${workItemLink}#sub-issues`);

  if (!displayProperties || !issue.project_id) return null;

  // date range is enabled only when both dates are available and both dates are enabled
  const isDateRangeEnabled: boolean = Boolean(
    issue.start_date && issue.target_date && displayProperties.start_date && displayProperties.due_date
  );

  const defaultLabelOptions = issue?.label_ids?.map((id) => labelMap[id]) || [];

  const minDate = getDate(issue.start_date);
  const maxDate = getDate(issue.target_date);

  const handleEventPropagation = (e: SyntheticEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const listGridCtx = useListGridColumnsContextOptional();
  const isCrossProjectList = storeType === EIssuesStoreType.BOARD;

  const estimateEnabled = Boolean(
    issue.project_id && areEstimateEnabledByProjectId(issue.project_id)
  );

  const useListGrid = layoutVariant === "list-grid";

  const listColumns = useMemo(() => {
    if (!useListGrid) return null;

    if (listGridCtx) return listGridCtx.columns;

    return buildListPropertyColumns({
      displayProperties,
      isEpic,
      showModules: Boolean(projectDetails?.module_view),
      showCycles: Boolean(projectDetails?.cycle_view),
      showEstimate: estimateEnabled,
      crossProject: isCrossProjectList,
    });
  }, [useListGrid, listGridCtx, displayProperties, isEpic, projectDetails, estimateEnabled, isCrossProjectList]);

  const listGridStyle = useMemo(() => {
    if (!listColumns?.length) return undefined;

    return {
      display: "grid" as const,
      gridTemplateColumns: listGridCtx
        ? listGridCtx.propertyGridTemplateColumns
        : buildListPropertyGridTemplateColumns(listColumns, listGridCtx?.columnWidthsPx),
      columnGap: "0.75rem",
      alignItems: "center" as const,
      width: "100%",
    };
  }, [listColumns, listGridCtx]);

  const wrapListCell = (
    column: TListPropertyColumn,
    content: ReactNode,
    options?: { isEmpty?: boolean }
  ) => {
    if (layoutVariant !== "list-grid") return content;
    if (!listColumns?.includes(column)) return null;

    const { align } = getListPropertyColumnMeta(column);

    return (
      <ListPropertyGridCell isEmpty={options?.isEmpty} align={align}>
        {content}
      </ListPropertyGridCell>
    );
  };

  const propertyCells = (
    <>
      {/* basic properties */}
      {/* state */}
      {wrapListCell(
        "state",
        <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="state">
          <div
            className={cn("h-5 w-full min-w-0", layoutVariant === "list-grid" && "max-w-full")}
            onFocus={handleEventPropagation}
            onClick={handleEventPropagation}
          >
            <StateDropdown
              buttonContainerClassName={cn(
                "truncate",
                layoutVariant === "list-grid" ? "max-w-full w-full" : "max-w-40"
              )}
              value={issue.state_id}
              onChange={handleState}
              projectId={issue.project_id}
              disabled={isReadOnly}
              buttonVariant="border-with-text"
              renderByDefault={isMobile}
              showTooltip
            />
          </div>
        </WithDisplayPropertiesHOC>
      )}

      {/* priority */}
      {wrapListCell(
        "priority",
        <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="priority">
        <div className="h-5" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
          <PriorityDropdown
            value={issue?.priority}
            onChange={handlePriority}
            disabled={isReadOnly}
            buttonVariant="border-without-text"
            renderByDefault={isMobile}
            showTooltip
          />
        </div>
      </WithDisplayPropertiesHOC>
      )}

      {/* merged dates */}
      {wrapListCell(
        "dates",
        <>
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey={["start_date", "due_date"]}
        shouldRenderProperty={() => isDateRangeEnabled}
      >
        <div className="h-5" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
          <DateRangeDropdown
            value={{
              from: getDate(issue.start_date) || undefined,
              to: getDate(issue.target_date) || undefined,
            }}
            onSelect={(range) => {
              handleStartDate(range?.from ?? null);
              handleTargetDate(range?.to ?? null);
            }}
            hideIcon={{
              from: false,
            }}
            isClearable
            mergeDates
            buttonVariant={issue.start_date || issue.target_date ? "border-with-text" : "border-without-text"}
            buttonClassName={
              shouldHighlightIssueDueDate(issue.target_date, stateDetails?.group) ? "text-danger-primary" : ""
            }
            clearIconClassName="text-primary!"
            disabled={isReadOnly}
            renderByDefault={isMobile}
            showTooltip
            renderPlaceholder={false}
            customTooltipHeading="Date Range"
          />
        </div>
      </WithDisplayPropertiesHOC>

      {/* start date */}
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey="start_date"
        shouldRenderProperty={() => !isDateRangeEnabled}
      >
        <div className="h-5" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
          <DateDropdown
            value={issue.start_date ?? null}
            onChange={handleStartDate}
            maxDate={maxDate}
            placeholder={t("common.order_by.start_date")}
            icon={<StartDatePropertyIcon className="h-3 w-3 flex-shrink-0" />}
            buttonVariant={issue.start_date ? "border-with-text" : "border-without-text"}
            optionsClassName="z-10"
            disabled={isReadOnly}
            renderByDefault={isMobile}
            showTooltip
            labelClassName="text-caption-sm-regular"
          />
        </div>
      </WithDisplayPropertiesHOC>

      {/* target/due date */}
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey="due_date"
        shouldRenderProperty={() => !isDateRangeEnabled}
      >
        <div className="h-5" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
          <DateDropdown
            value={issue?.target_date ?? null}
            onChange={handleTargetDate}
            minDate={minDate}
            placeholder={t("common.order_by.due_date")}
            icon={<DueDatePropertyIcon className="h-3 w-3 shrink-0" />}
            buttonVariant={issue.target_date ? "border-with-text" : "border-without-text"}
            buttonClassName={
              shouldHighlightIssueDueDate(issue.target_date, stateDetails?.group) ? "text-danger-primary" : ""
            }
            clearIconClassName="text-primary!"
            optionsClassName="z-10"
            disabled={isReadOnly}
            renderByDefault={isMobile}
            showTooltip
            labelClassName="text-caption-sm-regular"
          />
        </div>
      </WithDisplayPropertiesHOC>
        </>,
        {
          isEmpty:
            !isDateRangeEnabled &&
            !issue.start_date &&
            !issue.target_date,
        }
      )}

      {/* assignee */}
      {wrapListCell(
        "assignee",
        <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="assignee">
        <div className="h-5" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
          <MemberDropdown
            projectId={issue?.project_id}
            value={issue?.assignee_ids}
            onChange={handleAssignee}
            disabled={isReadOnly}
            multiple
            buttonVariant={issue.assignee_ids?.length > 0 ? "transparent-without-text" : "border-without-text"}
            buttonClassName={issue.assignee_ids?.length > 0 ? "hover:bg-transparent px-0" : ""}
            showTooltip={issue?.assignee_ids?.length === 0}
            placeholder={t("common.assignees")}
            optionsClassName="z-10"
            tooltipContent=""
            renderByDefault={isMobile}
          />
        </div>
      </WithDisplayPropertiesHOC>
      )}

      {!isEpic &&
        wrapListCell(
          "modules",
          projectDetails?.module_view ? (
            <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="modules">
              <div
                className={cn("h-5 min-w-0 max-w-full overflow-hidden", useListGrid && "w-full")}
                onFocus={handleEventPropagation}
                onClick={handleEventPropagation}
              >
                <ModuleDropdown
                  buttonContainerClassName={cn("truncate", useListGrid ? "max-w-full w-full min-w-0" : "max-w-40")}
                  projectId={issue?.project_id}
                  value={issue?.module_ids ?? []}
                  onChange={handleModule}
                  disabled={isReadOnly}
                  renderByDefault={isMobile}
                  multiple
                  buttonVariant="border-with-text"
                  showCount
                  showTooltip
                />
              </div>
            </WithDisplayPropertiesHOC>
          ) : null,
          { isEmpty: !projectDetails?.module_view }
        )}

      {!isEpic &&
        wrapListCell(
          "cycle",
          projectDetails?.cycle_view ? (
            <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="cycle">
              <div
                className={cn("h-5 min-w-0 max-w-full overflow-hidden", useListGrid && "w-full")}
                onFocus={handleEventPropagation}
                onClick={handleEventPropagation}
              >
                <CycleDropdown
                  buttonContainerClassName={cn("truncate", useListGrid ? "max-w-full w-full min-w-0" : "max-w-40")}
                  projectId={issue?.project_id}
                  value={issue?.cycle_id}
                  onChange={handleCycle}
                  disabled={isReadOnly}
                  buttonVariant="border-with-text"
                  renderByDefault={isMobile}
                  showTooltip
                />
              </div>
            </WithDisplayPropertiesHOC>
          ) : null,
          { isEmpty: !projectDetails?.cycle_view }
        )}

      {wrapListCell(
        "estimate",
        estimateEnabled ? (
          <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="estimate">
            <div className="h-5" onFocus={handleEventPropagation} onClick={handleEventPropagation}>
              <EstimateDropdown
                value={issue.estimate_point ?? undefined}
                onChange={handleEstimate}
                projectId={issue.project_id}
                disabled={isReadOnly}
                buttonVariant="border-with-text"
                renderByDefault={isMobile}
                showTooltip
              />
            </div>
          </WithDisplayPropertiesHOC>
        ) : null,
        { isEmpty: !estimateEnabled }
      )}

      {/* extra render properties */}
      {/* sub-issues */}
      {!isEpic &&
        wrapListCell(
          "sub_issue_count",
        <WithDisplayPropertiesHOC
          displayProperties={displayProperties}
          displayPropertyKey="sub_issue_count"
          shouldRenderProperty={(properties) => !!properties.sub_issue_count && !!subIssueCount}
        >
          <Tooltip
            tooltipHeading={t("common.sub_work_items")}
            tooltipContent={`${subIssueCount}`}
            isMobile={isMobile}
            renderByDefault={false}
          >
            <div
              onFocus={handleEventPropagation}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (subIssueCount) redirectToIssueDetail();
              }}
              className={cn(
                "flex h-5 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded-sm border-[0.5px] border-strong px-2.5 py-1",
                {
                  "cursor-pointer hover:bg-layer-1": subIssueCount,
                }
              )}
            >
              <ViewsIcon className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
              <div className="text-caption-sm-regular">{subIssueCount}</div>
            </div>
          </Tooltip>
        </WithDisplayPropertiesHOC>,
          { isEmpty: !subIssueCount }
        )}

      {/* attachments */}
      {wrapListCell(
        "attachment_count",
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey="attachment_count"
        shouldRenderProperty={(properties) => !!properties.attachment_count && !!issue.attachment_count}
      >
        <Tooltip
          tooltipHeading={t("common.attachments")}
          tooltipContent={`${issue.attachment_count}`}
          isMobile={isMobile}
          renderByDefault={false}
        >
          <div
            className="flex h-5 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded-sm border-[0.5px] border-strong px-2.5 py-1"
            onFocus={handleEventPropagation}
            onClick={handleEventPropagation}
          >
            <Paperclip className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            <div className="text-caption-sm-regular">{issue.attachment_count}</div>
          </div>
        </Tooltip>
      </WithDisplayPropertiesHOC>,
        { isEmpty: !issue.attachment_count }
      )}

      {/* link */}
      {wrapListCell(
        "link",
      <WithDisplayPropertiesHOC
        displayProperties={displayProperties}
        displayPropertyKey="link"
        shouldRenderProperty={(properties) => !!properties.link && !!issue.link_count}
      >
        <Tooltip
          tooltipHeading={t("common.links")}
          tooltipContent={`${issue.link_count}`}
          isMobile={isMobile}
          renderByDefault={false}
        >
          <div
            className="flex h-5 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded-sm border-[0.5px] border-strong px-2.5 py-1"
            onFocus={handleEventPropagation}
            onClick={handleEventPropagation}
          >
            <LinkIcon className="h-3 w-3 flex-shrink-0" strokeWidth={2} />
            <div className="text-caption-sm-regular">{issue.link_count}</div>
          </div>
        </Tooltip>
      </WithDisplayPropertiesHOC>,
        { isEmpty: !issue.link_count }
      )}

      {/* label */}
      {wrapListCell(
        "labels",
      <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="labels">
        <IssuePropertyLabels
          projectId={issue?.project_id || null}
          value={issue?.label_ids || []}
          defaultOptions={defaultLabelOptions}
          onChange={handleLabel}
          disabled={isReadOnly}
          renderByDefault={isMobile}
          hideDropdownArrow
          maxRender={3}
        />
      </WithDisplayPropertiesHOC>
      )}

      {layoutVariant === "flex" && (
        <WorkItemLayoutAdditionalProperties displayProperties={displayProperties} issue={issue} />
      )}
    </>
  );

  return (
    <div className={cn(className, useListGrid && "w-full min-w-0")} style={listGridStyle}>
      {propertyCells}
    </div>
  );
});
