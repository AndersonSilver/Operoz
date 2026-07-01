/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TBoardFieldFormSpan } from "./custom-fields";

export type TProjectStandardFieldKey =
  | "name"
  | "identifier"
  | "description"
  | "project_lead"
  | "responsible_stakeholder"
  | "default_assignee"
  | "network"
  | "timezone";

export type TBoardProjectFieldSection = "description" | "context";

export type TBoardProjectFieldSource = "system" | "custom";

export interface IBoardProjectFieldLayout {
  id: string;
  field_source: TBoardProjectFieldSource;
  standard_field_key?: TProjectStandardFieldKey | null;
  custom_field_id?: string | null;
  name: string;
  field_type: string;
  section: TBoardProjectFieldSection;
  sort_order: number;
  is_required: boolean;
  is_enabled: boolean;
  form_span?: TBoardFieldFormSpan;
  created_at?: string;
  updated_at?: string;
}

export interface IProjectFormLayoutResponse {
  board_id: string | null;
  board_slug?: string;
  layout: IBoardProjectFieldLayout[];
  custom_field_values: IProjectCustomFieldValueRow[];
}

export interface IProjectCustomFieldValueRow {
  id: string;
  custom_field_id: string;
  name: string;
  field_type: string;
  settings?: Record<string, unknown>;
  value: unknown;
}
