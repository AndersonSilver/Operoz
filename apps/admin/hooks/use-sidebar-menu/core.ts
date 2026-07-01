import { Image, BrainCog, Cog, Mail, MessagesSquare, Palette } from "lucide-react";
import { LockIcon, WorkspaceIcon } from "@operoz/propel/icons";
import type { TCoreSidebarMenuKey, TSidebarMenuItemConfig } from "./types";

export type { TCoreSidebarMenuKey };

export const coreSidebarMenuLinks: Record<TCoreSidebarMenuKey, TSidebarMenuItemConfig> = {
  general: {
    Icon: Cog,
    nameKey: "god_mode.nav.general.name",
    descriptionKey: "god_mode.nav.general.description",
    href: `/general/`,
  },
  email: {
    Icon: Mail,
    nameKey: "god_mode.nav.email.name",
    descriptionKey: "god_mode.nav.email.description",
    href: `/email/`,
  },
  workspace: {
    Icon: WorkspaceIcon,
    nameKey: "god_mode.nav.workspace.name",
    descriptionKey: "god_mode.nav.workspace.description",
    href: `/workspace/`,
  },
  authentication: {
    Icon: LockIcon,
    nameKey: "god_mode.nav.authentication.name",
    descriptionKey: "god_mode.nav.authentication.description",
    href: `/authentication/`,
  },
  ai: {
    Icon: BrainCog,
    nameKey: "god_mode.nav.ai.name",
    descriptionKey: "god_mode.nav.ai.description",
    href: `/ai/`,
  },
  discord: {
    Icon: MessagesSquare,
    nameKey: "god_mode.nav.discord.name",
    descriptionKey: "god_mode.nav.discord.description",
    href: `/discord/`,
  },
  preferences: {
    Icon: Palette,
    nameKey: "god_mode.nav.preferences.name",
    descriptionKey: "god_mode.nav.preferences.description",
    href: `/preferences/`,
  },
  image: {
    Icon: Image,
    nameKey: "god_mode.nav.image.name",
    descriptionKey: "god_mode.nav.image.description",
    href: `/image/`,
  },
};
