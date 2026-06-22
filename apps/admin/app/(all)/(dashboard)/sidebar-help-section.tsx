import { observer } from "mobx-react";
import { MoveLeft } from "lucide-react";
// plane internal packages
import { Tooltip } from "@operis/propel/tooltip";
import { cn } from "@operis/utils";
// hooks
import { useTheme } from "@/hooks/store";

export const AdminSidebarHelpSection = observer(function AdminSidebarHelpSection() {
  const { isSidebarCollapsed, toggleSidebar } = useTheme();

  return (
    <div
      className={cn(
        "flex h-14 w-full flex-shrink-0 items-center justify-end gap-1 self-baseline border-t border-subtle bg-surface-1 px-4",
        {
          "h-auto flex-col py-1.5": isSidebarCollapsed,
        }
      )}
    >
      <Tooltip tooltipContent="Toggle sidebar" position={isSidebarCollapsed ? "right" : "top"} className="ml-4">
        <button
          type="button"
          className={`grid place-items-center rounded-md p-1.5 text-secondary outline-none hover:bg-layer-1-hover hover:text-primary ${
            isSidebarCollapsed ? "w-full" : ""
          }`}
          onClick={() => toggleSidebar(!isSidebarCollapsed)}
        >
          <MoveLeft className={`size-4 duration-300 ${isSidebarCollapsed ? "rotate-180" : ""}`} />
        </button>
      </Tooltip>
    </div>
  );
});
