import { useState, type CSSProperties } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { ETabIndices, EUserPermissions, EUserPermissionsLevel } from "@operis/constants";
import { useTranslation } from "@operis/i18n";
import { ParentPropertyIcon } from "@operis/propel/icons";
// types
import type { IBoardCustomField, ISearchIssueResponse, TIssue, TStandardFieldKey } from "@operis/types";
// ui
import { CustomMenu } from "@operis/ui";
import { cn, getDate, renderFormattedPayloadDate, getTabIndex } from "@operis/utils";
// components
import { CycleDropdown } from "@/components/dropdowns/cycle";
import { DateDropdown } from "@/components/dropdowns/date";
import { EstimateDropdown } from "@/components/dropdowns/estimate";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
import { ModuleDropdown } from "@/components/dropdowns/module/dropdown";
import { PriorityDropdown } from "@/components/dropdowns/priority";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
import { ParentIssuesListModal } from "@/components/issues/parent-issues-list-modal";
import { IssueLabelSelect } from "@/components/issues/select";
// helpers
// hooks
import { useBoard } from "@/hooks/store/use-board";
import { useBoardCustomField } from "@/hooks/store/use-board-custom-field";
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web components
import { IssueIdentifier } from "@/plane-web/components/issues/issue-details/issue-identifier";
import {
  getIssueFormControlClass,
  issueFormControlBaseClass,
  IssueFormField,
} from "@/plane-web/components/issues/issue-modal/issue-form-field";
import { IssueModalAssigneeField } from "@/plane-web/components/issues/issue-modal/issue-modal-assignee-field";

type TIssueDefaultPropertiesProps = {
  control: Control<TIssue>;
  id: string | undefined;
  projectId: string | null;
  workspaceSlug: string;
  selectedParentIssue: ISearchIssueResponse | null;
  startDate: string | null;
  targetDate: string | null;
  parentId: string | null;
  isDraft: boolean;
  handleFormChange: () => void;
  setSelectedParentIssue: (issue: ISearchIssueResponse) => void;
  layout?: "compact" | "stacked" | "grid";
  /** Em layout stacked, o estado pode ser renderizado antes do resumo no formulário pai. */
  omitState?: boolean;
  /** Responsáveis renderizados no formulário pai (ex.: após descrição). */
  omitAssignee?: boolean;
  /** Quando true, não envolve em grelha — o pai fornece o container (ex.: com campos custom). */
  embeddedInGrid?: boolean;
};

