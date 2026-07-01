import { observer } from "mobx-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip } from "@operoz/propel/tooltip";
import { cn } from "@operoz/utils";
import { useTheme } from "@/hooks/store";
import { useSidebarMenu } from "@/hooks/use-sidebar-menu";

export const AdminSidebarMenu = observer(function AdminSidebarMenu() {
  const pathName = usePathname();
  const { isSidebarCollapsed, toggleSidebar } = useTheme();
  const sidebarMenu = useSidebarMenu();

  const handleItemClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar(!isSidebarCollapsed);
    }
  };

  return (
    <div className="vertical-scrollbar flex scrollbar-sm h-full w-full flex-col gap-1.5 overflow-y-scroll px-3 py-4">
      {sidebarMenu.map((item) => {
        const isActive = item.href === pathName || pathName?.includes(item.href);
        return (
          <Link key={item.href} href={item.href} onClick={handleItemClick}>
            <Tooltip tooltipContent={item.name} position="right" className="ml-2" disabled={!isSidebarCollapsed}>
              <div
                className={cn(
                  "group relative flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-150 outline-none",
                  isActive
                    ? "admin-card-glow-active border-accent-subtle/40 bg-accent-subtle/10 text-primary"
                    : "border-transparent text-secondary hover:border-subtle hover:bg-layer-transparent-hover",
                  isSidebarCollapsed ? "justify-center" : ""
                )}
              >
                {isActive ? (
                  <span className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-accent-primary" aria-hidden />
                ) : null}
                <item.Icon className={cn("h-4 w-4 shrink-0", isActive && "text-accent-primary")} />
                {!isSidebarCollapsed && (
                  <div className="min-w-0 flex-1 pl-1">
                    <div className="text-body-xs-medium">{item.name}</div>
                    <div className="truncate text-caption-sm-regular text-tertiary">{item.description}</div>
                  </div>
                )}
              </div>
            </Tooltip>
          </Link>
        );
      })}
    </div>
  );
});
