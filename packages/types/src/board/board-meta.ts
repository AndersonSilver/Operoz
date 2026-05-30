/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export type TBoardMetaStateDistribution = {
  state_id: string | null;
  state_name: string;
  state_color: string;
  state_group: string;
  count: number;
};

export type TBoardMetaPriorityDistribution = {
  priority: string;
  count: number;
};

export type TBoardMetaTypeDistribution = {
  type_id: string | null;
  type_name: string;
  count: number;
};

export type TBoardMetaActivityActor = {
  id: string;
  display_name: string;
  avatar_url: string;
};

export type TBoardMetaActivityIssue = {
  id: string;
  name: string;
  sequence_id: number;
  project_id: string;
  project_identifier: string;
};

export type TBoardMetaRecentActivity = {
  id: string;
  verb: string;
  field: string | null;
  created_at: string;
  actor: TBoardMetaActivityActor | null;
  issue: TBoardMetaActivityIssue | null;
};

export type TBoardMetaActivityLast7Days = {
  completed: number;
  updated: number;
  created: number;
};

export interface IBoardMeta {
  projects_count: number;
  total_issues: number;
  pending_issues: number;
  completed_issues: number;
  overdue_issues: number;
  due_this_week: number;
  without_target_date: number;
  due_soon: number;
  activity_last_7_days: TBoardMetaActivityLast7Days;
  state_distribution: TBoardMetaStateDistribution[];
  priority_distribution: TBoardMetaPriorityDistribution[];
  type_distribution: TBoardMetaTypeDistribution[];
  recent_activity: TBoardMetaRecentActivity[];
}
