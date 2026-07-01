import { observer } from "mobx-react";
import { BLOCK_HEIGHT } from "@/components/gantt-chart/constants";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import { buildDependencyPathFromSide } from "./dependency-path-geometry";

/**
 * Renders the in-progress dependency arrow while the user is dragging a handle.
 * Mounts as an SVG overlay that covers the entire gantt items container.
 *
 * Coordinate system: all positions are relative to the gantt items container,
 * which already accounts for horizontal scroll (see toContainerCoords in the handles).
 */
export const TimelineDraggablePath = observer(function TimelineDraggablePath() {
  const store = useTimeLineChartStore();
  const { dependencyDragState, blockIds, blocksMap } = store;

  if (!dependencyDragState || !blockIds) return null;

  const { sourceBlockId, sourceSide, currentX, currentY, targetBlockId } = dependencyDragState;

  // Compute origin point from the source block's position
  const sourceBlock = blocksMap[sourceBlockId];
  if (!sourceBlock?.position) return null;

  const sourceIndex = blockIds.indexOf(sourceBlockId);
  if (sourceIndex === -1) return null;

  const originX =
    sourceSide === "right"
      ? sourceBlock.position.marginLeft + sourceBlock.position.width
      : sourceBlock.position.marginLeft;
  const originY = sourceIndex * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;

  const d = buildDependencyPathFromSide(originX, originY, currentX, currentY, sourceSide);

  // Highlight ring on the target block (if any valid target is hovered)
  let targetRingX: number | null = null;
  let targetRingY: number | null = null;
  if (targetBlockId) {
    const targetBlock = blocksMap[targetBlockId];
    const targetIndex = blockIds.indexOf(targetBlockId);
    if (targetBlock?.position && targetIndex !== -1) {
      targetRingX = targetBlock.position.marginLeft;
      targetRingY = targetIndex * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;
    }
  }

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[20]"
      style={{ width: "100%", height: "100%", overflow: "visible" }}
    >
      {/* Dashed in-progress line */}
      <path
        d={d}
        stroke="var(--stroke-accent-secondary)"
        strokeWidth="1.25"
        fill="none"
        strokeDasharray="5 4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.75}
      />

      {/* Cursor endpoint indicator */}
      <circle cx={currentX} cy={currentY} r="2.5" fill="var(--fill-success-primary)" opacity="0.9" />

      {/* Highlight ring on valid drop target */}
      {targetRingX !== null && targetRingY !== null && (
        <circle cx={targetRingX} cy={targetRingY} r="6" fill="var(--fill-success-primary)" opacity="0.85" />
      )}
    </svg>
  );
});
