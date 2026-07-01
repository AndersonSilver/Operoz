import { useTranslation } from "@operoz/i18n";
import type { TAutomationGraph } from "@operoz/types";
import { v4 as uuidv4 } from "uuid";
import { ConfigField, ConfigTextArea, ConfigTextInput } from "./automation-config-primitives";
import { type DecisionBranch, getDecisionBranches, removeBranchEdges } from "./automation-utils";

type Props = {
  graph: TAutomationGraph;
  nodeId: string;
  label: string;
  config: Record<string, unknown>;
  onUpdateLabel: (label: string) => void;
  onUpdateConfig: (config: Record<string, unknown>) => void;
  onGraphChange: (graph: TAutomationGraph) => void;
  onDeleteNode: () => void;
};

export function LlmDecisionInspector(props: Props) {
  const { graph, nodeId, label, config, onUpdateLabel, onUpdateConfig, onGraphChange, onDeleteNode } = props;
  const { t } = useTranslation();
  const branches = getDecisionBranches({
    kind: "decision",
    catalog_key: "decision.llm",
    label,
    config,
  });

  const updateBranches = (next: DecisionBranch[]) => {
    onUpdateConfig({ ...config, branches: next });
  };

  const addBranch = () => {
    const id = `branch-${uuidv4().slice(0, 8)}`;
    updateBranches([
      ...branches,
      { id, label: t("boards.settings.automation.llm_decision.new_branch"), filter_key: "", filter_config: {} },
    ]);
  };

  const removeBranch = (branchId: string) => {
    updateBranches(branches.filter((b) => b.id !== branchId));
    onGraphChange(removeBranchEdges(graph, nodeId, branchId));
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <ConfigField label={t("boards.settings.automation.inspector.label")}>
        <ConfigTextInput value={label} onChange={onUpdateLabel} />
      </ConfigField>
      <ConfigField label={t("boards.settings.automation.llm_decision.prompt")}>
        <ConfigTextArea
          value={String(config.prompt ?? "")}
          onChange={(prompt) => onUpdateConfig({ ...config, prompt })}
        />
      </ConfigField>
      <ConfigField label={t("boards.settings.automation.llm_decision.confidence_threshold")}>
        <input
          type="number"
          min={0}
          max={100}
          className="w-full rounded border border-subtle bg-layer-1 px-2 py-1.5 text-13"
          value={Number(config.confidence_threshold ?? 80)}
          onChange={(e) => onUpdateConfig({ ...config, confidence_threshold: Number(e.target.value) })}
        />
      </ConfigField>
      <ConfigField label={t("boards.settings.automation.llm_decision.human_branch_id")}>
        <ConfigTextInput
          value={String(config.human_branch_id ?? "")}
          onChange={(human_branch_id) => onUpdateConfig({ ...config, human_branch_id })}
        />
      </ConfigField>
      <div className="space-y-2">
        <p className="text-11 font-semibold text-secondary">{t("boards.settings.automation.llm_decision.branches")}</p>
        {branches.map((branch) => (
          <div key={branch.id} className="rounded border border-subtle p-2">
            <ConfigField label={t("boards.settings.automation.decision.branch_label")}>
              <ConfigTextInput
                value={branch.label}
                onChange={(branchLabel) =>
                  updateBranches(branches.map((b) => (b.id === branch.id ? { ...b, label: branchLabel } : b)))
                }
              />
            </ConfigField>
            <ConfigField label={t("boards.settings.automation.llm_decision.branch_description")}>
              <ConfigTextInput
                value={String((branch as { description?: string }).description ?? "")}
                onChange={(description) =>
                  updateBranches(
                    branches.map((b) => (b.id === branch.id ? ({ ...b, description } as DecisionBranch) : b))
                  )
                }
              />
            </ConfigField>
            <button type="button" className="text-danger mt-1 text-12" onClick={() => removeBranch(branch.id)}>
              {t("common.remove")}
            </button>
          </div>
        ))}
        <button type="button" className="text-12 text-accent-primary" onClick={addBranch}>
          {t("boards.settings.automation.llm_decision.add_branch")}
        </button>
      </div>
      <button type="button" className="text-danger text-12" onClick={onDeleteNode}>
        {t("boards.settings.automation.inspector.delete_node")}
      </button>
    </div>
  );
}
