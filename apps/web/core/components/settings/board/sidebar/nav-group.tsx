import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@operoz/utils";
import { SidebarTreeGuide } from "@/components/sidebar/sidebar-tree-guide";
import {
  SIDEBAR_NAV_ACTIVE_INDICATOR_CLASS,
  SIDEBAR_TREE_CHILD_INDENT_CLASS,
  sidebarNavIconClass,
  sidebarNavItemClass,
} from "@/components/sidebar/sidebar-styles";

type Props = {
  label: string;
  icon: LucideIcon;
  isOpen: boolean;
  isActive: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export function BoardSettingsNavGroup(props: Props) {
  const { label, icon: Icon, isOpen, isActive, onToggle, children } = props;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        className={cn(sidebarNavItemClass(isActive), "group/nav")}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        {isActive ? <span className={SIDEBAR_NAV_ACTIVE_INDICATOR_CLASS} aria-hidden /> : null}
        <span className={sidebarNavIconClass(isActive)}>
          <Icon className="size-3.5" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1 truncate text-left text-13 font-medium">{label}</span>
        <ChevronDown
          className={cn("size-3.5 shrink-0 text-tertiary transition-transform duration-150", {
            "rotate-180": isOpen,
          })}
          strokeWidth={1.75}
        />
      </button>
      {isOpen ? (
        <div className={cn("relative flex flex-col gap-0.5", SIDEBAR_TREE_CHILD_INDENT_CLASS)}>
          <SidebarTreeGuide />
          {children}
        </div>
      ) : null}
    </div>
  );
}
