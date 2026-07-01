import { memo, useId } from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

export const WORKFLOW_STEP_EDGE_TYPE = "step";

export const WorkflowStepEdge = memo(function WorkflowStepEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, selected } = props;

  const uid = useId().replace(/:/g, "");
  const gradientId = `wf-edge-grad-${uid}`;
  const filterId = `wf-edge-glow-${uid}`;

  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.4,
  });

  return (
    <>
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={sourceX}
          y1={sourceY}
          x2={targetX}
          y2={targetY}
        >
          <stop offset="0%" stopColor="var(--txt-tertiary)" stopOpacity={selected ? 0.7 : 0.5} />
          <stop
            offset="100%"
            stopColor={selected ? "var(--txt-accent-primary)" : "var(--txt-secondary)"}
            stopOpacity={1}
          />
        </linearGradient>
        {selected && (
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="0 0 0 0 0.2  0 0 0 0 0.5  0 0 0 0 1  0 0 0 0.6 0"
              result="glow"
            />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: `url(#${gradientId})`,
          strokeWidth: selected ? 2 : 1.5,
          strokeLinecap: "round",
          filter: selected ? `url(#${filterId})` : undefined,
          transition: "stroke-width 0.15s ease",
        }}
      />
    </>
  );
});
