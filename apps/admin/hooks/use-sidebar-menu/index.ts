import { useTranslation } from "@operis/i18n";
import { coreSidebarMenuLinks } from "./core";
import type { TSidebarMenuItem } from "./types";

const MENU_ORDER = [
  coreSidebarMenuLinks.general,
  coreSidebarMenuLinks.email,
  coreSidebarMenuLinks.authentication,
  coreSidebarMenuLinks.workspace,
  coreSidebarMenuLinks.ai,
  coreSidebarMenuLinks.preferences,
  coreSidebarMenuLinks.image,
] as const;

export function useSidebarMenu(): TSidebarMenuItem[] {
  const { t } = useTranslation();

  return MENU_ORDER.map((item) => ({
    ...item,
    name: t(item.nameKey),
    description: t(item.descriptionKey),
  }));
}
