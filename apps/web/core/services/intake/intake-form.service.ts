import { API_BASE_URL } from "@operoz/constants";
import type { TIntakeForm, TIntakeFormWritePayload } from "@operoz/types";
import { APIService } from "@/services/api.service";

function parseIntakeFormList(data: unknown): TIntakeForm[] {
  if (Array.isArray(data)) return data;
  return [];
}

export class IntakeFormService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async list(workspaceSlug: string, projectId: string): Promise<TIntakeForm[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/intake-forms/`)
      .then((res) => parseIntakeFormList(res?.data))
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async create(workspaceSlug: string, projectId: string, data: TIntakeFormWritePayload): Promise<TIntakeForm> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/intake-forms/`, data)
      .then((res) => res?.data as TIntakeForm)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async update(
    workspaceSlug: string,
    projectId: string,
    formId: string,
    data: TIntakeFormWritePayload
  ): Promise<TIntakeForm> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/intake-forms/${formId}/`, data)
      .then((res) => res?.data as TIntakeForm)
      .catch((err) => {
        throw err?.response?.data;
      });
  }

  async destroy(workspaceSlug: string, projectId: string, formId: string): Promise<void> {
    await this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/intake-forms/${formId}/`).catch((err) => {
      throw err?.response?.data;
    });
  }
}

export const intakeFormService = new IntakeFormService();
