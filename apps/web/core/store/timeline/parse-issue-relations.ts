import type { TIssue, TIssueRelationMap } from "@operoz/types";
import { REVERSE_RELATIONS } from "@/constants/gantt-chart";
import type { TIssueRelationTypes } from "@/plane-web/types";

export type TIssueRelationIdsByType = { [key in TIssueRelationTypes]?: string[] };

/** True when the list API included relation expand fields on this issue payload. */
export function issuePayloadIncludesRelations(issue: TIssue): boolean {
  return "issue_relation" in issue || "issue_related" in issue;
}

/** Parses blocked_by / blocking ids from issue list expand fields. */
export function parseIssueRelationsFromPayload(issue: TIssue): TIssueRelationIdsByType {
  const { issue_relation, issue_related } = issue;
  const issueRelations: TIssueRelationIdsByType = {};

  if (issue_relation && Array.isArray(issue_relation) && issue_relation.length) {
    for (const relation of issue_relation) {
      const { relation_type, id } = relation;
      if (!relation_type) continue;
      if (issueRelations[relation_type]) issueRelations[relation_type]?.push(id);
      else issueRelations[relation_type] = [id];
    }
  }

  if (issue_related && Array.isArray(issue_related) && issue_related.length) {
    for (const relation of issue_related) {
      const { relation_type, id } = relation;
      if (!relation_type) continue;
      const reverseRelatedType = REVERSE_RELATIONS[relation_type as TIssueRelationTypes];
      if (issueRelations[reverseRelatedType]) issueRelations[reverseRelatedType]?.push(id);
      else issueRelations[reverseRelatedType] = [id];
    }
  }

  return issueRelations;
}

export function resolveBlockingAndBlockedByIds(
  relationMap: TIssueRelationMap,
  blockId: string,
  issue?: TIssue
): { blockingIds: string[]; blockedByIds: string[] } {
  const fromMap = relationMap[blockId];
  let blockingIds = fromMap?.blocking ?? [];
  let blockedByIds = fromMap?.blocked_by ?? [];

  if (issue && issuePayloadIncludesRelations(issue)) {
    const parsed = parseIssueRelationsFromPayload(issue);
    blockingIds = parsed.blocking ?? blockingIds;
    blockedByIds = parsed.blocked_by ?? blockedByIds;
  }

  return { blockingIds, blockedByIds };
}
