/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, makeObservable, observable, runInAction } from "mobx";
import type {
  IBoardMember,
  IBoardPermissionCatalog,
  IBoardRole,
  TBoardMemberAssignData,
  TBoardRoleFormData,
  TBoardRolePermissionsMap,
} from "@plane/types";
import { BoardAccessService } from "@/services/board/board-access.service";

export interface IBoardAccessStore {
  rolesByKey: Record<string, IBoardRole[]>;
  membersByKey: Record<string, IBoardMember[]>;
  catalogByKey: Record<string, IBoardPermissionCatalog>;
  fetchBoardRoles: (workspaceSlug: string, boardSlug: string) => Promise<IBoardRole[]>;
  fetchPermissionCatalog: (workspaceSlug: string, boardSlug: string) => Promise<IBoardPermissionCatalog>;
  createBoardRole: (workspaceSlug: string, boardSlug: string, data: TBoardRoleFormData) => Promise<IBoardRole>;
  updateBoardRole: (
    workspaceSlug: string,
    boardSlug: string,
    roleId: string,
    data: Partial<TBoardRoleFormData> & { permissions?: TBoardRolePermissionsMap }
  ) => Promise<IBoardRole>;
  deleteBoardRole: (workspaceSlug: string, boardSlug: string, roleId: string) => Promise<void>;
  duplicateBoardRole: (workspaceSlug: string, boardSlug: string, roleId: string) => Promise<IBoardRole>;
  fetchBoardMembers: (workspaceSlug: string, boardSlug: string) => Promise<IBoardMember[]>;
  assignBoardMember: (
    workspaceSlug: string,
    boardSlug: string,
    data: TBoardMemberAssignData
  ) => Promise<IBoardMember>;
  updateBoardMemberRoles: (
    workspaceSlug: string,
    boardSlug: string,
    userId: string,
    roleIds: string[]
  ) => Promise<IBoardMember>;
  removeBoardMember: (workspaceSlug: string, boardSlug: string, userId: string) => Promise<void>;
  getBoardRoles: (workspaceSlug: string, boardSlug: string) => IBoardRole[];
  getBoardMembers: (workspaceSlug: string, boardSlug: string) => IBoardMember[];
  getPermissionCatalog: (workspaceSlug: string, boardSlug: string) => IBoardPermissionCatalog | undefined;
}

const boardKey = (workspaceSlug: string, boardSlug: string) => `${workspaceSlug}::${boardSlug}`;

export class BoardAccessStore implements IBoardAccessStore {
  rolesByKey: Record<string, IBoardRole[]> = {};
  membersByKey: Record<string, IBoardMember[]> = {};
  catalogByKey: Record<string, IBoardPermissionCatalog> = {};
  private service = new BoardAccessService();

  constructor() {
    makeObservable(this, {
      rolesByKey: observable,
      membersByKey: observable,
      catalogByKey: observable,
      fetchBoardRoles: action,
      fetchPermissionCatalog: action,
      createBoardRole: action,
      updateBoardRole: action,
      deleteBoardRole: action,
      duplicateBoardRole: action,
      fetchBoardMembers: action,
      assignBoardMember: action,
      updateBoardMemberRoles: action,
      removeBoardMember: action,
    });
  }

  getBoardRoles = (workspaceSlug: string, boardSlug: string) =>
    this.rolesByKey[boardKey(workspaceSlug, boardSlug)] ?? [];

  getBoardMembers = (workspaceSlug: string, boardSlug: string) =>
    this.membersByKey[boardKey(workspaceSlug, boardSlug)] ?? [];

  getPermissionCatalog = (workspaceSlug: string, boardSlug: string) =>
    this.catalogByKey[boardKey(workspaceSlug, boardSlug)];

  private upsertMember = (key: string, member: IBoardMember) => {
    const list = [...(this.membersByKey[key] ?? [])];
    const idx = list.findIndex((m) => m.user_id === member.user_id);
    if (idx >= 0) list[idx] = member;
    else list.push(member);
    this.membersByKey[key] = list;
  };

