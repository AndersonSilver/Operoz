import type { RefObject } from "react";
import { observer } from "mobx-react";
import type { IGanttBlock } from "@operoz/types";

type LeftDependencyDraggableProps = {
  block: IGanttBlock;
  ganttContainerRef: RefObject<HTMLDivElement>;
  onCreateDependency?: (sourceBlockId: string, targetBlockId: string) => Promise<void>;
};

/**
 * The left-side dependency handle (bolinha).
 * Shows the visual handle in hover state. Full drag-to-link logic
 * is a planned enhancement (P3 — Start-to-Start / Finish-to-Finish).
 * Currently only the visual is rendered.
 */
export const LeftDependencyDraggable = observer(function LeftDependencyDraggable(_props: LeftDependencyDraggableProps) {
  return (
    <div
      aria-label="Dependency handle (left side)"
      className="absolute top-1/2 left-0 z-[10] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
    >
      <div className="shadow-sm h-1.5 w-1.5 rounded-full bg-success-primary" />
    </div>
  );
});
