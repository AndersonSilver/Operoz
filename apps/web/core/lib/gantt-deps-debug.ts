import type { TIssue, TIssuesResponse } from "@operoz/types";

const LOG_PREFIX = "[Gantt deps]";

function flattenIssuesFromResponse(response: TIssuesResponse | undefined): TIssue[] {
  if (!response?.results) return [];
  if (Array.isArray(response.results)) return response.results;

  const issues: TIssue[] = [];
  for (const group of Object.values(response.results)) {
    const groupResults = group?.results;
    if (Array.isArray(groupResults)) {
      issues.push(...groupResults);
      continue;
    }
    if (groupResults && typeof groupResults === "object") {
      for (const subGroup of Object.values(groupResults)) {
        const subResults = subGroup?.results;
        if (Array.isArray(subResults)) issues.push(...subResults);
      }
    }
  }
  return issues;
}

function issueHasRelationExpand(issue: TIssue): boolean {
  return "issue_relation" in issue || "issue_related" in issue;
}

function summarizeRelations(issue: TIssue) {
  const relationCount = Array.isArray(issue.issue_relation) ? issue.issue_relation.length : 0;
  const relatedCount = Array.isArray(issue.issue_related) ? issue.issue_related.length : 0;
  return { relationCount, relatedCount };
}

/** Log before fetch — filter DevTools console by "[Gantt deps]". */
export function logGanttDependencyRequest(
  source: "board" | "project" | "workspace",
  method: string,
  url: string,
  params: Record<string, unknown>
) {
  const expand = params.expand;
  if (!expand || !String(expand).includes("issue_relation")) return;

  console.groupCollapsed(`${LOG_PREFIX} REQUEST → ${method} ${url}`);
  console.log("origem:", source);
  console.log("expand:", expand);
  console.log("query params:", params);
  console.log("dica Network: filtre por", url.split("?")[0], 'ou por "issue_relation" na query string');
  console.groupEnd();
}

/** Log after fetch — shows how many issues returned relation expand fields. */
export function logGanttDependencyResponse(
  source: "board" | "project" | "workspace",
  url: string,
  response: TIssuesResponse | undefined
) {
  const issues = flattenIssuesFromResponse(response);
  const withExpand = issues.filter(issueHasRelationExpand);
  const withAnyRelation = withExpand.filter((issue) => {
    const { relationCount, relatedCount } = summarizeRelations(issue);
    return relationCount > 0 || relatedCount > 0;
  });

  console.group(`${LOG_PREFIX} RESPONSE ← ${url}`);
  console.log("origem:", source);
  console.log("total issues:", issues.length);
  console.log("com campos issue_relation/issue_related no JSON:", withExpand.length);
  console.log("com pelo menos 1 relação:", withAnyRelation.length);

  if (withAnyRelation.length > 0) {
    console.table(
      withAnyRelation.slice(0, 20).map((issue) => ({
        id: issue.id,
        name: issue.name?.slice(0, 40),
        ...summarizeRelations(issue),
      }))
    );
    if (withAnyRelation.length > 20) {
      console.log(`… e mais ${withAnyRelation.length - 20} issues com relação`);
    }
  } else if (issues.length > 0 && withExpand.length === 0) {
    console.warn(
      `${LOG_PREFIX} A rota respondeu issues mas NENHUM trouxe issue_relation/issue_related — verifique expand no back.`
    );
  } else if (issues.length > 0 && withAnyRelation.length === 0) {
    console.info(
      `${LOG_PREFIX} expand presente em ${withExpand.length}/${issues.length} issues, mas nenhuma relação blocked_by/blocking nesta página (sub-issues podem estar noutro fetch).`
    );
  }

  console.groupEnd();
}
