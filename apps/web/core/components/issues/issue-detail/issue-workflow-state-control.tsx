import { useCallback, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { ArrowRight } from "lucide-react";
import useSWR from "swr";
import { useTranslation } from "@operoz/i18n";
import { ChevronDownIcon, StateGroupIcon } from "@operoz/propel/icons";
import { TOAST_TYPE, setToast } from "@operoz/propel/toast";
import type { IIssueTransition, TTransitionExecutePayload } from "@operoz/types";
import { CustomMenu, Spinner } from "@operoz/ui";
import { cn } from "@operoz/utils";
import { StateDropdown } from "@/components/dropdowns/state/dropdown";
import type { TWorkItemStateDropdownBaseProps } from "@/components/dropdowns/state/base";
import { getLocalizedStateName, getLocalizedTransitionName } from "@/components/project-states/state-display.utils";
import { useWorkflow } from "@/hooks/store/use-workflow";
import { useProjectState } from "@/hooks/store/use-project-state";
import { IssueTransitionScreenModal } from "./issue-transition-screen-modal";

type StateDropdownProps = Omit<
  TWorkItemStateDropdownBaseProps,
  "getStateById" | "onDropdownOpen" | "isInitializing" | "stateIds"
> & {
  stateIds?: string[];
};

type Props = StateDropdownProps & {
  workspaceSlug: string;
  issueId: string;
  variant?: "sidebar" | "compact";
};

function issueTransitionsCacheKey(projectId: string, issueId: string) {
  return `${projectId}:${issueId}`;
}

function transitionNeedsScreen(transition: IIssueTransition) {
  return (transition.screen?.fields?.length ?? 0) > 0;
}

export const IssueWorkflowStateControl = observer(function IssueWorkflowStateControl(props: Props) {
  const {
    workspaceSlug,
    projectId,
    issueId,
    value,
    onChange,
    variant = "compact",
    disabled = false,
    ...stateDropdownProps
  } = props;
  const { t } = useTranslation();
  const { getStateById } = useProjectState();
  const {
    fetchIssueTransitions,
    executeTransition,
    transitionsByIssue,
    workflowConfiguredByIssue,
    fetchedIssueTransitionsMap,
  } = useWorkflow();

  const cacheKey = issueTransitionsCacheKey(projectId ?? "", issueId);
  const [pendingTransition, setPendingTransition] = useState<IIssueTransition | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useSWR(workspaceSlug && projectId && issueId ? `ISSUE_WORKFLOW_TRANSITIONS_${cacheKey}` : null, () =>
    fetchIssueTransitions(workspaceSlug, projectId ?? "", issueId)
  );

  const transitions = transitionsByIssue[cacheKey] ?? [];
  const workflowConfigured = workflowConfiguredByIssue[cacheKey] === true;
  const isInitialLoading = fetchedIssueTransitionsMap[cacheKey] !== true && transitions.length === 0;

  const currentState = getStateById(value);
  const localizedCurrentStateName = currentState ? getLocalizedStateName(currentState, t) : t("common.none");

  const runExecute = useCallback(
    async (transition: IIssueTransition, payload: TTransitionExecutePayload = {}) => {
      setIsExecuting(true);
      try {
        await executeTransition(workspaceSlug, projectId ?? "", issueId, transition.id, payload);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("workflow.execute.success"),
          message: getLocalizedTransitionName(transition.name, transition.to_state_name, transition.to_state_group, t),
        });
      } catch (error: unknown) {
        const apiError = error as { error?: string; message?: string; fields?: string[] };
        if (apiError?.error === "condition_not_satisfied") {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("workflow.execute.error.condition"),
            message: apiError.message ?? t("workflow.execute.error.generic"),
          });
        } else if (apiError?.error === "validation_failed") {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("workflow.execute.error.validation"),
            message: Array.isArray(apiError.fields) ? apiError.fields.join(", ") : t("workflow.execute.error.generic"),
          });
        } else if (apiError?.error === "concurrent_state_change") {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("workflow.execute.error.concurrent"),
            message: t("workflow.execute.error.generic"),
          });
        } else {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("common.error.label"),
            message: t("workflow.execute.error.generic"),
          });
        }
        throw error;
      } finally {
        setIsExecuting(false);
      }
    },
    [executeTransition, workspaceSlug, projectId, issueId, t]
  );

  const handleTransitionPick = useCallback(
    async (transition: IIssueTransition) => {
      if (disabled || isExecuting) return;
      if (transitionNeedsScreen(transition)) {
        setPendingTransition(transition);
        return;
      }
      await runExecute(transition);
    },
    [disabled, isExecuting, runExecute]
  );

  const menuButtonClassName = useMemo(
    () =>
      cn(
        "flex w-full items-center gap-2 text-left",
        variant === "sidebar"
          ? "tracking-widest w-full justify-between gap-2 py-3 pr-3.5 pl-4 text-12 font-bold text-primary uppercase"
          : "h-auto min-h-0 justify-start px-0 py-0.5 text-13 text-primary",
        disabled || isExecuting ? "cursor-not-allowed opacity-60" : "hover:bg-layer-transparent-hover"
      ),
    [variant, disabled, isExecuting]
  );

  if (isInitialLoading) {
    return (
      <div className={cn("flex w-full items-center justify-center py-2", variant === "sidebar" && "py-3")}>
        <Spinner height="20px" width="20px" />
      </div>
    );
  }

  if (!workflowConfigured) {
    return (
      <StateDropdown
        {...stateDropdownProps}
        projectId={projectId}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }

  if (transitions.length === 0) {
    return (
      <button
        type="button"
        className={cn(menuButtonClassName, "cursor-default opacity-80")}
        disabled
        title={t("workflow.no_transitions_available")}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <StateGroupIcon
            stateGroup={currentState?.group ?? "backlog"}
            color={currentState?.color}
            className="size-3.5 shrink-0"
          />
          <span className="truncate">{localizedCurrentStateName}</span>
        </span>
        <span className="text-11 text-tertiary">{t("workflow.no_transitions_available")}</span>
      </button>
    );
  }

  return (
    <>
      <CustomMenu
        className="w-full"
        placement="bottom-start"
        closeOnSelect
        disabled={disabled || isExecuting}
        customButton={
          <button type="button" className={menuButtonClassName} disabled={disabled || isExecuting}>
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <StateGroupIcon
                stateGroup={currentState?.group ?? "backlog"}
                color={currentState?.color}
                className="size-3.5 shrink-0"
              />
              <span className="truncate">{localizedCurrentStateName}</span>
            </span>
            <ChevronDownIcon className="size-3.5 shrink-0 text-tertiary" />
          </button>
        }
      >
        {transitions.map((transition) => (
          <CustomMenu.MenuItem
            key={transition.id}
            className="flex items-center gap-2 text-13 text-secondary"
            onClick={() => {
              void handleTransitionPick(transition);
            }}
          >
            <span className="truncate font-medium text-primary">
              {getLocalizedTransitionName(transition.name, transition.to_state_name, transition.to_state_group, t)}
            </span>
            <ArrowRight className="size-3 shrink-0 text-tertiary" strokeWidth={1.75} />
            <StateGroupIcon
              stateGroup={transition.to_state_group}
              color={getStateById(transition.to_state_id)?.color}
              className="size-3.5 shrink-0"
            />
            <span className="truncate text-secondary">
              {getLocalizedStateName({ name: transition.to_state_name, group: transition.to_state_group }, t)}
            </span>
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>

      <IssueTransitionScreenModal
        isOpen={pendingTransition !== null}
        transition={pendingTransition}
        onClose={() => setPendingTransition(null)}
        onSubmit={async (payload) => {
          if (!pendingTransition) return;
          await runExecute(pendingTransition, payload);
        }}
      />
    </>
  );
});
