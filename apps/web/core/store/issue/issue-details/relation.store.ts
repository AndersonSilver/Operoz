import { uniq, get, isEqual } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import type { TIssueRelationIdMap, TIssueRelationMap, TIssueRelation, TIssue } from "@operoz/types";
// components
import type { TRelationObject } from "@/components/issues/issue-detail-widgets/relations";
// Plane-web
import { REVERSE_RELATIONS } from "@/constants/gantt-chart";
import { issuePayloadIncludesRelations, parseIssueRelationsFromPayload } from "@/store/timeline/parse-issue-relations";
import type { TIssueRelationTypes } from "@/plane-web/types";
// services
import { IssueRelationService } from "@/services/issue";
// types
import type { IIssueDetail } from "./root.store";
export interface IIssueRelationStoreActions {
  // actions
  fetchRelations: (workspaceSlug: string, projectId: string, issueId: string) => Promise<TIssueRelation>;
  fetchRelationsForIssues: (workspaceSlug: string, projectId: string, issueIds: string[]) => Promise<void>;
  createRelation: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    relationType: TIssueRelationTypes,
    issues: string[]
  ) => Promise<TIssue[]>;
  removeRelation: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    relationType: TIssueRelationTypes,
    related_issue: string,
    updateLocally?: boolean
  ) => Promise<void>;
}

export interface IIssueRelationStore extends IIssueRelationStoreActions {
  // observables
  relationMap: TIssueRelationMap; // Record defines relationType as key and reactions as value
  // computed
  issueRelations: TIssueRelationIdMap | undefined;
  // helper methods
  getRelationsByIssueId: (issueId: string) => TIssueRelationIdMap | undefined;
  getRelationCountByIssueId: (
    issueId: string,
    ISSUE_RELATION_OPTIONS: { [key in TIssueRelationTypes]?: TRelationObject }
  ) => number;
  getRelationByIssueIdRelationType: (issueId: string, relationType: TIssueRelationTypes) => string[] | undefined;
  extractRelationsFromIssues: (issues: TIssue[]) => void;
  createCurrentRelation: (issueId: string, relationType: TIssueRelationTypes, relatedIssueId: string) => Promise<void>;
}

export class IssueRelationStore implements IIssueRelationStore {
  // observables
  relationMap: TIssueRelationMap = {};
  /** Issue ids whose relations were loaded via issue-relation API (sub-issues list omits expand). */
  private hydratedRelationIssueIds = new Set<string>();
  // root store
  rootIssueDetailStore: IIssueDetail;
  // services
  issueRelationService;

  constructor(rootStore: IIssueDetail) {
    makeObservable(this, {
      // observables
      relationMap: observable,
      // computed
      issueRelations: computed,
      // actions
      fetchRelations: action,
      fetchRelationsForIssues: action,
      createRelation: action,
      createCurrentRelation: action,
      removeRelation: action,
      extractRelationsFromIssues: action,
    });
    // root store
    this.rootIssueDetailStore = rootStore;
    // services
    this.issueRelationService = new IssueRelationService();
  }

  // computed
  get issueRelations() {
    const issueId = this.rootIssueDetailStore.peekIssue?.issueId;
    if (!issueId) return undefined;
    return this.relationMap?.[issueId] ?? undefined;
  }

  // // helper methods
  getRelationsByIssueId = (issueId: string) => {
    if (!issueId) return undefined;
    return this.relationMap?.[issueId] ?? undefined;
  };

  getRelationCountByIssueId = computedFn(
    (issueId: string, ISSUE_RELATION_OPTIONS: { [key in TIssueRelationTypes]?: TRelationObject }) => {
      const issueRelations = this.getRelationsByIssueId(issueId);

      const issueRelationKeys = (Object.keys(issueRelations ?? {}) as TIssueRelationTypes[]).filter(
        (relationKey) => !!ISSUE_RELATION_OPTIONS[relationKey]
      );

      return issueRelationKeys.reduce((acc, curr) => acc + (issueRelations?.[curr]?.length ?? 0), 0);
    }
  );

