import React from "react";
import Link from "next/link";
import { cn } from "@operoz/utils";
import type { LucideIcon } from "lucide-react";
import type { ISvgIcons } from "@operoz/propel/icons";
import {
  SIDEBAR_NAV_ACTIVE_INDICATOR_CLASS,
  sidebarNavIconClass,
  sidebarNavItemClass,
} from "@/components/sidebar/sidebar-styles";

type Props = {
  isActive: boolean;
  label: string;
} & ({ as: "button"; onClick: () => void } | { as: "link"; href: string }) &
  (
    | {
        icon: LucideIcon | React.FC<ISvgIcons>;
      }
    | { iconNode: React.ReactElement }
  );

export function SettingsSidebarItem(props: Props) {
  const { as, isActive, label } = props;
  const className = cn(sidebarNavItemClass(isActive), "group/nav");

  const iconNode = "iconNode" in props ? props.iconNode : null;
  const Icon = "icon" in props ? props.icon : null;

  const content = (
    <>
      {isActive ? <span className={SIDEBAR_NAV_ACTIVE_INDICATOR_CLASS} aria-hidden /> : null}
      {Icon ? (
        <span className={sidebarNavIconClass(isActive)}>
          <Icon className="size-3.5" strokeWidth={1.75} />
        </span>
      ) : iconNode ? (
        <span className={sidebarNavIconClass(isActive)}>{iconNode}</span>
      ) : null}
      <span className="min-w-0 flex-1 truncate text-13 font-medium">{label}</span>
    </>
  );

  if (as === "button") {
    return (
      <button type="button" className={className} onClick={props.onClick}>
        {content}
      </button>
    );
  }

  return (
    <Link className={className} href={props.href}>
      {content}
    </Link>
  );
}
