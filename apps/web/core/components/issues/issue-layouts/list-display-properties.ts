import type { IIssueDisplayProperties } from "@operoz/types";
import { EIssueLayoutTypes, EIssuesStoreType } from "@operoz/types";
import {
  resolveBoardListDisplayProperties,
  resolveSpreadsheetDisplayProperties,
} from "@/store/issue/board/board-list-display-properties";
import { useIssues } from "@/hooks/store/use-issues";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";

export { resolveBoardListDisplayProperties, resolveSpreadsheetDisplayProperties };

/** Propriedades de card/linha alinhadas ao board (lê `filters[viewId]` no módulo/board). */
export function useBoardAlignedDisplayProperties(
  viewId?: string,
  options?: { layout?: EIssueLayoutTypes }
): IIssueDisplayProperties | undefined {
  const storeType = useIssueStoreType();
  const { issuesFilter } = useIssues(storeType);
  const filters = "filters" in issuesFilter ? issuesFilter.filters : undefined;

  const layoutFromFilters =
    (viewId && filters?.[viewId]?.displayFilters?.layout) || issuesFilter?.issueFilters?.displayFilters?.layout;
  const layout = options?.layout ?? layoutFromFilters;

  const rawDisplayProperties =
    storeType === EIssuesStoreType.MODULE || storeType === EIssuesStoreType.BOARD
      ? viewId && filters?.[viewId]?.displayProperties
        ? filters[viewId].displayProperties
        : issuesFilter?.issueFilters?.displayProperties
      : issuesFilter?.issueFilters?.displayProperties;

  let resolved: IIssueDisplayProperties | undefined;

  if (storeType === EIssuesStoreType.MODULE || storeType === EIssuesStoreType.BOARD) {
    resolved = resolveBoardListDisplayProperties(rawDisplayProperties);
  } else {
    resolved = issuesFilter?.issueFilters?.displayProperties;
  }

  if (layout === EIssueLayoutTypes.SPREADSHEET) {
    return resolveSpreadsheetDisplayProperties(resolved);
  }

  return resolved;
}

/** Módulo/projeto: uma coluna por estado do fluxo (Backlog, Todo, In Progress, …). */
export const MODULE_KANBAN_GROUP_BY = "state" as const;
