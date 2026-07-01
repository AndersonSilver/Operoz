// plane imports
import type { IWorkItemFilterInstance } from "@operoz/shared-state";
import type { EIssuesStoreType } from "@operoz/types";
// local imports
import { useWorkItemFilters } from "./use-work-item-filters";

export const useWorkItemFilterInstance = (
  entityType: EIssuesStoreType,
  entityId: string | undefined
): IWorkItemFilterInstance | undefined => {
  const { getFilter } = useWorkItemFilters();
  return entityId ? getFilter(entityType, entityId) : undefined;
};