export const IssueDefaultProperties = observer(function IssueDefaultProperties(props: TIssueDefaultPropertiesProps) {
  const {
    control,
    id,
    projectId,
    workspaceSlug,
    selectedParentIssue,
    startDate,
    targetDate,
    parentId,
    isDraft,
    handleFormChange,
    setSelectedParentIssue,
    layout = "compact",
    omitState = false,
    omitAssignee = false,
    embeddedInGrid = false,
  } = props;
  // states
  const [parentIssueListModalOpen, setParentIssueListModalOpen] = useState(false);
  // store hooks
  const { t } = useTranslation();
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const { getProjectById } = useProject();
  const { isMobile } = usePlatformOS();
  const { allowPermissions } = useUserPermissions();
  const { getEnabledStandardFieldKeys, getBoardCustomFields, fetchBoardCustomFields } = useBoardCustomField();
  const { getBoardById } = useBoard();
  // derived values
  const projectDetails = getProjectById(projectId);
  const board = projectDetails?.board_id ? getBoardById(projectDetails.board_id) : undefined;

  useSWR(
    workspaceSlug && board?.slug ? `BOARD_CUSTOM_FIELDS_${workspaceSlug}_${board.slug}` : null,
    () => fetchBoardCustomFields(workspaceSlug, board!.slug),
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  );
  const boardFields: IBoardCustomField[] =
    board?.slug && workspaceSlug
      ? getBoardCustomFields(workspaceSlug, board.slug).filter((f) => f.is_enabled)
      : [];
  const standardManifest = boardFields.filter((f) => f.is_system && f.standard_field_key);
  const enabledStandardKeys = projectId ? getEnabledStandardFieldKeys(projectId) : null;
  const isStandardFieldEnabled = (key: TStandardFieldKey) =>
    !enabledStandardKeys || enabledStandardKeys.includes(key);

  const getStandardMeta = (key: TStandardFieldKey) =>
    standardManifest.find((f) => f.standard_field_key === key);

  const shouldRenderStandard = (key: TStandardFieldKey) => {
    if (standardManifest.length > 0) return Boolean(getStandardMeta(key));
    return isStandardFieldEnabled(key);
  };

  const shouldRenderEstimate = () => {
    if (!projectId || !areEstimateEnabledByProjectId(projectId)) return false;
    return shouldRenderStandard("estimate_point");
  };

  const fieldGridClass = (field?: IBoardCustomField) =>
    cn(layout === "grid" && (field?.form_span ?? "half") === "full" && "sm:col-span-2");

  const fieldOrderStyle = (field?: IBoardCustomField): CSSProperties | undefined => {
    if (layout !== "grid" || boardFields.length === 0) return undefined;
    return { order: field?.sort_order ?? 9999 };
  };

  const { getIndex } = getTabIndex(ETabIndices.ISSUE_FORM, isMobile);

  const canCreateLabel =
    projectId && allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug, projectId);

  const minDate = getDate(startDate);
  minDate?.setDate(minDate.getDate());

  const maxDate = getDate(targetDate);
  maxDate?.setDate(maxDate.getDate());

  const dropdownProps = {
    buttonClassName: cn(issueFormControlBaseClass, "w-full"),
    buttonContainerClassName: "w-full",
    className: "w-full",
  };

  const renderStackedFields = () => (
    <>
        {!omitState && (
          <IssueFormField
            label={t("state")}
            controlWidth="compact"
            hint={!id ? t("issue_modal_initial_state_hint") : undefined}
          >
            <Controller
              control={control}
              name="state_id"
              render={({ field: { value, onChange } }) => (
                <StateDropdown
                  value={value}
                  onChange={(stateId) => {
                    onChange(stateId);
                    handleFormChange();
                  }}
                  projectId={projectId ?? undefined}
                  buttonVariant="border-with-text"
                  tabIndex={getIndex("state_id")}
                  isForWorkItemCreation={!id}
                  {...dropdownProps}
                />
              )}
            />
          </IssueFormField>
        )}
        {!omitAssignee && (
          <div className={layout === "grid" ? "sm:col-span-2" : undefined}>
            <IssueModalAssigneeField
              control={control}
              projectId={projectId}
              handleFormChange={handleFormChange}
              tabIndex={getIndex("assignee_ids")}
            />
          </div>
        )}
        {shouldRenderStandard("priority") && (
          <div
            className={fieldGridClass(getStandardMeta("priority"))}
            style={fieldOrderStyle(getStandardMeta("priority"))}
          >
          <IssueFormField label={t("priority")} controlWidth="medium">
            <Controller
              control={control}
              name="priority"
              render={({ field: { value, onChange } }) => (
                <PriorityDropdown
                  value={value}
                  onChange={(priority) => {
                    onChange(priority);
                    handleFormChange();
                  }}
                  buttonVariant="border-with-text"
                  tabIndex={getIndex("priority")}
                  {...dropdownProps}
                />
              )}
            />
          </IssueFormField>
          </div>
        )}
        {shouldRenderStandard("label_ids") && (
        <div
          className={fieldGridClass(getStandardMeta("label_ids"))}
          style={fieldOrderStyle(getStandardMeta("label_ids"))}
        >
        <IssueFormField label={t("labels")} controlWidth="medium">
          <Controller
            control={control}
            name="label_ids"
            render={({ field: { value, onChange } }) => (
              <IssueLabelSelect
                value={value}
                onChange={(labelIds) => {
                  onChange(labelIds);
                  handleFormChange();
                }}
                projectId={projectId ?? undefined}
                tabIndex={getIndex("label_ids")}
                createLabelEnabled={!!canCreateLabel}
                buttonClassName={getIssueFormControlClass("medium")}
                buttonContainerClassName="w-full"
              />
            )}
          />
        </IssueFormField>
        </div>
        )}
        {shouldRenderStandard("start_date") && (
        <div
          className={fieldGridClass(getStandardMeta("start_date"))}
          style={fieldOrderStyle(getStandardMeta("start_date"))}
        >
        <IssueFormField label={t("start_date")} controlWidth="medium">
          <Controller
            control={control}
            name="start_date"
            render={({ field: { value, onChange } }) => (
              <DateDropdown
                value={value}
                onChange={(date) => {
                  onChange(date ? renderFormattedPayloadDate(date) : null);
                  handleFormChange();
                }}
                buttonVariant="border-with-text"
                maxDate={maxDate ?? undefined}
                placeholder={t("start_date")}
                tabIndex={getIndex("start_date")}
                {...dropdownProps}
              />
            )}
          />
        </IssueFormField>
        </div>
        )}
        {shouldRenderStandard("target_date") && (
        <div
          className={fieldGridClass(getStandardMeta("target_date"))}
          style={fieldOrderStyle(getStandardMeta("target_date"))}
        >
        <IssueFormField label={t("due_date")} controlWidth="medium">
          <Controller
            control={control}
            name="target_date"
            render={({ field: { value, onChange } }) => (
              <DateDropdown
                value={value}
                onChange={(date) => {
                  onChange(date ? renderFormattedPayloadDate(date) : null);
                  handleFormChange();
                }}
                buttonVariant="border-with-text"
                minDate={minDate ?? undefined}
                placeholder={t("due_date")}
                tabIndex={getIndex("target_date")}
                {...dropdownProps}
              />
            )}
          />
        </IssueFormField>
        </div>
        )}
        {projectDetails?.cycle_view && shouldRenderStandard("cycle_id") && (
          <div
            className={fieldGridClass(getStandardMeta("cycle_id"))}
            style={fieldOrderStyle(getStandardMeta("cycle_id"))}
          >
          <IssueFormField label={t("cycle.label", { count: 1 })} controlWidth="medium">
            <Controller
              control={control}
              name="cycle_id"
              render={({ field: { value, onChange } }) => (
                <CycleDropdown
                  projectId={projectId ?? undefined}
                  onChange={(cycleId) => {
                    onChange(cycleId);
                    handleFormChange();
                  }}
                  placeholder={t("cycle.label", { count: 1 })}
                  value={value}
                  buttonVariant="border-with-text"
                  tabIndex={getIndex("cycle_id")}
                  {...dropdownProps}
                />
              )}
            />
          </IssueFormField>
          </div>
        )}
        {projectDetails?.module_view && workspaceSlug && shouldRenderStandard("module_ids") && (
          <div className={fieldGridClass(getStandardMeta("module_ids"))}>
          <IssueFormField label={t("modules")} controlWidth="medium">
            <Controller
              control={control}
              name="module_ids"
              render={({ field: { value, onChange } }) => (
                <ModuleDropdown
                  projectId={projectId ?? undefined}
                  value={value ?? []}
                  onChange={(moduleIds) => {
                    onChange(moduleIds);
                    handleFormChange();
                  }}
                  placeholder={t("modules")}
                  buttonVariant="border-with-text"
                  tabIndex={getIndex("module_ids")}
                  multiple
                  showCount
                  {...dropdownProps}
                />
              )}
            />
          </IssueFormField>
          </div>
        )}
        {shouldRenderEstimate() && (
          <div
            className={fieldGridClass(getStandardMeta("estimate_point"))}
            style={fieldOrderStyle(getStandardMeta("estimate_point"))}
          >
            <IssueFormField
              label={t("boards.settings.fields.standard_fields.estimate_point")}
              controlWidth="medium"
            >
              <Controller
                control={control}
                name="estimate_point"
                render={({ field: { value, onChange } }) => (
                  <EstimateDropdown
                    value={value || undefined}
                    onChange={(estimatePoint) => {
                      onChange(estimatePoint);
                      handleFormChange();
                    }}
                    projectId={projectId ?? undefined}
                    buttonVariant="border-with-text"
                    tabIndex={getIndex("estimate_point")}
                    placeholder={t("estimate")}
                    {...dropdownProps}
                  />
                )}
              />
            </IssueFormField>
          </div>
        )}
        {shouldRenderStandard("parent_id") && (
          <>
        <div
          className={fieldGridClass(getStandardMeta("parent_id"))}
          style={fieldOrderStyle(getStandardMeta("parent_id"))}
        >
        <IssueFormField label={t("add_parent")} controlWidth="medium">
          <div>
            {parentId ? (
              <CustomMenu
                customButton={
                  <button
                    type="button"
                    className={cn(
                      issueFormControlBaseClass,
                      "flex w-full cursor-pointer items-center justify-between gap-1 text-left"
                    )}
                  >
                    {selectedParentIssue?.project_id && (
                      <IssueIdentifier
                        projectId={selectedParentIssue.project_id}
                        issueTypeId={selectedParentIssue.type_id}
                        projectIdentifier={selectedParentIssue?.project__identifier}
                        issueSequenceId={selectedParentIssue.sequence_id}
                        size="xs"
                      />
                    )}
                  </button>
                }
                placement="bottom-start"
                className="w-full"
                customButtonClassName="w-full"
                tabIndex={getIndex("parent_id")}
              >
                <>
                  <CustomMenu.MenuItem className="!p-1" onClick={() => setParentIssueListModalOpen(true)}>
                    {t("change_parent_issue")}
                  </CustomMenu.MenuItem>
                  <Controller
                    control={control}
                    name="parent_id"
                    render={({ field: { onChange } }) => (
                      <CustomMenu.MenuItem
                        className="!p-1"
                        onClick={() => {
                          onChange(null);
                          handleFormChange();
                        }}
                      >
                        {t("remove_parent_issue")}
                      </CustomMenu.MenuItem>
                    )}
                  />
                </>
              </CustomMenu>
            ) : (
              <button
                type="button"
                className={cn(
                  issueFormControlBaseClass,
                  "flex w-full cursor-pointer items-center gap-2 text-13 text-tertiary"
                )}
                onClick={() => setParentIssueListModalOpen(true)}
              >
                <ParentPropertyIcon className="size-4 shrink-0" />
                <span>{t("add_parent")}</span>
              </button>
            )}
          </div>
        </IssueFormField>
        </div>
        <Controller
          control={control}
          name="parent_id"
          render={({ field: { onChange } }) => (
            <ParentIssuesListModal
              isOpen={parentIssueListModalOpen}
              handleClose={() => setParentIssueListModalOpen(false)}
              onChange={(issue) => {
                onChange(issue.id);
                handleFormChange();
                setSelectedParentIssue(issue);
              }}
              projectId={projectId ?? undefined}
              issueId={isDraft ? undefined : id}
            />
          )}
        />
          </>
        )}
    </>
  );

  if (layout === "stacked" || layout === "grid") {
    const body = renderStackedFields();
    if (embeddedInGrid) return <>{body}</>;
    return (
      <div className={cn(layout === "grid" ? "grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2" : "space-y-4")}>
        {body}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Controller
        control={control}
        name="state_id"
        render={({ field: { value, onChange } }) => (
          <div className="h-7">
            <StateDropdown
              value={value}
              onChange={(stateId) => {
                onChange(stateId);
                handleFormChange();
              }}
              projectId={projectId ?? undefined}
              buttonVariant="border-with-text"
              tabIndex={getIndex("state_id")}
              isForWorkItemCreation={!id}
            />
          </div>
        )}
      />
      <Controller
        control={control}
        name="priority"
        render={({ field: { value, onChange } }) => (
          <div className="h-7">
            <PriorityDropdown
              value={value}
              onChange={(priority) => {
                onChange(priority);
                handleFormChange();
              }}
              buttonVariant="border-with-text"
              tabIndex={getIndex("priority")}
            />
          </div>
        )}
      />
      <Controller
        control={control}
        name="assignee_ids"
        render={({ field: { value, onChange } }) => (
          <div className="h-7">
            <MemberDropdown
              projectId={projectId ?? undefined}
              value={value}
              onChange={(assigneeIds) => {
                onChange(assigneeIds);
                handleFormChange();
              }}
              buttonVariant={value?.length > 0 ? "transparent-without-text" : "border-with-text"}
              buttonClassName={value?.length > 0 ? "hover:bg-transparent" : ""}
              placeholder={t("assignees")}
              multiple
              tabIndex={getIndex("assignee_ids")}
            />
          </div>
        )}
      />
      <Controller
        control={control}
        name="label_ids"
        render={({ field: { value, onChange } }) => (
          <div className="h-7">
            <IssueLabelSelect
              value={value}
              onChange={(labelIds) => {
                onChange(labelIds);
                handleFormChange();
              }}
              projectId={projectId ?? undefined}
              tabIndex={getIndex("label_ids")}
              createLabelEnabled={!!canCreateLabel}
            />
          </div>
        )}
      />
      <Controller
        control={control}
        name="start_date"
        render={({ field: { value, onChange } }) => (
          <div className="h-7">
            <DateDropdown
              value={value}
              onChange={(date) => {
                onChange(date ? renderFormattedPayloadDate(date) : null);
                handleFormChange();
              }}
              buttonVariant="border-with-text"
              maxDate={maxDate ?? undefined}
              placeholder={t("start_date")}
              tabIndex={getIndex("start_date")}
            />
          </div>
        )}
      />
      <Controller
        control={control}
        name="target_date"
        render={({ field: { value, onChange } }) => (
          <div className="h-7">
            <DateDropdown
              value={value}
              onChange={(date) => {
                onChange(date ? renderFormattedPayloadDate(date) : null);
                handleFormChange();
              }}
              buttonVariant="border-with-text"
              minDate={minDate ?? undefined}
              placeholder={t("due_date")}
              tabIndex={getIndex("target_date")}
            />
          </div>
        )}
      />
      {projectDetails?.cycle_view && (
        <Controller
          control={control}
          name="cycle_id"
          render={({ field: { value, onChange } }) => (
            <div className="h-7">
              <CycleDropdown
                projectId={projectId ?? undefined}
                onChange={(cycleId) => {
                  onChange(cycleId);
                  handleFormChange();
                }}
                placeholder={t("cycle.label", { count: 1 })}
                value={value}
                buttonVariant="border-with-text"
                tabIndex={getIndex("cycle_id")}
              />
            </div>
          )}
        />
      )}
      {projectDetails?.module_view && workspaceSlug && (
        <Controller
          control={control}
          name="module_ids"
          render={({ field: { value, onChange } }) => (
            <div className="h-7">
              <ModuleDropdown
                projectId={projectId ?? undefined}
                value={value ?? []}
                onChange={(moduleIds) => {
                  onChange(moduleIds);
                  handleFormChange();
                }}
                placeholder={t("modules")}
                buttonVariant="border-with-text"
                tabIndex={getIndex("module_ids")}
                multiple
                showCount
              />
            </div>
          )}
        />
      )}
      {shouldRenderEstimate() && (
        <Controller
          control={control}
          name="estimate_point"
          render={({ field: { value, onChange } }) => (
            <div className="h-7">
              <EstimateDropdown
                value={value || undefined}
                onChange={(estimatePoint) => {
                  onChange(estimatePoint);
                  handleFormChange();
                }}
                projectId={projectId ?? undefined}
                buttonVariant="border-with-text"
                tabIndex={getIndex("estimate_point")}
                placeholder={t("estimate")}
              />
            </div>
          )}
        />
      )}
      <div className="h-7">
        {parentId ? (
          <CustomMenu
            customButton={
              <button
                type="button"
                className="flex h-full cursor-pointer items-center justify-between gap-1 rounded-sm border-[0.5px] border-strong px-2 py-0.5 text-caption-sm-regular hover:bg-layer-1"
              >
                {selectedParentIssue?.project_id && (
                  <IssueIdentifier
                    projectId={selectedParentIssue.project_id}
                    issueTypeId={selectedParentIssue.type_id}
                    projectIdentifier={selectedParentIssue?.project__identifier}
                    issueSequenceId={selectedParentIssue.sequence_id}
                    size="xs"
                  />
                )}
              </button>
            }
            placement="bottom-start"
            className="h-full w-full"
            customButtonClassName="h-full"
            tabIndex={getIndex("parent_id")}
          >
            <>
              <CustomMenu.MenuItem className="!p-1" onClick={() => setParentIssueListModalOpen(true)}>
                {t("change_parent_issue")}
              </CustomMenu.MenuItem>
              <Controller
                control={control}
                name="parent_id"
                render={({ field: { onChange } }) => (
                  <CustomMenu.MenuItem
                    className="!p-1"
                    onClick={() => {
                      onChange(null);
                      handleFormChange();
                    }}
                  >
                    {t("remove_parent_issue")}
                  </CustomMenu.MenuItem>
                )}
              />
            </>
          </CustomMenu>
        ) : (
          <button
            type="button"
            className="flex h-full cursor-pointer items-center justify-between gap-1 rounded-sm border-[0.5px] border-strong px-2 py-0.5 text-caption-sm-regular hover:bg-layer-1"
            onClick={() => setParentIssueListModalOpen(true)}
          >
            <ParentPropertyIcon className="h-3 w-3 flex-shrink-0" />
            <span className="whitespace-nowrap">{t("add_parent")}</span>
          </button>
        )}
      </div>
      <Controller
        control={control}
        name="parent_id"
        render={({ field: { onChange } }) => (
          <ParentIssuesListModal
            isOpen={parentIssueListModalOpen}
            handleClose={() => setParentIssueListModalOpen(false)}
            onChange={(issue) => {
              onChange(issue.id);
              handleFormChange();
              setSelectedParentIssue(issue);
            }}
            projectId={projectId ?? undefined}
            issueId={isDraft ? undefined : id}
          />
        )}
      />
    </div>
  );
});
