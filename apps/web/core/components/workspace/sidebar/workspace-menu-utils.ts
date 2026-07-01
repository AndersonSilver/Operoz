import type { IWorkspace } from "@operoz/types";

/** Nomes iguais ignorando maiúsculas (ex.: OPEROZ + Operoz). */
export function hasAmbiguousWorkspaceNames(workspaces: IWorkspace[]) {
  const normalized = workspaces.map((w) => w.name.trim().toLowerCase());
  return normalized.length !== new Set(normalized).size;
}

export function getOtherWorkspaces(workspaces: IWorkspace[], activeId?: string) {
  return workspaces.filter((workspace) => workspace.id !== activeId);
}
