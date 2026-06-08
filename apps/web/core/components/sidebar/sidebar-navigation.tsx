import { cn } from "@operis/utils";
import { SIDEBAR_NAV_ACTIVE_INDICATOR_CLASS, sidebarNavItemClass } from "./sidebar-styles";

type TSidebarNavItem = {
  className?: string;
  isActive?: boolean;
  children?: React.ReactNode;
};

export function SidebarNavItem(props: TSidebarNavItem) {
  const { className, isActive, children } = props;

  return (
    <div className={cn(sidebarNavItemClass(isActive), className)}>
      {isActive ? <span className={SIDEBAR_NAV_ACTIVE_INDICATOR_CLASS} aria-hidden /> : null}
      {children}
    </div>
  );
}
