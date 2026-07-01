import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, ArrowRight, Unlink } from "lucide-react";
import type { IGanttBlock } from "@operoz/types";

type DependencyTooltipProps = {
  predecessor: IGanttBlock;
  successor: IGanttBlock;
  isConflict: boolean;
  position: { x: number; y: number };
  onUnlink: () => void;
  onClose: () => void;
};

function DependencyTooltipContent(props: DependencyTooltipProps) {
  const { predecessor, successor, isConflict, position, onUnlink, onClose } = props;
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={tooltipRef}
      data-dependency-tooltip
      className="shadow-lg fixed z-[100] w-64 rounded-md border border-subtle bg-layer-1 p-3"
      style={{ top: position.y + 12, left: position.x + 8 }}
    >
      {/* Relation type header */}
      <div className="mb-2 flex items-center gap-1.5">
        <ArrowRight size={12} className="text-accent-primary" />
        <span className="text-11 font-medium tracking-wide text-tertiary uppercase">blocks</span>
      </div>

      {/* Predecessor name */}
      <div className="truncate text-12 font-medium text-primary" title={predecessor.name}>
        {predecessor.name}
      </div>

      {/* Divider */}
      <div className="my-1.5 flex items-center gap-1.5">
        <div className="bg-subtle h-px flex-1" />
        <span className="text-11 text-tertiary">bloqueia</span>
        <div className="bg-subtle h-px flex-1" />
      </div>

      {/* Successor name */}
      <div className="truncate text-12 font-medium text-primary" title={successor.name}>
        {successor.name}
      </div>

      {/* Conflict warning */}
      {isConflict && (
        <div className="mt-2 flex items-start gap-1.5 rounded-sm bg-danger-subtle px-2 py-1.5">
          <AlertTriangle size={12} className="mt-0.5 shrink-0 text-danger-primary" />
          <span className="text-11 leading-snug text-danger-primary">
            Datas em conflito — <strong>{successor.name}</strong> começa antes de <strong>{predecessor.name}</strong>{" "}
            terminar.
          </span>
        </div>
      )}

      {/* Unlink button */}
      <button
        onClick={onUnlink}
        className="hover:border-danger-primary mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-sm border border-subtle bg-layer-1 py-1.5 text-12 text-secondary transition-colors duration-100 hover:bg-danger-subtle hover:text-danger-primary"
      >
        <Unlink size={12} />
        Desvincular ticket
      </button>
    </div>
  );
}

/**
 * Portal-based dependency tooltip.
 * Renders at document.body level to escape any overflow:hidden containers.
 */
export function DependencyTooltip(props: DependencyTooltipProps) {
  return createPortal(<DependencyTooltipContent {...props} />, document.body);
}