  fetchBoardRoles = async (workspaceSlug: string, boardSlug: string) => {
    const roles = await this.service.getBoardRoles(workspaceSlug, boardSlug);
    runInAction(() => {
      this.rolesByKey[boardKey(workspaceSlug, boardSlug)] = roles;
    });
    return roles;
  };

  fetchPermissionCatalog = async (workspaceSlug: string, boardSlug: string) => {
    const catalog = await this.service.getPermissionCatalog(workspaceSlug, boardSlug);
    runInAction(() => {
      this.catalogByKey[boardKey(workspaceSlug, boardSlug)] = catalog;
    });
    return catalog;
  };

  createBoardRole = async (workspaceSlug: string, boardSlug: string, data: TBoardRoleFormData) => {
    const created = await this.service.createBoardRole(workspaceSlug, boardSlug, data);
    runInAction(() => {
      const key = boardKey(workspaceSlug, boardSlug);
      this.rolesByKey[key] = [...(this.rolesByKey[key] ?? []), created].sort(
        (a, b) => a.sort_order - b.sort_order
      );
    });
    return created;
  };

  updateBoardRole = async (
    workspaceSlug: string,
    boardSlug: string,
    roleId: string,
    data: Partial<TBoardRoleFormData> & { permissions?: TBoardRolePermissionsMap }
  ) => {
    const updated = await this.service.updateBoardRole(workspaceSlug, boardSlug, roleId, data);
    runInAction(() => {
      const key = boardKey(workspaceSlug, boardSlug);
      this.rolesByKey[key] = (this.rolesByKey[key] ?? [])
        .map((item) => (item.id === roleId ? updated : item))
        .sort((a, b) => a.sort_order - b.sort_order);
    });
    return updated;
  };

  deleteBoardRole = async (workspaceSlug: string, boardSlug: string, roleId: string) => {
    await this.service.deleteBoardRole(workspaceSlug, boardSlug, roleId);
    runInAction(() => {
      const key = boardKey(workspaceSlug, boardSlug);
      this.rolesByKey[key] = (this.rolesByKey[key] ?? []).filter((item) => item.id !== roleId);
    });
  };

  duplicateBoardRole = async (workspaceSlug: string, boardSlug: string, roleId: string) => {
    const created = await this.service.duplicateBoardRole(workspaceSlug, boardSlug, roleId);
    runInAction(() => {
      const key = boardKey(workspaceSlug, boardSlug);
      this.rolesByKey[key] = [...(this.rolesByKey[key] ?? []), created].sort(
        (a, b) => a.sort_order - b.sort_order
      );
    });
    return created;
  };

  fetchBoardMembers = async (workspaceSlug: string, boardSlug: string) => {
    const members = await this.service.getBoardMembers(workspaceSlug, boardSlug);
    runInAction(() => {
      this.membersByKey[boardKey(workspaceSlug, boardSlug)] = members;
    });
    return members;
  };

  assignBoardMember = async (workspaceSlug: string, boardSlug: string, data: TBoardMemberAssignData) => {
    const member = await this.service.assignBoardMember(workspaceSlug, boardSlug, data);
    runInAction(() => {
      this.upsertMember(boardKey(workspaceSlug, boardSlug), member);
    });
    return member;
  };

  updateBoardMemberRoles = async (
    workspaceSlug: string,
    boardSlug: string,
    userId: string,
    roleIds: string[]
  ) => {
    const member = await this.service.updateBoardMemberRoles(workspaceSlug, boardSlug, userId, roleIds);
    runInAction(() => {
      this.upsertMember(boardKey(workspaceSlug, boardSlug), member);
    });
    return member;
  };

  removeBoardMember = async (workspaceSlug: string, boardSlug: string, userId: string) => {
    await this.service.removeBoardMember(workspaceSlug, boardSlug, userId);
    runInAction(() => {
      const key = boardKey(workspaceSlug, boardSlug);
      this.membersByKey[key] = (this.membersByKey[key] ?? []).filter((m) => m.user_id !== userId);
    });
  };
}