  getRelationByIssueIdRelationType = (issueId: string, relationType: TIssueRelationTypes) => {
    if (!issueId || !relationType) return undefined;
    return this.relationMap?.[issueId]?.[relationType] ?? undefined;
  };

  /** MobX-safe merge — lodash `set` on relationMap can miss dependency sync observers. */
  private assignIssueRelations(issueId: string, partial: Partial<TIssueRelationIdMap>) {
    this.relationMap[issueId] = {
      ...(this.relationMap[issueId] ?? {}),
      ...partial,
    } as TIssueRelationIdMap;
  }

  private appendReverseRelation(relatedId: string, reverseRelatedType: TIssueRelationTypes, issueId: string) {
    const existing = this.relationMap[relatedId]?.[reverseRelatedType] ?? [];
    if (existing.includes(issueId)) return;
    this.assignIssueRelations(relatedId, {
      [reverseRelatedType]: uniq([...existing, issueId]),
    });
  }

  // actions
  fetchRelations = async (workspaceSlug: string, projectId: string, issueId: string) => {
    const response = await this.issueRelationService.listIssueRelations(workspaceSlug, projectId, issueId);

    runInAction(() => {
      Object.keys(response).forEach((key) => {
        const relation_key = key as TIssueRelationTypes;
        const relation_issues = response[relation_key];
        const issues = relation_issues.flat().map((issue) => issue);
        if (issues && issues.length > 0) this.rootIssueDetailStore.rootIssueStore.issues.addIssue(issues);
        const relatedIds = issues && issues.length > 0 ? issues.map((issue) => issue.id) : [];
        this.assignIssueRelations(issueId, { [relation_key]: relatedIds });

        const reverseRelatedType = REVERSE_RELATIONS[relation_key];
        for (const relatedId of relatedIds) {
          this.appendReverseRelation(relatedId, reverseRelatedType, issueId);
        }
      });
    });

    runInAction(() => {
      this.hydratedRelationIssueIds.add(issueId);
    });

    return response;
  };

  /**
   * Loads relations for many issues (e.g. Gantt sub-issues). The sub-issues endpoint
   * does not include issue_relation expand, so dependency lines need this hydration.
   */
  fetchRelationsForIssues = async (workspaceSlug: string, projectId: string, issueIds: string[]) => {
    const pending = uniq(issueIds).filter((id) => id && !this.hydratedRelationIssueIds.has(id));
    if (!pending.length) return;

    await Promise.all(
      pending.map((issueId) =>
        this.fetchRelations(workspaceSlug, projectId, issueId).catch(() => {
          // Mark as attempted so a single failure does not block retries for siblings.
          runInAction(() => {
            this.hydratedRelationIssueIds.add(issueId);
          });
        })
      )
    );
  };

