/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TLogoProps } from "../common";
import type { IUserLite } from "../users";
import type { IWorkspace } from "../workspace";

export type TBoardSpaceType = "team_managed" | "company_managed";

export interface IBoardLite {
  id: string;
  name: string;
  slug: string;
  identifier?: string;
  logo_props: TLogoProps;
  archived_at?: string | null;
}

export interface IBoard extends IBoardLite {
  category?: string;
  space_type?: TBoardSpaceType | string;
  gantt_project_logo_props?: TLogoProps;
  gantt_module_logo_props?: TLogoProps;
  description?: string;
  sort_order: number | null;
  workspace: IWorkspace | string;
  board_lead?: IUserLite | string | null;
  default_assignee?: IUserLite | string | null;
  created_at?: Date;
  updated_at?: Date;
  created_by?: string;
  updated_by?: string;
}

export interface IBoardMap {
  [id: string]: IBoard;
}

export type TBoardFormData = Pick<
  IBoard,
  "name" | "description" | "logo_props" | "gantt_project_logo_props" | "gantt_module_logo_props"
> & {
  slug?: string;
  identifier?: string;
  category?: string;
  space_type?: TBoardSpaceType | string;
  sort_order?: number | null;
  board_lead?: string | null;
  default_assignee?: string | null;
};
