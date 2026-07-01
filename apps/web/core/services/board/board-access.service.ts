import { API_BASE_URL } from "@operoz/constants";
import type {
  IBoardMember,
  IBoardPermissionCatalog,
  IBoardRole,
  TBoardMemberAssignData,
  TBoardRoleFormData,
  TBoardRolePermissionsMap,
} from "@operoz/types";
import { APIService } from "@/services/api.service";

export class BoardAccessService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getPermissionCatalog(workspaceSlug: string, boardSlug: string): Promise<IBoardPermissionCatalog> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/permission-catalog/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getBoardRoles(workspaceSlug: string, boardSlug: string): Promise<IBoardRole[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/roles/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createBoardRole(workspaceSlug: string, boardSlug: string, data: TBoardRoleFormData): Promise<IBoardRole> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/roles/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateBoardRole(
    workspaceSlug: string,
    boardSlug: string,
    roleId: string,
    data: Partial<TBoardRoleFormData> & { permissions?: TBoardRolePermissionsMap }
  ): Promise<IBoardRole> {
    return this.patch(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/roles/${roleId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteBoardRole(workspaceSlug: string, boardSlug: string, roleId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/roles/${roleId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async duplicateBoardRole(workspaceSlug: string, boardSlug: string, roleId: string): Promise<IBoardRole> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/roles/${roleId}/duplicate/`, {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getBoardMembers(workspaceSlug: string, boardSlug: string): Promise<IBoardMember[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/members/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async assignBoardMember(
    workspaceSlug: string,
    boardSlug: string,
    data: TBoardMemberAssignData
  ): Promise<IBoardMember> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/members/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateBoardMemberRoles(
    workspaceSlug: string,
    boardSlug: string,
    userId: string,
    roleIds: string[]
  ): Promise<IBoardMember> {
    return this.patch(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/members/${userId}/`, {
      role_ids: roleIds,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeBoardMember(workspaceSlug: string, boardSlug: string, userId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/members/${userId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
