import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import clsx from "clsx";
import { useTranslation } from "@operis/i18n";
import { AUTOMATION_KIND_DEFAULT_ICON, AutomationCatalogIcon } from "./automation-catalog-icon";
import { branchHandleTopPercent } from "./automation-kind-theme";
import type { AutomationNodeData } from "./automation-utils";
import { getParallelBranches } from "./automation-utils";

const PARALLEL_THEME = {
  accentBar: "bg-[var(--extended-color-cyan-500)]",
  iconWrap: "bg-[var(--extended-color-cyan-500)]/15",
  iconColor: "text-[var(--extended-color-cyan-500)]",
  chip: "bg-[var(--extended-color-cyan-500)]/15 text-[var(--extended-color-cyan-500)]",
  border: "border-[var(--extended-color-cyan-500)]/30",
};

export const ParallelFlowNode = memo(function ParallelFlowNode({
  data,
  selected,
}: NodeProps & { data: AutomationNodeData }) {
  const { t } = useTranslation();
  const branches = getParallelBranches(data);
  const theme = PARALLEL_THEME;
  const iconName = data.icon ?? AUTOMATION_KIND_DEFAULT_ICON.action;

  return (
    <div
      className={clsx(
        "shadow-sm relative min-w-[228px] overflow-visible rounded-lg border bg-layer-1 transition-shadow",
        theme.border,
        selected && "ring-accent-primary ring-offset-surface-1 ring-2 ring-offset-2"
      )}
    >
      <span className={clsx("absolute top-2 bottom-2 left-0 w-1 rounded-full", theme.accentBar)} aria-hidden />
      <Handle type="target" position={Position.Left} className="automation-flow-handle automation-flow-handle-target" />
      <div className="flex items-start gap-2.5 py-2.5 pr-3 pl-3.5">
        <div className={clsx("flex size-8 shrink-0 items-center justify-center rounded-md", theme.iconWrap)}>
          <AutomationCatalogIcon name={iconName} className={clsx("size-4", theme.iconColor)} />
        </div>
        <div className="min-w-0 flex-1">
          <span
            className={clsx(
              "inline-flex rounded px-1.5 py-0.5 text-10 font-semibold tracking-wide uppercase",
              theme.chip
            )}
          >
            {t("boards.settings.automation.node_kind.parallel")}
          </span>
          <p className="mt-1 text-13 leading-snug font-semibold text-primary">{data.label}</p>
        </div>
      </div>
      {branches.length > 0 && (
        <div className="space-y-1.5 border-t border-subtle px-3 py-2">
          {branches.map((branch) => (
            <p key={branch.id} className="truncate text-11 font-medium text-secondary">
              {branch.label}
            </p>
          ))}
        </div>
      )}
      {branches.map((branch, index) => (
        <Handle
          key={branch.id}
          type="source"
          position={Position.Right}
          id={branch.id}
          className="automation-flow-handle automation-flow-handle-decision"
          style={{ top: branchHandleTopPercent(index, branches.length) }}
        />
      ))}
    </div>
  );
});
