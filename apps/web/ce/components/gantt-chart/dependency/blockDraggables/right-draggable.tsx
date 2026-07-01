import type { RefObject } from "react";
import { useCallback, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import type { IGanttBlock } from "@operoz/types";
import { HEADER_HEIGHT } from "@/components/gantt-chart/constants";
import { useGanttDependency } from "@/components/gantt-chart/contexts";
import { useGanttSidebarWidth } from "@/components/gantt-chart/contexts/gantt-sidebar-width";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";

type RightDependencyDraggableProps = {
  block: IGanttBlock;
  ganttContainerRef: RefObject<HTMLDivElement>;
};

/**
 * Right-side dependency handle (bolinha direita).
 *
 * Dragging from here creates a Finish-to-Start dependency:
 * "this block must finish before the target block can start."
 */
export const RightDependencyDraggable = observer(function RightDependencyDraggable(
  props: RightDependencyDraggableProps
) {
  const { block, ganttContainerRef } = props;
  const store = useTimeLineChartStore();
  const { onCreateDependency } = useGanttDependency();
  const { sidebarWidth } = useGanttSidebarWidth();
  const isDraggingRef = useRef(false);

  /**
   * Resolves the gantt block id from a point in screen coordinates by walking
   * the DOM from `document.elementFromPoint` upwards for `data-gantt-block-id`.
   */
  const getTargetBlockIdFromPoint = useCallback((clientX: number, clientY: number): string | null => {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    return el.closest("[data-gantt-block-id]")?.getAttribute("data-gantt-block-id") ?? null;
  }, []);

  /**
   * Converts screen (clientX/Y) coordinates to the gantt items-container space
   * (same origin as block marginLeft and the dependency SVG overlay).
   */
  const toContainerCoords = useCallback(
    (clientX: number, clientY: number) => {
      const container = ganttContainerRef.current;
      if (!container) return { x: clientX, y: clientY };
      const rect = container.getBoundingClientRect();
      return {
        x: clientX - rect.left - sidebarWidth + container.scrollLeft,
        y: clientY - rect.top - HEADER_HEIGHT + container.scrollTop,
      };
    },
    [ganttContainerRef, sidebarWidth]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const { x, y } = toContainerCoords(e.clientX, e.clientY);
      const rawTarget = getTargetBlockIdFromPoint(e.clientX, e.clientY);
      store.updateDependencyDrag(x, y, rawTarget !== block.id ? rawTarget : null);
    },
    [block.id, getTargetBlockIdFromPoint, store, toContainerCoords]
  );

  const handleMouseUp = useCallback(
    async (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;

      const targetBlockId = getTargetBlockIdFromPoint(e.clientX, e.clientY);
      store.endDependencyDrag();

      if (!targetBlockId || targetBlockId === block.id) return;
      if (!onCreateDependency) return;

      // Guard: relation already exists (avoid duplicate)
      if (block.blocked_by_ids?.includes(targetBlockId)) return;

      // Guard: simple cycle detection — target already blocked_by source
      const targetBlock = store.getBlockById(targetBlockId);
      if (targetBlock?.blocked_by_ids?.includes(block.id)) return;

      await onCreateDependency(block.id, targetBlockId);
    },
    [block, getTargetBlockIdFromPoint, onCreateDependency, store]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Only respond to primary mouse button
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      isDraggingRef.current = true;
      const { x, y } = toContainerCoords(e.clientX, e.clientY);
      store.startDependencyDrag(block.id, "right", x, y);

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp, { once: true });
    },
    [block.id, handleMouseMove, handleMouseUp, store, toContainerCoords]
  );

  // Cleanup global listeners and drag state when component unmounts mid-drag
  useEffect(
    () => () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (isDraggingRef.current) {
        store.endDependencyDrag();
        isDraggingRef.current = false;
      }
    },
    [handleMouseMove, handleMouseUp, store]
  );

  return (
    <div
      aria-label="Create dependency from right handle"
      className="pointer-events-auto absolute top-1/2 right-0 z-[10] translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
    >
      <div
        className="shadow-sm h-1.5 w-1.5 cursor-crosshair rounded-full bg-success-primary transition-transform duration-100 hover:scale-110"
        onMouseDown={handleMouseDown}
      />
    </div>
  );
});
