import type { IUserLite } from "../users";

export interface IBoardRolePermission {
  permission_key: string;
  granted: boolean;
}

export interface IBoardRole {
  id: string;
  name: string;
  description: string;
  slug: string;
  is_system: boolean;
  sort_order: number;
  permissions: IBoardRolePermission[];
  created_at?: string;
  updated_at?: string;
}

export interface IBoardPermissionTreeNode {
  key: string;
  parent_key: string | null;
  children: string[];
}

export interface IBoardPermissionCatalog {
  keys_v1: string[];
  tree: IBoardPermissionTreeNode[];
}

export type TBoardRolePermissionsMap = Record<string, boolean>;

export type TBoardRoleFormData = {
  name: string;
  description: string;
  permissions?: TBoardRolePermissionsMap;
};

export interface IBoardMemberRoleAssignment {
  role_id: string;
  role_name: string;
  role_slug: string;
}

export interface IBoardMember {
  user_id: string;
  member: IUserLite;
  email: string;
  roles: IBoardMemberRoleAssignment[];
  role_ids: string[];
  role_label: string;
}

export type TBoardMemberAssignData = {
  user_id: string;
  role_ids: string[];
};

export interface IBoardCircle {
  id: string;
  name: string;
  description: string;
  color: string;
  role_id: string | null;
  role_name: string | null;
  member_count: number;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export type TBoardCircleFormData = {
  name: string;
  description?: string;
  color?: string;
  role_id?: string | null;
};

export interface IBoardCircleMember {
  id: string;
  user_id: string;
  member: IUserLite;
  email: string;
  created_at?: string;
}

export interface IBoardCircleLookup {
  id: string;
  name: string;
  color: string;
  member_count: number;
  board_slug: string;
}
