import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type {
  IWorkflow,
  IWorkflowScheme,
  IWorkflowSchemeEntry,
  TWorkflowGraph,
  IIssueTransition,
  TTransitionExecutePayload,
} from "@operoz/types";
// plane web
import { WorkflowService } from "@operoz/services";
import type { RootStore } from "@/plane-web/store/root.store";

export interface IWorkflowStore {
  // Loaders
  fetchedWorkflowMap: Record<string, boolean>;
  fetchedSchemeMap: Record<string, boolean>;
  fetchedIssueTransitionsMap: Record<string, boolean>;
  // Observables
  workflowMap: Record<string, IWorkflow>;
  schemeMap: Record<string, IWorkflowScheme>;
  schemeIdsByWorkspace: Record<string, string[]>;
  workflowIdsByWorkspace: Record<string, string[]>;
  graphByWorkflow: Record<string, TWorkflowGraph>;
  transitionsByIssue: Record<string, IIssueTransition[]>;
  workflowConfiguredByIssue: Record<string, boolean>;
  // Computed
  workspaceWorkflows: IWorkflow[] | undefined;
  workspaceSchemes: IWorkflowScheme[] | undefined;
  // Computed actions
  getWorkflowById: (workflowId: string | null | undefined) => IWorkflow | undefined;
  getSchemeById: (schemeId: string | null | undefined) => IWorkflowScheme | undefined;
  getProjectScheme: (projectId: string | null | undefined) => IWorkflowScheme | undefined;
  // Fetch actions
  fetchWorkspaceWorkflows: (workspaceSlug: string) => Promise<IWorkflow[]>;
  fetchWorkspaceSchemes: (workspaceSlug: string) => Promise<IWorkflowScheme[]>;
  fetchWorkflow: (workspaceSlug: string, workflowId: string) => Promise<IWorkflow>;
  fetchScheme: (workspaceSlug: string, schemeId: string) => Promise<IWorkflowScheme>;
  // Workflow CRUD actions
  createWorkflow: (workspaceSlug: string, data: Partial<IWorkflow>) => Promise<IWorkflow>;
  updateWorkflow: (workspaceSlug: string, workflowId: string, data: Partial<IWorkflow>) => Promise<IWorkflow>;
  deleteWorkflow: (workspaceSlug: string, workflowId: string) => Promise<void>;
  // Workflow graph actions
  getWorkflowGraph: (workspaceSlug: string, workflowId: string) => Promise<TWorkflowGraph>;
  saveWorkflowGraph: (workspaceSlug: string, workflowId: string, graph: TWorkflowGraph) => Promise<TWorkflowGraph>;
  publishWorkflow: (workspaceSlug: string, workflowId: string) => Promise<IWorkflow>;
  // Scheme CRUD actions
  createScheme: (workspaceSlug: string, data: Partial<IWorkflowScheme>) => Promise<IWorkflowScheme>;
  updateScheme: (workspaceSlug: string, schemeId: string, data: Partial<IWorkflowScheme>) => Promise<IWorkflowScheme>;
  deleteScheme: (workspaceSlug: string, schemeId: string) => Promise<void>;
  saveSchemeEntries: (
    workspaceSlug: string,
    schemeId: string,
    data: {
      name?: string;
      is_default?: boolean;
      entries: Array<{ issue_type?: string | null; workflow: string }>;
    }
  ) => Promise<IWorkflowScheme>;
  bootstrapSchemeFromProject: (
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
  ) => Promise<{ scheme: IWorkflowScheme; workflow_id: string; project_id: string }>;
  assignSchemeProjects: (workspaceSlug: string, schemeId: string, projectIds: string[]) => Promise<string[]>;
  // Issue transition actions
  fetchIssueTransitions: (workspaceSlug: string, projectId: string, issueId: string) => Promise<IIssueTransition[]>;
  getIssueTransitions: (workspaceSlug: string, projectId: string, issueId: string) => Promise<IIssueTransition[]>;
  executeTransition: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    transitionId: string,
    payload: TTransitionExecutePayload
  ) => Promise<any>;
}

