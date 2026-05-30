/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TLogoProps } from "../common";

export interface IBoardIssueType {
  id: string;
  issue_type_id: string;
  name: string;
  description?: string;
  logo_props: TLogoProps;
  sort_order: number;
  is_enabled: boolean;
  is_active: boolean;
  is_epic: boolean;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IProjectIssueTypeLite {
  id: string;
  name: string;
  description?: string;
  logo_props: TLogoProps;
  is_active: boolean;
  is_default: boolean;
  is_epic: boolean;
  level: number;
}

export type TBoardIssueTypeFormData = {
  name: string;
  description?: string;
  logo_props?: TLogoProps;
  sort_order?: number;
  is_enabled?: boolean;
};
