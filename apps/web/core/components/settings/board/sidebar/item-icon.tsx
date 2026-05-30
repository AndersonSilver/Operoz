import {
  Bell,
  Columns3,
  GanttChart,
  Info,
  LayoutGrid,
  ListTree,
  Shield,
  UserPlus,
  Workflow,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const BOARD_SETTINGS_ICONS: Record<string, LucideIcon> = {
  informations: Info,
  access: UserPlus,
  notifications: Bell,
  notifications_settings: Bell,
  email_audit: Bell,
  automation: Workflow,
  fields: Wrench,
  issue_types: ListTree,
  issue_types_list: ListTree,
  project_schema: LayoutGrid,
  roles: Shield,
  board_view: Columns3,
  timeline: GanttChart,
};
