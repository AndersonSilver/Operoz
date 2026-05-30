import { cn } from "@operis/utils";
import { useGanttSidebarWidth } from "../contexts/gantt-sidebar-width";

export function GanttSidebarResizeHandle() {
  const { isResizing, startResizing } = useGanttSidebarWidth();

  return (
    <button
      type="button"
      aria-label="Redimensionar coluna de itens de trabalho"
      className={cn(
        "absolute top-0 right-0 z-20 h-full w-1.5 translate-x-1/2 cursor-col-resize border-0 bg-transparent p-0",
        "after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-subtle after:transition-colors",
        "hover:after:bg-accent-strong",
        {
          "after:bg-accent-strong": isResizing,
        }
      )}
      onMouseDown={startResizing}
    />
  );
}
