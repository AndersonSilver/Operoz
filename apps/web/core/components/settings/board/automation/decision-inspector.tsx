import { useTranslation } from "@operis/i18n";
import type { TAutomationGraph } from "@operis/types";
import { v4 as uuidv4 } from "uuid";
import {
  AutomationBranchConditionFields,
  AutomationBranchConditionSelect,
} from "./automation-branch-condition-fields";
import { ConfigField, ConfigTextInput } from "./automation-config-primitives";
import {
  type DecisionBranch,
  getDecisionBranches,
  removeBranchEdges,
} from "./automation-utils";
import type { AutomationBoardContext } from "./use-automation-board-context";

type Props = {
  graph: TAutomationGraph;
  nodeId: string;
  label: string;
  config: Record<string, unknown>;
  boardContext: AutomationBoardContext;
  onUpdateLabel: (label: string) => void;
  onUpdateConfig: (config: Record<string, unknown>) => void;
  onGraphChange: (graph: TAutomationGraph) => void;
  onDeleteNode: () => void;
};

function branchConfigPlaceholder(filterKey: string): Record<string, unknown> {
  switch (filterKey) {
    case "filter.state":
      return { state_ids: [] };
    case "filter.project":
      return { project_ids: [] };
    case "filter.assignee":
      return { assignee_ids: [], mode: "any" };
    case "filter.field_changed":
      return { fields: [] };
    default:
      return {};
  }
}

export function DecisionInspector(props: Props) {
  const {
    graph,
    nodeId,
    label,
    config,
    boardContext,
    onUpdateLabel,
    onUpdateConfig,
    onGraphChange,
    onDeleteNode,
  } = props;
  const { t } = useTranslation();
  const branches = getDecisionBranches({ kind: "decision", catalog_key: "decision.switch", label, config });

  const updateBranches = (next: DecisionBranch[]) => {
    onUpdateConfig({ ...config, branches: next });
  };

  const addBranch = () => {
    updateBranches([
      ...branches.filter((b) => b.filter_key !== "decision.else"),
      {
        id: `branch-${uuidv4().slice(0, 8)}`,
        label: t("boards.settings.automation.decision.new_branch"),
        filter_key: "filter.state",
        filter_config: { state_ids: [] },
      },
      ...branches.filter((b) => b.filter_key === "decision.else"),
    ]);
  };

  const removeBranch = (branchId: string) => {
    updateBranches(branches.filter((b) => b.id !== branchId));
    onGraphChange(removeBranchEdges(graph, nodeId, branchId));
  };

  const updateBranch = (branchId: string, patch: Partial<DecisionBranch>) => {
    updateBranches(
      branches.map((b) => {
        if (b.id !== branchId) return b;
        const next = { ...b, ...patch };
        if (patch.filter_key && patch.filter_key !== b.filter_key) {
          next.filter_config = branchConfigPlaceholder(patch.filter_key);
        }
        return next;
      })
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto rounded-lg border border-subtle bg-surface-1 p-3">
      <p className="mb-2 text-11 font-semibold uppercase tracking-wide text-tertiary">
        {t("boards.settings.automation.decision.title")}
      </p>
      <p className="mb-3 text-11 text-tertiary">{t("boards.settings.automation.decision.lead")}</p>

      <ConfigField label={t("boards.settings.automation.inspector.label")}>
        <ConfigTextInput value={label} onChange={onUpdateLabel} />
      </ConfigField>

      <div className="mb-2 flex items-center justify-between">
        <span className="text-11 font-semibold uppercase tracking-wide text-tertiary">
          {t("boards.settings.automation.decision.branches")}
        </span>
        <button
          type="button"
          className="text-11 text-accent-primary hover:underline"
          onClick={addBranch}
        >
          + {t("boards.settings.automation.decision.add_branch")}
        </button>
      </div>

      <div className="space-y-3">
        {branches.map((branch, index) => (
          <div key={branch.id} className="rounded-md border border-subtle bg-surface-2 p-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-11 text-tertiary">
                {t("boards.settings.automation.decision.branch")} {index + 1}
              </span>
              {branches.length > 1 && branch.filter_key !== "decision.else" && (
                <button
                  type="button"
                  className="text-11 text-danger-primary hover:underline"
                  onClick={() => removeBranch(branch.id)}
                >
                  {t("remove")}
                </button>
              )}
            </div>
            <ConfigField label={t("boards.settings.automation.decision.branch_label")}>
              <ConfigTextInput
                value={branch.label}
                onChange={(value) => updateBranch(branch.id, { label: value })}
              />
            </ConfigField>
            <AutomationBranchConditionSelect
              value={branch.filter_key}
              onChange={(filter_key) => updateBranch(branch.id, { filter_key })}
            />
            <AutomationBranchConditionFields
              filterKey={branch.filter_key}
              filterConfig={branch.filter_config ?? {}}
              boardContext={boardContext}
              onChange={(filter_key, filter_config) =>
                updateBranch(branch.id, { filter_key, filter_config })
              }
            />
            <p className="mt-2 text-10 text-tertiary">
              {t("boards.settings.automation.decision.output_hint")}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-4 text-11 text-tertiary">{t("boards.settings.automation.inspector.delete_hint")}</p>
      <button
        type="button"
        className="mt-2 rounded-md border border-danger-primary px-3 py-1.5 text-13 text-danger-primary hover:bg-danger-primary/10"
        onClick={onDeleteNode}
      >
        {t("boards.settings.automation.inspector.delete_node")}
      </button>
    </div>
  );
}
