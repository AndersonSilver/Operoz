import type { LucideIcon } from "lucide-react";
import {
  ArrowUpToLine,
  Bell,
  Bot,
  Building,
  LayoutGrid,
  MessagesSquare,
  RefreshCw,
  Users,
  Webhook,
} from "lucide-react";
// plane imports
import type { ISvgIcons } from "@operis/propel/icons";
import type { TWorkspaceSettingsTabs } from "@operis/types";

export const WORKSPACE_SETTINGS_ICONS: Record<TWorkspaceSettingsTabs, LucideIcon | React.FC<ISvgIcons>> = {
  general: Building,
  members: Users,
  export: ArrowUpToLine,
  boards: LayoutGrid,
  assistant: Bot,
  notifications: Bell,
  discord: MessagesSquare,
  jira: RefreshCw,
  webhooks: Webhook,
};
