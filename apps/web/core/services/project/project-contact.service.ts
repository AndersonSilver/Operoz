// types
import { API_BASE_URL } from "@operoz/constants";
import type { IProjectContact, TProjectContactFormData } from "@operoz/types";
// services
import { APIService } from "@/services/api.service";

export class ProjectContactService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchProjectContacts(workspaceSlug: string, projectId: string): Promise<IProjectContact[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/contacts/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createProjectContact(
    workspaceSlug: string,
    projectId: string,
    data: TProjectContactFormData & { category: IProjectContact["category"] }
  ): Promise<IProjectContact> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/contacts/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateProjectContact(
    workspaceSlug: string,
    projectId: string,
    contactId: string,
    data: Partial<TProjectContactFormData>
  ): Promise<IProjectContact> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/contacts/${contactId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteProjectContact(workspaceSlug: string, projectId: string, contactId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/contacts/${contactId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

const projectContactService = new ProjectContactService();

export default projectContactService;
