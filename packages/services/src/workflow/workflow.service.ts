// plane imports
import { API_BASE_URL } from "@operoz/constants";
import type {
  IWorkflow,
  IWorkflowScheme,
  IWorkflowSchemeEntry,
  TWorkflowGraph,
  IIssueTransition,
  TTransitionExecutePayload,
} from "@operoz/types";
// api service
import { APIService } from "../api.service";

/**
 * Service class for managing workflows.
 * Extends APIService to handle HTTP requests to workflow-related endpoints.
 * @extends {APIService}
 */
export class WorkflowService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  /**
   * Retrieves a list of workflows for a specific workspace.
   * @param {string} workspaceSlug - The workspace slug
   * @returns {Promise<IWorkflow[]>} The list of workflows
   * @throws {Error} If the API request fails
   */
  async listWorkflows(workspaceSlug: string): Promise<IWorkflow[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/workflows/`, {})
      .then((response) => response?.data?.results || response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves a single workflow by ID.
   * @param {string} workspaceSlug - The workspace slug
   * @param {string} workflowId - The workflow ID
   * @returns {Promise<IWorkflow>} The workflow
   * @throws {Error} If the API request fails
   */
  async getWorkflow(workspaceSlug: string, workflowId: string): Promise<IWorkflow> {
    return this.get(`/api/workspaces/${workspaceSlug}/workflows/${workflowId}/`, {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new workflow.
   * @param {string} workspaceSlug - The workspace slug
   * @param {Partial<IWorkflow>} data - The workflow data
   * @returns {Promise<IWorkflow>} The created workflow
   * @throws {Error} If the API request fails
   */
  async createWorkflow(workspaceSlug: string, data: Partial<IWorkflow>): Promise<IWorkflow> {
    return this.post(`/api/workspaces/${workspaceSlug}/workflows/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates an existing workflow.
   * @param {string} workspaceSlug - The workspace slug
   * @param {string} workflowId - The workflow ID
   * @param {Partial<IWorkflow>} data - The workflow data to update
   * @returns {Promise<IWorkflow>} The updated workflow
   * @throws {Error} If the API request fails
   */
  async updateWorkflow(workspaceSlug: string, workflowId: string, data: Partial<IWorkflow>): Promise<IWorkflow> {
    return this.patch(`/api/workspaces/${workspaceSlug}/workflows/${workflowId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes a workflow.
   * @param {string} workspaceSlug - The workspace slug
   * @param {string} workflowId - The workflow ID
   * @returns {Promise<void>}
   * @throws {Error} If the API request fails
   */
  async deleteWorkflow(workspaceSlug: string, workflowId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/workflows/${workflowId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves the workflow graph representation.
   * @param {string} workspaceSlug - The workspace slug
   * @param {string} workflowId - The workflow ID
   * @returns {Promise<TWorkflowGraph>} The workflow graph
   * @throws {Error} If the API request fails
   */
  async getGraph(workspaceSlug: string, workflowId: string): Promise<TWorkflowGraph> {
    return this.get(`/api/workspaces/${workspaceSlug}/workflows/${workflowId}/graph/`, {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Saves the workflow graph representation.
   * @param {string} workspaceSlug - The workspace slug
   * @param {string} workflowId - The workflow ID
   * @param {TWorkflowGraph} graph - The workflow graph to save
   * @returns {Promise<TWorkflowGraph>} The saved workflow graph
   * @throws {Error} If the API request fails
   */
  async saveGraph(workspaceSlug: string, workflowId: string, graph: TWorkflowGraph): Promise<TWorkflowGraph> {
    return this.put(`/api/workspaces/${workspaceSlug}/workflows/${workflowId}/graph/`, graph)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Publishes a draft workflow.
   * @param {string} workspaceSlug - The workspace slug
   * @param {string} workflowId - The workflow ID
   * @returns {Promise<IWorkflow>} The published workflow
   * @throws {Error} If the API request fails
   */
  async publishWorkflow(workspaceSlug: string, workflowId: string): Promise<IWorkflow> {
    return this.post(`/api/workspaces/${workspaceSlug}/workflows/${workflowId}/publish/`, {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves a list of workflow schemes for a specific workspace.
   * @param {string} workspaceSlug - The workspace slug
   * @returns {Promise<IWorkflowScheme[]>} The list of workflow schemes
   * @throws {Error} If the API request fails
   */
  async listSchemes(workspaceSlug: string): Promise<IWorkflowScheme[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/workflow-schemes/`, {})
      .then((response) => response?.data?.results || response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves a single workflow scheme by ID.
   * @param {string} workspaceSlug - The workspace slug
   * @param {string} schemeId - The scheme ID
   * @returns {Promise<IWorkflowScheme>} The workflow scheme
   * @throws {Error} If the API request fails
   */
  async getScheme(workspaceSlug: string, schemeId: string): Promise<IWorkflowScheme> {
    return this.get(`/api/workspaces/${workspaceSlug}/workflow-schemes/${schemeId}/`, {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Creates a new workflow scheme.
   * @param {string} workspaceSlug - The workspace slug
   * @param {Partial<IWorkflowScheme>} data - The scheme data
   * @returns {Promise<IWorkflowScheme>} The created scheme
   * @throws {Error} If the API request fails
   */
  async createScheme(workspaceSlug: string, data: Partial<IWorkflowScheme>): Promise<IWorkflowScheme> {
    return this.post(`/api/workspaces/${workspaceSlug}/workflow-schemes/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Updates an existing workflow scheme.
   * @param {string} workspaceSlug - The workspace slug
   * @param {string} schemeId - The scheme ID
   * @param {Partial<IWorkflowScheme>} data - The scheme data to update
   * @returns {Promise<IWorkflowScheme>} The updated scheme
   * @throws {Error} If the API request fails
   */
  async updateScheme(
    workspaceSlug: string,
    schemeId: string,
    data: Partial<IWorkflowScheme>
  ): Promise<IWorkflowScheme> {
    return this.patch(`/api/workspaces/${workspaceSlug}/workflow-schemes/${schemeId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Deletes a workflow scheme.
   * @param {string} workspaceSlug - The workspace slug
   * @param {string} schemeId - The scheme ID
   * @returns {Promise<void>}
   * @throws {Error} If the API request fails
   */
  async deleteScheme(workspaceSlug: string, schemeId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/workflow-schemes/${schemeId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Retrieves available transitions for an issue.
   * @param {string} workspaceSlug - The workspace slug
   * @param {string} projectId - The project ID
   * @param {string} issueId - The issue ID
   * @returns {Promise<IIssueTransition[]>} The list of available transitions
   * @throws {Error} If the API request fails
   */
  async saveSchemeEntries(
    workspaceSlug: string,
    schemeId: string,
    data: { name?: string; is_default?: boolean; entries: Array<{ issue_type?: string | null; workflow: string }> }
  ): Promise<IWorkflowScheme> {
    return this.put(`/api/workspaces/${workspaceSlug}/workflow-schemes/${schemeId}/entries/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bootstrapSchemeFromProject(
    workspaceSlug: string,
    schemeId: string,
    data: {
      project_id: string;
      issue_type?: string | null;
      assign_project?: boolean;
      mode?: "linear" | "open";
      allow_back_transitions?: boolean;
      back_transition_mode?: "none" | "adjacent" | "last_only";
    }
  ): Promise<{ scheme: IWorkflowScheme; workflow_id: string; project_id: string }> {
    return this.post(`/api/workspaces/${workspaceSlug}/workflow-schemes/${schemeId}/bootstrap/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async assignSchemeProjects(
    workspaceSlug: string,
    schemeId: string,
    projectIds: string[]
  ): Promise<{ project_ids: string[] }> {
    return this.put(`/api/workspaces/${workspaceSlug}/workflow-schemes/${schemeId}/projects/`, {
      project_ids: projectIds,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getIssueTransitions(
    workspaceSlug: string,
    projectId: string,
    issueId: string
  ): Promise<import("@operoz/types").IIssueTransitionsResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/transitions/`, {})
      .then((response) => {
        const payload = response?.data;
        if (Array.isArray(payload)) {
          return { workflow_configured: false, transitions: payload };
        }
        return {
          workflow_configured: Boolean(payload?.workflow_configured),
          transitions: payload?.transitions ?? [],
        };
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  /**
   * Executes a transition on an issue.
   * @param {string} workspaceSlug - The workspace slug
   * @param {string} projectId - The project ID
   * @param {string} issueId - The issue ID
   * @param {string} transitionId - The transition ID
   * @param {TTransitionExecutePayload} payload - The transition execution payload
   * @returns {Promise<any>} The updated issue
   * @throws {Error} If the API request fails
   */
  async executeTransition(
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    transitionId: string,
    payload: TTransitionExecutePayload
  ): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/transitions/${transitionId}/execute/`,
      payload
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
