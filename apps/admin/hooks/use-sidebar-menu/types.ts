import type { LucideIcon } from "lucide-react";

export type TCoreSidebarMenuKey =
  | "general"
  | "email"
  | "workspace"
  | "authentication"
  | "ai"
  | "discord"
  | "preferences"
  | "image";

export type TSidebarMenuItemConfig = {
  Icon: LucideIcon | React.ComponentType<{ className?: string }>;
  nameKey: `god_mode.nav.${TCoreSidebarMenuKey}.name`;
  descriptionKey: `god_mode.nav.${TCoreSidebarMenuKey}.description`;
  href: string;
};

export type TSidebarMenuItem = TSidebarMenuItemConfig & {
  name: string;
  description: string;
};
