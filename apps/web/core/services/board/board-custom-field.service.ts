import { API_BASE_URL } from "@operoz/constants";
import type {
  IBoardCustomField,
  IBoardProjectFieldLayout,
  TIssueCustomFieldValuePayload,
  IProjectCustomFieldLite,
  IProjectFormLayoutResponse,
  IProjectIssueFormConfig,
  IWorkspaceCustomField,
  TBoardCustomFieldFormData,
  TBoardFieldFormSpan,
  TBoardProjectFieldSection,
  TWorkspaceCustomFieldFormData,
  TWorkspaceCustomFieldUpdateData,
} from "@operoz/types";
import { APIService } from "@/services/api.service";

export class BoardCustomFieldService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getWorkspaceCustomFields(workspaceSlug: string): Promise<IWorkspaceCustomField[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/custom-fields/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createWorkspaceCustomField(
    workspaceSlug: string,
    data: TWorkspaceCustomFieldFormData
  ): Promise<IWorkspaceCustomField> {
    return this.post(`/api/workspaces/${workspaceSlug}/custom-fields/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateWorkspaceCustomField(
    workspaceSlug: string,
    customFieldId: string,
    data: TWorkspaceCustomFieldUpdateData
  ): Promise<IWorkspaceCustomField> {
    return this.patch(`/api/workspaces/${workspaceSlug}/custom-fields/${customFieldId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteWorkspaceCustomField(workspaceSlug: string, customFieldId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/custom-fields/${customFieldId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getBoardCustomFields(workspaceSlug: string, boardSlug: string): Promise<IBoardCustomField[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/custom-fields/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createBoardCustomField(
    workspaceSlug: string,
    boardSlug: string,
    data: TBoardCustomFieldFormData
  ): Promise<IBoardCustomField> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/custom-fields/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data ?? error?.response;
      });
  }

  async bulkAddBoardCustomFields(
    workspaceSlug: string,
    boardSlug: string,
    customFieldIds: string[]
  ): Promise<IBoardCustomField[]> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/custom-fields/bulk-add/`, {
      custom_field_ids: customFieldIds,
    })
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateBoardCustomField(
    workspaceSlug: string,
    boardSlug: string,
    boardCustomFieldId: string,
    data: Partial<{ is_enabled: boolean; sort_order: number }>
  ): Promise<IBoardCustomField> {
    return this.patch(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/custom-fields/${boardCustomFieldId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeBoardCustomField(workspaceSlug: string, boardSlug: string, boardCustomFieldId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/custom-fields/${boardCustomFieldId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProjectIssueFormConfig(workspaceSlug: string, projectId: string): Promise<IProjectIssueFormConfig> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/custom-fields/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProjectCustomFields(workspaceSlug: string, projectId: string): Promise<IProjectCustomFieldLite[]> {
    const config = await this.getProjectIssueFormConfig(workspaceSlug, projectId);
    return config?.custom_fields ?? [];
  }

  async getIssueCustomFieldValues(
    workspaceSlug: string,
    issueId: string
  ): Promise<{ custom_field_id: string; value: unknown }[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/issues/${issueId}/custom-fields/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async saveIssueCustomFieldValues(
    workspaceSlug: string,
    issueId: string,
    values: TIssueCustomFieldValuePayload[]
  ): Promise<void> {
    return this.put(`/api/workspaces/${workspaceSlug}/issues/${issueId}/custom-fields/`, { values })
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getBoardProjectFieldLayout(workspaceSlug: string, boardSlug: string): Promise<IBoardProjectFieldLayout[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/project-field-layout/`)
      .then((response) => response?.data ?? [])
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addBoardProjectLayoutCustomField(
    workspaceSlug: string,
    boardSlug: string,
    data: {
      custom_field_id: string;
      section?: TBoardProjectFieldSection;
      sort_order?: number;
      is_required?: boolean;
      form_span?: TBoardFieldFormSpan;
    }
  ): Promise<IBoardProjectFieldLayout> {
    return this.post(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/project-field-layout/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateBoardProjectFieldLayout(
    workspaceSlug: string,
    boardSlug: string,
    layoutId: string,
    data: Partial<{
      section: TBoardProjectFieldSection;
      sort_order: number;
      is_required: boolean;
      is_enabled: boolean;
      form_span: TBoardFieldFormSpan;
    }>
  ): Promise<IBoardProjectFieldLayout> {
    return this.patch(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/project-field-layout/${layoutId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeBoardProjectFieldLayout(workspaceSlug: string, boardSlug: string, layoutId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/project-field-layout/${layoutId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getBoardProjectFormLayout(workspaceSlug: string, boardSlug: string): Promise<IProjectFormLayoutResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/boards/${boardSlug}/project-form-layout/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProjectFormLayout(workspaceSlug: string, projectId: string): Promise<IProjectFormLayoutResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/form-layout/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async saveProjectCustomFieldValues(
    workspaceSlug: string,
    projectId: string,
    values: { custom_field_id: string; value: unknown }[]
  ): Promise<void> {
    return this.put(`/api/workspaces/${workspaceSlug}/projects/${projectId}/custom-field-values/`, {
      values,
    })
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