export class WorkflowStore implements IWorkflowStore {
  // Observables
  workflowMap: Record<string, IWorkflow> = {};
  schemeMap: Record<string, IWorkflowScheme> = {};
  schemeIdsByWorkspace: Record<string, string[]> = {};
  workflowIdsByWorkspace: Record<string, string[]> = {};
  graphByWorkflow: Record<string, TWorkflowGraph> = {};
  transitionsByIssue: Record<string, IIssueTransition[]> = {};
  workflowConfiguredByIssue: Record<string, boolean> = {};
  // Loaders
  fetchedWorkflowMap: Record<string, boolean> = {};
  fetchedSchemeMap: Record<string, boolean> = {};
  fetchedIssueTransitionsMap: Record<string, boolean> = {};
  // Services
  rootStore: RootStore;
  router;
  workflowService: WorkflowService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // Observables
      workflowMap: observable,
      schemeMap: observable,
      schemeIdsByWorkspace: observable,
      workflowIdsByWorkspace: observable,
      graphByWorkflow: observable,
      transitionsByIssue: observable,
      workflowConfiguredByIssue: observable,
      fetchedWorkflowMap: observable,
      fetchedSchemeMap: observable,
      fetchedIssueTransitionsMap: observable,
      // Computed
      workspaceWorkflows: computed,
      workspaceSchemes: computed,
      // Fetch actions
      fetchWorkspaceWorkflows: action,
      fetchWorkspaceSchemes: action,
      fetchWorkflow: action,
      fetchScheme: action,
      // Workflow CRUD actions
      createWorkflow: action,
      updateWorkflow: action,
      deleteWorkflow: action,
      // Workflow graph actions
      getWorkflowGraph: action,
      saveWorkflowGraph: action,
      publishWorkflow: action,
      // Scheme CRUD actions
      createScheme: action,
      updateScheme: action,
      deleteScheme: action,
      saveSchemeEntries: action,
      bootstrapSchemeFromProject: action,
      assignSchemeProjects: action,
      // Issue transition actions
      fetchIssueTransitions: action,
      getIssueTransitions: action,
      executeTransition: action,
    });

    this.rootStore = _rootStore;
    this.router = _rootStore.router;
    this.workflowService = new WorkflowService();
  }

  // Computed
  get workspaceWorkflows() {
    const workspaceSlug = this.router.workspaceSlug;
    if (!workspaceSlug) return undefined;

    const ids = this.workflowIdsByWorkspace[workspaceSlug];
    if (!ids) return undefined;

    return ids.map((id) => this.workflowMap[id]).filter(Boolean);
  }

  get workspaceSchemes() {
    const workspaceSlug = this.router.workspaceSlug;
    if (!workspaceSlug) return undefined;

    const ids = this.schemeIdsByWorkspace[workspaceSlug];
    if (!ids) return undefined;

    return ids.map((id) => this.schemeMap[id]).filter(Boolean);
  }

  // Computed actions
  getWorkflowById = computedFn((workflowId: string | null | undefined) => {
    if (!workflowId) return undefined;
    return this.workflowMap[workflowId];
  });

  getSchemeById = computedFn((schemeId: string | null | undefined) => {
    if (!schemeId) return undefined;
    return this.schemeMap[schemeId];
  });

  getProjectScheme = computedFn((projectId: string | null | undefined) => {
    if (!projectId) return undefined;
    const project = this.rootStore.projectRoot.project.projectMap[projectId];
    if (!project?.workflow_scheme) return undefined;
    return this.schemeMap[project.workflow_scheme];
  });

  // Fetch actions
  fetchWorkspaceWorkflows = async (workspaceSlug: string) => {
    try {
      const workflows = await this.workflowService.listWorkflows(workspaceSlug);
      runInAction(() => {
        const ids: string[] = [];
        workflows.forEach((workflow) => {
          this.workflowMap[workflow.id] = workflow;
          ids.push(workflow.id);
        });
        this.workflowIdsByWorkspace[workspaceSlug] = ids;
        this.fetchedWorkflowMap[workspaceSlug] = true;
      });
      return workflows;
    } catch (error) {
      console.error("Failed to fetch workflows:", error);
      throw error;
    }
  };

  fetchWorkspaceSchemes = async (workspaceSlug: string) => {
    try {
      const schemes = await this.workflowService.listSchemes(workspaceSlug);
      runInAction(() => {
        const ids: string[] = [];
        schemes.forEach((scheme) => {
          this.schemeMap[scheme.id] = scheme;
          ids.push(scheme.id);
        });
        this.schemeIdsByWorkspace[workspaceSlug] = ids;
        this.fetchedSchemeMap[workspaceSlug] = true;
      });
      return schemes;
    } catch (error) {
      console.error("Failed to fetch workflow schemes:", error);
      throw error;
    }
  };

  fetchWorkflow = async (workspaceSlug: string, workflowId: string) => {
    try {
      const workflow = await this.workflowService.getWorkflow(workspaceSlug, workflowId);
      runInAction(() => {
        this.workflowMap[workflow.id] = workflow;
      });
      return workflow;
    } catch (error) {
      console.error("Failed to fetch workflow:", error);
      throw error;
    }
  };

  fetchScheme = async (workspaceSlug: string, schemeId: string) => {
    try {
      const scheme = await this.workflowService.getScheme(workspaceSlug, schemeId);
      runInAction(() => {
        this.schemeMap[scheme.id] = scheme;
      });
      return scheme;
    } catch (error) {
      console.error("Failed to fetch workflow scheme:", error);
      throw error;
    }
  };

  // Workflow CRUD actions
  createWorkflow = async (workspaceSlug: string, data: Partial<IWorkflow>) => {
    try {
      const workflow = await this.workflowService.createWorkflow(workspaceSlug, data);
      runInAction(() => {
        this.workflowMap[workflow.id] = workflow;
        const ids = this.workflowIdsByWorkspace[workspaceSlug] ?? [];
        if (!ids.includes(workflow.id)) {
          this.workflowIdsByWorkspace[workspaceSlug] = [...ids, workflow.id];
        }
      });
      return workflow;
    } catch (error) {
      console.error("Failed to create workflow:", error);
      throw error;
    }
  };

  updateWorkflow = async (workspaceSlug: string, workflowId: string, data: Partial<IWorkflow>) => {
    try {
      const workflow = await this.workflowService.updateWorkflow(workspaceSlug, workflowId, data);
      runInAction(() => {
        this.workflowMap[workflow.id] = workflow;
      });
      return workflow;
    } catch (error) {
      console.error("Failed to update workflow:", error);
      throw error;
    }
  };

  deleteWorkflow = async (workspaceSlug: string, workflowId: string) => {
    try {
      await this.workflowService.deleteWorkflow(workspaceSlug, workflowId);
      runInAction(() => {
        delete this.workflowMap[workflowId];
        delete this.graphByWorkflow[workflowId];
        const workspaceSlug = this.router.workspaceSlug;
        if (workspaceSlug && this.workflowIdsByWorkspace[workspaceSlug]) {
          this.workflowIdsByWorkspace[workspaceSlug] = this.workflowIdsByWorkspace[workspaceSlug].filter(
            (id) => id !== workflowId
          );
        }
      });
    } catch (error) {
      console.error("Failed to delete workflow:", error);
      throw error;
    }
  };

  // Workflow graph actions
  getWorkflowGraph = async (workspaceSlug: string, workflowId: string) => {
    try {
      const graph = await this.workflowService.getGraph(workspaceSlug, workflowId);
      runInAction(() => {
        this.graphByWorkflow[workflowId] = graph;
      });
      return graph;
    } catch (error) {
      console.error("Failed to fetch workflow graph:", error);
      throw error;
    }
  };

  saveWorkflowGraph = async (workspaceSlug: string, workflowId: string, graph: TWorkflowGraph) => {
    try {
      const savedGraph = await this.workflowService.saveGraph(workspaceSlug, workflowId, graph);
      runInAction(() => {
        this.graphByWorkflow[workflowId] = savedGraph;
      });
      // Refresh workflow to get updated transitions
      await this.fetchWorkflow(workspaceSlug, workflowId);
      return savedGraph;
    } catch (error) {
      console.error("Failed to save workflow graph:", error);
      throw error;
    }
  };

  publishWorkflow = async (workspaceSlug: string, workflowId: string) => {
    try {
      const workflow = await this.workflowService.publishWorkflow(workspaceSlug, workflowId);
      runInAction(() => {
        this.workflowMap[workflow.id] = workflow;
      });
      return workflow;
    } catch (error) {
      console.error("Failed to publish workflow:", error);
      throw error;
    }
  };

  // Scheme CRUD actions
  createScheme = async (workspaceSlug: string, data: Partial<IWorkflowScheme>) => {
    try {
      const scheme = await this.workflowService.createScheme(workspaceSlug, data);
      runInAction(() => {
        this.schemeMap[scheme.id] = scheme;
        const ids = this.schemeIdsByWorkspace[workspaceSlug] ?? [];
        if (!ids.includes(scheme.id)) {
          this.schemeIdsByWorkspace[workspaceSlug] = [...ids, scheme.id];
        }
      });
      return scheme;
    } catch (error) {
      console.error("Failed to create workflow scheme:", error);
      throw error;
    }
  };

  saveSchemeEntries = async (
    workspaceSlug: string,
    schemeId: string,
    data: {
      name?: string;
      is_default?: boolean;
      entries: Array<{ issue_type?: string | null; workflow: string }>;
    }
  ) => {
    const scheme = await this.workflowService.saveSchemeEntries(workspaceSlug, schemeId, data);
    runInAction(() => {
      this.schemeMap[scheme.id] = scheme;
    });
    return scheme;
  };

  bootstrapSchemeFromProject = async (
    workspaceSlug: string,
    schemeId: string,
    data: {
      project_id: string;
      issue_type?: string | null;
      assign_project?: boolean;
      mode?: "linear" | "open";
      allow_back_transitions?: boolean;
    }
  ) => {
    const result = await this.workflowService.bootstrapSchemeFromProject(workspaceSlug, schemeId, data);
    runInAction(() => {
      this.schemeMap[result.scheme.id] = result.scheme;
      this.workflowMap[result.workflow_id] = this.workflowMap[result.workflow_id] ?? ({} as IWorkflow);
    });
    await this.fetchWorkspaceWorkflows(workspaceSlug);
    return result;
  };

  assignSchemeProjects = async (workspaceSlug: string, schemeId: string, projectIds: string[]) => {
    const result = await this.workflowService.assignSchemeProjects(workspaceSlug, schemeId, projectIds);
    await this.rootStore.projectRoot.project.fetchProjects(workspaceSlug);
    return result.project_ids;
  };

  updateScheme = async (workspaceSlug: string, schemeId: string, data: Partial<IWorkflowScheme>) => {
    try {
      const scheme = await this.workflowService.updateScheme(workspaceSlug, schemeId, data);
      runInAction(() => {
        this.schemeMap[scheme.id] = scheme;
      });
      return scheme;
    } catch (error) {
      console.error("Failed to update workflow scheme:", error);
      throw error;
    }
  };

  deleteScheme = async (workspaceSlug: string, schemeId: string) => {
    try {
      await this.workflowService.deleteScheme(workspaceSlug, schemeId);
      runInAction(() => {
        delete this.schemeMap[schemeId];
        if (this.schemeIdsByWorkspace[workspaceSlug]) {
          this.schemeIdsByWorkspace[workspaceSlug] = this.schemeIdsByWorkspace[workspaceSlug].filter(
            (id) => id !== schemeId
          );
        }
      });
    } catch (error) {
      console.error("Failed to delete workflow scheme:", error);
      throw error;
    }
  };

  // Issue transition actions
  getIssueTransitionsKey = (projectId: string, issueId: string) => `${projectId}:${issueId}`;

  fetchIssueTransitions = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const cacheKey = this.getIssueTransitionsKey(projectId, issueId);
    try {
      const { workflow_configured, transitions } = await this.workflowService.getIssueTransitions(
        workspaceSlug,
        projectId,
        issueId
      );
      runInAction(() => {
        this.transitionsByIssue[cacheKey] = transitions;
        this.workflowConfiguredByIssue[cacheKey] = workflow_configured;
        this.fetchedIssueTransitionsMap[cacheKey] = true;
      });
      return transitions;
    } catch (error) {
      console.error("Failed to fetch issue transitions:", error);
      runInAction(() => {
        this.transitionsByIssue[cacheKey] = [];
        this.workflowConfiguredByIssue[cacheKey] = false;
        this.fetchedIssueTransitionsMap[cacheKey] = true;
      });
      return [];
    }
  };

  getIssueTransitions = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const cacheKey = this.getIssueTransitionsKey(projectId, issueId);
    if (this.fetchedIssueTransitionsMap[cacheKey]) {
      return this.transitionsByIssue[cacheKey] ?? [];
    }
    return this.fetchIssueTransitions(workspaceSlug, projectId, issueId);
  };

  executeTransition = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    transitionId: string,
    payload: TTransitionExecutePayload
  ) => {
    try {
      const updatedIssue = await this.workflowService.executeTransition(
        workspaceSlug,
        projectId,
        issueId,
        transitionId,
        payload
      );
      if (updatedIssue?.id) {
        this.rootStore.issue.issues.addIssue([updatedIssue]);
      }
      // Refresh issue and available transitions for the new state
      await this.rootStore.issue.issueDetail.fetchIssue(workspaceSlug, projectId, issueId);
      await this.fetchIssueTransitions(workspaceSlug, projectId, issueId);
      return updatedIssue;
    } catch (error) {
      console.error("Failed to execute transition:", error);
      throw error;
    }
  };
}
