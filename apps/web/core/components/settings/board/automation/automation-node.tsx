import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import clsx from "clsx";
import { useTranslation } from "@operis/i18n";
import { AUTOMATION_KIND_DEFAULT_ICON, AutomationCatalogIcon } from "./automation-catalog-icon";
import { AUTOMATION_KIND_THEME, branchHandleTopPercent } from "./automation-kind-theme";
import type { AutomationNodeData } from "./automation-utils";
import { ACTION_BRANCH_ERROR, ACTION_BRANCH_SUCCESS, isBranchingAction } from "./automation-utils";

export const AutomationFlowNode = memo(function AutomationFlowNode({
  data,
  selected,
}: NodeProps & { data: AutomationNodeData }) {
  const { t } = useTranslation();
  const branching = data.kind === "action" && isBranchingAction(data.catalog_key);
  const hasDefaultOutput = data.kind !== "action" || !branching;
  const theme = AUTOMATION_KIND_THEME[data.kind];
  const iconName = data.icon ?? AUTOMATION_KIND_DEFAULT_ICON[data.kind];

  return (
    <div
      className={clsx(
        "relative min-w-[212px] overflow-visible rounded-lg border bg-layer-1 shadow-sm transition-shadow",
        theme.border,
        selected && "ring-2 ring-accent-primary ring-offset-2 ring-offset-surface-1",
        branching && "min-w-[228px]"
      )}
    >
      <span className={clsx("absolute bottom-2 left-0 top-2 w-1 rounded-full", theme.accentBar)} aria-hidden />

      {data.kind !== "trigger" && (
        <Handle
          type="target"
          position={Position.Left}
          className="automation-flow-handle automation-flow-handle-target"
        />
      )}

      <div className="flex items-start gap-2.5 py-2.5 pl-3.5 pr-3">
        <div
          className={clsx(
            "flex size-8 shrink-0 items-center justify-center rounded-md",
            theme.iconWrap
          )}
        >
          <AutomationCatalogIcon name={iconName} className={clsx("size-4", theme.iconColor)} />
        </div>
        <div className="min-w-0 flex-1">
          <span
            className={clsx(
              "inline-flex rounded px-1.5 py-0.5 text-10 font-semibold uppercase tracking-wide",
              theme.chip
            )}
          >
            {t(`boards.settings.automation.node_kind.${data.kind}`)}
          </span>
          <p className="mt-1 text-13 font-semibold leading-snug text-primary">{data.label}</p>
        </div>
      </div>

      {branching ? (
        <div className="space-y-1.5 border-t border-subtle px-3 py-2">
          <p className="text-11 font-medium text-success-primary">
            {t("boards.settings.automation.dry_run_panel.branch_success")}
          </p>
          <p className="text-11 font-medium text-danger-primary">
            {t("boards.settings.automation.dry_run_panel.branch_error")}
          </p>
          <Handle
            type="source"
            position={Position.Right}
            id={ACTION_BRANCH_SUCCESS}
            className="automation-flow-handle automation-flow-handle-success"
            style={{ top: branchHandleTopPercent(0, 2) }}
          />
          <Handle
            type="source"
            position={Position.Right}
            id={ACTION_BRANCH_ERROR}
            className="automation-flow-handle automation-flow-handle-error"
            style={{ top: branchHandleTopPercent(1, 2) }}
          />
        </div>
      ) : (
        hasDefaultOutput && (
          <Handle
            type="source"
            position={Position.Right}
            className="automation-flow-handle automation-flow-handle-default"
          />
        )
      )}
    </div>
  );
});
