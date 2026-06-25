import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EIssueServiceType } from "@operis/types";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useIssues } from "@/hooks/store/use-issues";
import { useIssueStoreType } from "@/hooks/use-issue-layout-store";
import type { GanttStoreType } from "./base-gantt-root";

export type TGanttDisplayRow = {
  issueId: string;
  nestingLevel: number;
};

type TGanttSubIssueExpansionContext = {
  displayRows: TGanttDisplayRow[];
  displayBlockIds: string[];
  isTreeMode: boolean;
  isExpanded: (issueId: string) => boolean;
  toggleExpanded: (issueId: string, projectId: string) => void;
};

const GanttSubIssueExpansionContext = createContext<TGanttSubIssueExpansionContext | null>(null);

type ProviderProps = {
  children: ReactNode;
  issueIds: string[];
  isEpic?: boolean;
};

export const GanttSubIssueExpansionProvider = observer(function GanttSubIssueExpansionProvider(props: ProviderProps) {
  const { children, issueIds, isEpic = false } = props;
  const { workspaceSlug } = useParams();
  const storeType = useIssueStoreType() as GanttStoreType;
  const { issuesFilter } = useIssues(storeType);
  const {
    issue: { getIssueById },
    subIssues: subIssuesStore,
  } = useIssueDetail(isEpic ? EIssueServiceType.EPICS : EIssueServiceType.ISSUES);

  const [expandedIssueIds, setExpandedIssueIds] = useState<Set<string>>(() => new Set());

  const isShowSubIssuesFlat = issuesFilter.issueFilters?.displayFilters?.sub_issue ?? false;
  const isTreeMode = !isEpic && !isShowSubIssuesFlat;

  const rootIssueIds = useMemo(() => {
    if (!isTreeMode) return issueIds;
    return issueIds.filter((id) => !getIssueById(id)?.parent_id);
  }, [getIssueById, isTreeMode, issueIds]);

  const isExpanded = useCallback((issueId: string) => expandedIssueIds.has(issueId), [expandedIssueIds]);

  const toggleExpanded = useCallback(
    (issueId: string, projectId: string) => {
      setExpandedIssueIds((prev) => {
        const next = new Set(prev);
        if (next.has(issueId)) {
          next.delete(issueId);
          return next;
        }
        next.add(issueId);
        return next;
      });

      if (workspaceSlug && projectId && !expandedIssueIds.has(issueId)) {
        void subIssuesStore.fetchSubIssues(workspaceSlug.toString(), projectId, issueId);
      }
    },
    [expandedIssueIds, subIssuesStore, workspaceSlug]
  );

  // Computed inline so MobX tracks subIssuesByIssueId reads (useMemo would cache stale rows after fetch).
  const displayRows: TGanttDisplayRow[] = (() => {
    if (!isTreeMode) {
      return issueIds.map((issueId) => ({ issueId, nestingLevel: 0 }));
    }

    const rows: TGanttDisplayRow[] = [];

    const walk = (ids: string[], nestingLevel: number) => {
      for (const issueId of ids) {
        rows.push({ issueId, nestingLevel });
        if (expandedIssueIds.has(issueId)) {
          const subIds = subIssuesStore.subIssuesByIssueId(issueId) ?? [];
          if (subIds.length > 0) walk(subIds, nestingLevel + 1);
        }
      }
    };

    walk(rootIssueIds, 0);
    return rows;
  })();

  const displayBlockIds = displayRows.map((row) => row.issueId);

  const value = useMemo(
    () => ({
      displayRows,
      displayBlockIds,
      isTreeMode,
      isExpanded,
      toggleExpanded,
    }),
    [displayBlockIds, displayRows, isExpanded, isTreeMode, toggleExpanded]
  );

  return <GanttSubIssueExpansionContext.Provider value={value}>{children}</GanttSubIssueExpansionContext.Provider>;
});

export function useGanttSubIssueExpansion(): TGanttSubIssueExpansionContext {
  const ctx = useContext(GanttSubIssueExpansionContext);
  if (!ctx) {
    throw new Error("useGanttSubIssueExpansion must be used within GanttSubIssueExpansionProvider");
  }
  return ctx;
}

export function useGanttSubIssueExpansionOptional(): TGanttSubIssueExpansionContext | null {
  return useContext(GanttSubIssueExpansionContext);
}
