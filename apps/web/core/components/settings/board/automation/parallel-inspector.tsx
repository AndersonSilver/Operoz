import { useTranslation } from "@operoz/i18n";
import type { TAutomationGraph } from "@operoz/types";
import { v4 as uuidv4 } from "uuid";
import { ConfigField, ConfigTextInput } from "./automation-config-primitives";
import { type ParallelBranch, getParallelBranches, removeBranchEdges } from "./automation-utils";
import type { AutomationNodeData } from "./automation-utils";

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

export function ParallelInspector(props: Props) {
  const { graph, nodeId, label, config, onUpdateLabel, onUpdateConfig, onGraphChange, onDeleteNode } = props;
  const { t } = useTranslation();
  const nodeData: AutomationNodeData = {
    kind: "parallel",
    catalog_key: "parallel.fan_out",
    label,
    config,
  };
  const branches = getParallelBranches(nodeData);
  const joinPolicy = String(config.join_policy ?? "all");

  const updateBranches = (next: ParallelBranch[]) => {
    onUpdateConfig({ ...config, branches: next });
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto rounded-lg border border-subtle bg-surface-1 p-3">
      <p className="mb-2 text-11 font-semibold tracking-wide text-tertiary uppercase">
        {t("boards.settings.automation.parallel.title")}
      </p>
      <ConfigField label={t("boards.settings.automation.inspector.label")}>
        <ConfigTextInput value={label} onChange={onUpdateLabel} />
      </ConfigField>
      <ConfigField label={t("boards.settings.automation.parallel.join_policy")}>
        <select
          className="w-full rounded-md border border-subtle bg-layer-1 px-2 py-1.5 text-13"
          value={joinPolicy}
          onChange={(event) => onUpdateConfig({ ...config, join_policy: event.target.value })}
        >
          <option value="all">{t("boards.settings.automation.parallel.join_all")}</option>
          <option value="any">{t("boards.settings.automation.parallel.join_any")}</option>
        </select>
      </ConfigField>
      <div className="mt-3 space-y-2">
        {branches.map((branch, index) => (
          <ConfigField
            key={branch.id}
            label={t("boards.settings.automation.parallel.branch_label", { index: index + 1 })}
          >
            <ConfigTextInput
              value={branch.label}
              onChange={(value) =>
                updateBranches(branches.map((item) => (item.id === branch.id ? { ...item, label: value } : item)))
              }
            />
          </ConfigField>
        ))}
      </div>
      <button
        type="button"
        className="mt-3 rounded-md border border-subtle px-3 py-1.5 text-13 text-secondary hover:bg-layer-2"
        onClick={() =>
          updateBranches([
            ...branches,
            { id: `branch-${uuidv4().slice(0, 8)}`, label: t("boards.settings.automation.parallel.new_branch") },
          ])
        }
      >
        {t("boards.settings.automation.parallel.add_branch")}
      </button>
      {branches.length > 2 && (
        <button
          type="button"
          className="mt-2 text-12 text-tertiary hover:text-danger-primary"
          onClick={() => {
            const removed = branches[branches.length - 1];
            updateBranches(branches.slice(0, -1));
            onGraphChange(removeBranchEdges(graph, nodeId, removed.id));
          }}
        >
          {t("boards.settings.automation.parallel.remove_branch")}
        </button>
      )}
      <button
        type="button"
        className="border-danger-primary mt-4 rounded-md border px-3 py-1.5 text-13 text-danger-primary hover:bg-danger-primary/10"
        onClick={onDeleteNode}
      >
        {t("boards.settings.automation.inspector.delete_node")}
      </button>
    </div>
  );
}