  createRelation = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    relationType: TIssueRelationTypes,
    issues: string[]
  ) => {
    const response = await this.issueRelationService.createIssueRelations(workspaceSlug, projectId, issueId, {
      relation_type: relationType,
      issues,
    });

    const reverseRelatedType = REVERSE_RELATIONS[relationType];

    const issuesOfRelation = get(this.relationMap, [issueId, relationType]) ?? [];

    if (response && response.length > 0)
      runInAction(() => {
        response.forEach((issue) => {
          this.rootIssueDetailStore.rootIssueStore.issues.addIssue([issue]);
          issuesOfRelation.push(issue.id);
          this.appendReverseRelation(issue.id, reverseRelatedType, issueId);
        });
        this.assignIssueRelations(issueId, { [relationType]: uniq(issuesOfRelation) });
      });

    // fetching activity
    this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    return response;
  };

  /**
   * create Relation in current project optimistically
   * @param issueId
   * @param relationType
   * @param relatedIssueId
   * @returns
   */
  createCurrentRelation = async (issueId: string, relationType: TIssueRelationTypes, relatedIssueId: string) => {
    const workspaceSlug = this.rootIssueDetailStore.rootIssueStore.workspaceSlug;
    const projectId = this.rootIssueDetailStore.issue.getIssueById(issueId)?.project_id;

    if (!workspaceSlug || !projectId) return;

    const reverseRelatedType = REVERSE_RELATIONS[relationType];

    const issuesOfRelation = get(this.relationMap, [issueId, relationType]);
    const issuesOfRelated = get(this.relationMap, [relatedIssueId, reverseRelatedType]);

    try {
      // update relations before API call
      runInAction(() => {
        this.assignIssueRelations(issueId, {
          [relationType]: issuesOfRelation ? uniq([...issuesOfRelation, relatedIssueId]) : [relatedIssueId],
        });
        this.assignIssueRelations(relatedIssueId, {
          [reverseRelatedType]: issuesOfRelated ? uniq([...issuesOfRelated, issueId]) : [issueId],
        });
      });

      // perform API call
      await this.issueRelationService.createIssueRelations(workspaceSlug, projectId, issueId, {
        relation_type: relationType,
        issues: [relatedIssueId],
      });
    } catch (e) {
      // Revert back store changes if API fails
      runInAction(() => {
        if (issuesOfRelation) {
          this.assignIssueRelations(issueId, { [relationType]: issuesOfRelation });
        } else {
          const next = { ...(this.relationMap[issueId] ?? {}) };
          delete next[relationType];
          this.relationMap[issueId] = next;
        }

        if (issuesOfRelated) {
          this.assignIssueRelations(relatedIssueId, { [reverseRelatedType]: issuesOfRelated });
        } else {
          const next = { ...(this.relationMap[relatedIssueId] ?? {}) };
          delete next[reverseRelatedType];
          this.relationMap[relatedIssueId] = next;
        }
      });

      throw e;
    }
  };

  removeRelation = async (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    relationType: TIssueRelationTypes,
    related_issue: string,
    updateLocally = false
  ) => {
    try {
      const relationIndex = this.relationMap[issueId]?.[relationType]?.findIndex(
        (_issueId) => _issueId === related_issue
      );
      if (relationIndex >= 0)
        runInAction(() => {
          this.relationMap[issueId]?.[relationType]?.splice(relationIndex, 1);
        });

      if (!updateLocally) {
        await this.issueRelationService.deleteIssueRelation(workspaceSlug, projectId, issueId, {
          relation_type: relationType,
          related_issue,
        });
      }

      // While removing one relation, reverse of the relation should also be removed
      const reverseRelatedType = REVERSE_RELATIONS[relationType];
      const relatedIndex = this.relationMap[related_issue]?.[reverseRelatedType]?.findIndex(
        (_issueId) => _issueId === related_issue
      );
      if (relationIndex >= 0)
        runInAction(() => {
          this.relationMap[related_issue]?.[reverseRelatedType]?.splice(relatedIndex, 1);
        });

      // fetching activity
      this.rootIssueDetailStore.activity.fetchActivities(workspaceSlug, projectId, issueId);
    } catch (error) {
      this.fetchRelations(workspaceSlug, projectId, issueId);
      throw error;
    }
  };

  /**
   * Extract Relation from the issue Array objects and store it in this Store
   * @param issues
   */
  extractRelationsFromIssues = (issues: TIssue[]) => {
    try {
      runInAction(() => {
        for (const issue of issues) {
          // List responses without expand omit these keys — do not wipe relationMap entries.
          if (!issuePayloadIncludesRelations(issue)) continue;

          const issueRelations = parseIssueRelationsFromPayload(issue);
          const existing = this.relationMap[issue.id];
          if (isEqual(existing, issueRelations)) continue;

          // Direct assignment so MobX reliably notifies observers (lodash set can miss).
          this.relationMap[issue.id] = issueRelations as TIssueRelationIdMap;
        }
      });
    } catch (_e) {
      console.error("Error while extracting issue relations from issues");
    }
  };
}
