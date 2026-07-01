import { memo, type CSSProperties } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@operoz/utils";
import { type WorkflowNodeData } from "./workflow-utils";
import "./workflow-canvas.css";

export const WorkflowStateNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as WorkflowNodeData;

  return (
    <div
      className={cn("workflow-state-node", selected && "selected", nodeData.is_initial && "initial")}
      style={
        {
          "--workflow-state-color": nodeData.color,
        } as CSSProperties
      }
    >
      <Handle type="target" position={Position.Left} id="target" className="workflow-handle workflow-handle-left" />

      <div className="workflow-node-body">
        <span className="workflow-node-accent" aria-hidden />
        <div className="workflow-node-content">
          <div className="workflow-node-header">
            <span className="workflow-node-name">{nodeData.name}</span>
            {nodeData.is_initial && <span className="workflow-node-badge">Initial</span>}
          </div>
          <span className="workflow-node-group">{nodeData.group}</span>
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="source" className="workflow-handle workflow-handle-right" />
    </div>
  );
});

WorkflowStateNode.displayName = "WorkflowStateNode";
