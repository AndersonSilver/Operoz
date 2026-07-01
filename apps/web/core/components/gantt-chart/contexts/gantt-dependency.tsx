import { createContext, useContext } from "react";

export type OnCreateDependencyFn = (sourceBlockId: string, targetBlockId: string) => Promise<void>;
export type OnDeleteDependencyFn = (sourceBlockId: string, predecessorBlockId: string) => Promise<void>;

type GanttDependencyContextValue = {
  onCreateDependency: OnCreateDependencyFn | undefined;
  onDeleteDependency: OnDeleteDependencyFn | undefined;
};

export const GanttDependencyContext = createContext<GanttDependencyContextValue>({
  onCreateDependency: undefined,
  onDeleteDependency: undefined,
});

/**
 * Returns the dependency callbacks provided by the nearest GanttDependencyContext.
 * Safe to call even when dependency is disabled — returns undefined callbacks.
 */
export const useGanttDependency = () => useContext(GanttDependencyContext);
