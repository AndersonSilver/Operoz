import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import type { IGanttBlock } from "@operoz/types";
import { BLOCK_HEIGHT } from "@/components/gantt-chart/constants";
import { useGanttDependency } from "@/components/gantt-chart/contexts";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import { DependencyTooltip } from "./dependency-tooltip";
import { buildDependencyPath } from "./dependency-path-geometry";

type Props = {
  isEpic?: boolean;
};

type DependencyLinkData = {
  from: string;
  to: string;
  /** origin X — right edge of the predecessor block */
  ox: number;
  /** origin Y — vertical center of the predecessor row */
  oy: number;
  /** destination X — left edge of the successor block */
  dx: number;
  /** destination Y — vertical center of the successor row */
  dy: number;
  isConflict: boolean;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * A successor has a date conflict when it starts before the predecessor finishes.
 * Same-day is allowed (≥, not >).
 */
function hasDateConflict(predecessor: IGanttBlock, successor: IGanttBlock): boolean {
  if (!predecessor.target_date || !successor.start_date) return false;
  return new Date(successor.start_date) < new Date(predecessor.target_date);
}

function buildDependencyLinks(
  blockIds: string[],
  blocksMap: Record<string, IGanttBlock>,
  blockIndexMap: Record<string, number>
): DependencyLinkData[] {
  const result: DependencyLinkData[] = [];
  const seen = new Set<string>();

  const pushLink = (fromId: string, toId: string) => {
    const key = `${fromId}->${toId}`;
    if (seen.has(key)) return;

    const predecessor = blocksMap[fromId];
    const successor = blocksMap[toId];
    if (!predecessor?.position || !successor?.position) return;

    seen.add(key);
    const predIndex = blockIndexMap[fromId] ?? 0;
    const succIndex = blockIndexMap[toId] ?? 0;

    result.push({
      from: fromId,
      to: toId,
      ox: predecessor.position.marginLeft + predecessor.position.width,
      oy: predIndex * BLOCK_HEIGHT + BLOCK_HEIGHT / 2,
      dx: successor.position.marginLeft,
      dy: succIndex * BLOCK_HEIGHT + BLOCK_HEIGHT / 2,
      isConflict: hasDateConflict(predecessor, successor),
    });
  };

  for (const blockId of blockIds) {
    const block = blocksMap[blockId];
    if (!block) continue;

    for (const targetId of block.blocking_ids ?? []) {
      pushLink(blockId, targetId);
    }

    for (const predecessorId of block.blocked_by_ids ?? []) {
      pushLink(predecessorId, blockId);
    }
  }

  return result;
}

// ─── DependencyLink ─────────────────────────────────────────────────────────

type DependencyLinkProps = {
  link: DependencyLinkData;
  predecessor: IGanttBlock;
  successor: IGanttBlock;
};

const DependencyLink = observer(function DependencyLink(props: DependencyLinkProps) {
  const { link, predecessor, successor } = props;
  const { onDeleteDependency } = useGanttDependency();
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const stroke = link.isConflict
    ? "var(--stroke-danger-primary)"
    : isHovered
      ? "var(--txt-secondary)"
      : "var(--txt-tertiary)";

  const d = buildDependencyPath(link.ox, link.oy, link.dx, link.dy);
  const midX = (link.ox + link.dx) / 2;
  const midY = (link.oy + link.dy) / 2;

  const handleMouseEnter = (e: React.MouseEvent) => {
    setIsHovered(true);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const handleUnlink = () => {
    setTooltipPos(null);
    onDeleteDependency?.(link.to, link.from);
  };

  return (
    <g>
      {/* Wide invisible hit area for easier hover / click */}
      <path
        d={d}
        stroke="transparent"
        strokeWidth="14"
        fill="none"
        style={{ pointerEvents: "stroke", cursor: "pointer" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => setTooltipPos({ x: e.clientX, y: e.clientY })}
      />

      {/* Visible connector */}
      <path
        d={d}
        stroke={stroke}
        strokeWidth={isHovered ? 1.5 : 1}
        fill="none"
        strokeDasharray={link.isConflict ? "5 4" : undefined}
        opacity={isHovered ? 0.85 : link.isConflict ? 0.8 : 0.55}
        style={{ pointerEvents: "none", transition: "opacity 0.12s ease, stroke-width 0.12s ease" }}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Conflict badge — "!" at midpoint */}
      {link.isConflict && (
        <g transform={`translate(${midX}, ${midY})`} style={{ pointerEvents: "none" }}>
          <circle
            r="7"
            fill="var(--background-color-danger-subtle)"
            stroke="var(--stroke-danger-primary)"
            strokeWidth="1.25"
          />
          <text x="0" y="3.5" textAnchor="middle" fontSize="9" fill="var(--fill-danger-primary)" fontWeight="bold">
            !
          </text>
        </g>
      )}

      {/* Portal tooltip */}
      {tooltipPos && (
        <DependencyTooltip
          predecessor={predecessor}
          successor={successor}
          isConflict={link.isConflict}
          position={tooltipPos}
          onUnlink={handleUnlink}
          onClose={() => setTooltipPos(null)}
        />
      )}
    </g>
  );
});

// ─── TimelineDependencyPaths ─────────────────────────────────────────────────

/**
 * SVG overlay that renders dependency connectors for visible Gantt blocks.
 *
 * Positioning: absolutely positioned over the items container, same
 * coordinate space as the block positions (marginLeft / BLOCK_HEIGHT rows).
 */
export const TimelineDependencyPaths = observer(function TimelineDependencyPaths(_props: Props) {
  const store = useTimeLineChartStore();
  const { blockIds, blocksMap } = store;

  // Map blockId → row index for Y calculation
  const blockIndexMap = useMemo(
    () => Object.fromEntries((blockIds ?? []).map((id: string, i: number) => [id, i])),
    [blockIds]
  );

  // Computed in render (not useMemo) so MobX tracks nested blocking_ids / blocked_by_ids updates.
  const links = blockIds?.length ? buildDependencyLinks(blockIds, blocksMap, blockIndexMap) : [];

  if (!links.length) return null;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[15]"
      style={{ width: "100%", height: "100%", overflow: "visible" }}
    >
      {links.map((link) => {
        const predecessor = blocksMap[link.from];
        const successor = blocksMap[link.to];
        if (!predecessor || !successor) return null;
        return (
          <DependencyLink key={`${link.from}-${link.to}`} link={link} predecessor={predecessor} successor={successor} />
        );
      })}
    </svg>
  );
});
