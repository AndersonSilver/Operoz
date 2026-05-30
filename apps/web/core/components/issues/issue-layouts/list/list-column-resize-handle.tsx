import type { MouseEvent as ReactMouseEvent } from "react";
import { useCallback } from "react";
import { cn } from "@operis/utils";
import type { TListGridResizableColumn } from "../properties/list-property-columns";

type Props = {
  column: TListGridResizableColumn;
  onResizeByDelta: (column: TListGridResizableColumn, deltaPx: number) => void;
  className?: string;
};

export function ListColumnResizeHandle(props: Props) {
  const { column, onResizeByDelta, className } = props;

  const handleMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      let lastX = event.clientX;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - lastX;
        lastX = moveEvent.clientX;
        if (delta !== 0) onResizeByDelta(column, delta);
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [column, onResizeByDelta]
  );

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      title="Arrastar para redimensionar"
      onMouseDown={handleMouseDown}
      className={cn(
        "absolute top-0 right-0 z-[1] h-full w-1.5 translate-x-1/2 cursor-col-resize",
        "opacity-0 transition-opacity hover:bg-accent-primary/40 group-hover/column-header:opacity-100",
        className
      )}
    />
  );
}
