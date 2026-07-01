import type { TStateGroups } from "./state";

export type TWorkflowBootstrapMode = "linear" | "open";
export type TWorkflowBackTransitionMode = "none" | "adjacent" | "last_only";

export type TTransitionRule = {
  type: string;
  config: Record<string, unknown>;
};

export type TTransitionScreen = {
  fields: Array<{ field_id: string; required: boolean }>;
};

export type TWorkflowGraphNode = {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: {
    state_id: string;
    name: string;
    color: string;
    group: string;
    is_initial?: boolean;
  };
};

export type TWorkflowGraphEdge = {
  id: string;
  source: string;
  target: string;
  type?: string;
  data: {
    name: string;
    is_global: boolean;
    conditions: TTransitionRule[];
    validators: TTransitionRule[];
    post_functions: TTransitionRule[];
    screen?: TTransitionScreen;
    pathOffset?: number;
  };
};

export type TWorkflowGraph = {
  nodes: TWorkflowGraphNode[];
  edges: TWorkflowGraphEdge[];
};

export type IWorkflowTransition = {
  id: string;
  workflow: string;
  from_state: string | null;
  to_state: string;
  name: string;
  is_global: boolean;
  sort_order: number;
  conditions: TTransitionRule[];
  validators: TTransitionRule[];
  post_functions: TTransitionRule[];
  screen: TTransitionScreen | null;
  created_at: string;
  updated_at: string;
};

export type IWorkflow = {
  id: string;
  workspace: string;
  name: string;
  description: string;
  is_active: boolean;
  is_draft: boolean;
  initial_state: string | null;
  published_at: string | null;
  published_version: number;
  published_graph: TWorkflowGraph | null;
  transitions: IWorkflowTransition[];
  created_at: string;
  updated_at: string;
};

export type IWorkflowSchemeEntry = {
  id: string;
  scheme: string;
  issue_type: string | null;
  workflow: string;
  created_at: string;
  updated_at: string;
};

export type IWorkflowScheme = {
  id: string;
  workspace: string;
  name: string;
  is_default: boolean;
  entries: IWorkflowSchemeEntry[];
  created_at: string;
  updated_at: string;
};

export type IIssueTransition = {
  id: string;
  name: string;
  to_state_id: string;
  to_state_name: string;
  to_state_group: TStateGroups;
  screen: TTransitionScreen | null;
};

export type IIssueTransitionsResponse = {
  workflow_configured: boolean;
  transitions: IIssueTransition[];
};

export type TTransitionExecutePayload = {
  comment?: string;
  fields?: Record<string, unknown>;
};

export type TTransitionExecutionError = {
  error: string;
  fields?: Record<string, unknown>;
};
