/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
