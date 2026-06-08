import type { IWorkspace } from "@operis/types";

/** Nomes iguais ignorando maiúsculas (ex.: OPERIS + Operis). */
export function hasAmbiguousWorkspaceNames(workspaces: IWorkspace[]) {
  const normalized = workspaces.map((w) => w.name.trim().toLowerCase());
  return normalized.length !== new Set(normalized).size;
}

export function getOtherWorkspaces(workspaces: IWorkspace[], activeId?: string) {
  return workspaces.filter((workspace) => workspace.id !== activeId);
}
