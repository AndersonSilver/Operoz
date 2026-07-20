import { clone, set } from "lodash-es";
import { makeObservable, observable, runInAction, action } from "mobx";
import type {
  TInboxIssue,
  TInboxIssueStatus,
  EInboxIssueSource,
  TIssue,
  TInboxDuplicateIssueDetails,
  TInboxIssueDeclineCategory,
  TInboxIssueSupportUpdatePayload,
  TSupportTicketMetadata,
  TIntakeOutcome,
} from "@operoz/types";
import { EInboxIssueStatus } from "@operoz/types";
import { getPendingCountKey } from "@/utils/inbox-hub";
// helpers
// services
import { InboxIssueService } from "@/services/inbox";
import { IssueService } from "@/services/issue";
// store
import type { CoreRootStore } from "../root.store";

export interface IInboxIssueStore {
  isLoading: boolean;
  id: string;
  status: TInboxIssueStatus;
  issue: Partial<TIssue>;
  snoozed_till: Date | undefined;
  source: EInboxIssueSource | undefined;
  duplicate_to: string | undefined;
  created_by: string | undefined;
  duplicate_issue_detail: TInboxDuplicateIssueDetails | undefined;
  support_ticket: TSupportTicketMetadata | undefined;
  outcome: TIntakeOutcome | null | undefined;
  converted_to_issue: string | null | undefined;
  // actions
  updateInboxIssueStatus: (status: TInboxIssueStatus) => Promise<void>; // accept, decline
  acceptInboxIssue: (queueId?: string, destinationProjectId?: string) => Promise<void>;
  closeInboxIssue: (resolutionNote?: string) => Promise<void>;
  declineInboxIssue: (category: TInboxIssueDeclineCategory, reason: string) => Promise<void>;
  reopenInboxIssue: () => Promise<void>;
  consultingInboxIssue: (note: string) => Promise<void>;
  deferInboxIssue: (reason?: string) => Promise<void>;
  updateInboxIssueDuplicateTo: (issueId: string) => Promise<void>; // connecting the inbox issue to the project existing issue
  updateInboxIssueSnoozeTill: (date: Date | undefined, snoozeReason?: string) => Promise<void>; // snooze the issue
  updateSupportTicket: (payload: TInboxIssueSupportUpdatePayload) => Promise<void>;
  updateIssue: (issue: Partial<TIssue>) => Promise<void>; // updating the issue
  updateProjectIssue: (issue: Partial<TIssue>) => Promise<void>; // updating the issue
  fetchIssueActivity: () => Promise<void>; // fetching the issue activity
}

export class InboxIssueStore implements IInboxIssueStore {
  // observables
  isLoading: boolean = false;
  id: string;
  status: TInboxIssueStatus = EInboxIssueStatus.PENDING;
  issue: Partial<TIssue> = {};
  snoozed_till: Date | undefined;
  source: EInboxIssueSource | undefined;
  duplicate_to: string | undefined;
  created_by: string | undefined;
  duplicate_issue_detail: TInboxDuplicateIssueDetails | undefined = undefined;
  support_ticket: TSupportTicketMetadata | undefined = undefined;
  outcome: TIntakeOutcome | null | undefined = undefined;
  converted_to_issue: string | null | undefined = undefined;
  workspaceSlug: string;
  projectId: string;
  // services
  inboxIssueService;
  issueService;

  constructor(
    workspaceSlug: string,
    projectId: string,
    data: TInboxIssue,
    private store: CoreRootStore
  ) {
    this.id = data.id;
    this.status = data.status;
    this.issue = data?.issue;
    this.snoozed_till = data?.snoozed_till || undefined;
    this.duplicate_to = data?.duplicate_to || undefined;
    this.created_by = data?.created_by || undefined;
    this.source = data?.source || undefined;
    this.duplicate_issue_detail = data?.duplicate_issue_detail || undefined;
    this.support_ticket = data?.support_ticket || undefined;
    this.outcome = data?.outcome ?? undefined;
    this.converted_to_issue = data?.converted_to_issue ?? undefined;
    this.workspaceSlug = workspaceSlug;
    this.projectId = projectId;
    // services
    this.inboxIssueService = new InboxIssueService();
    this.issueService = new IssueService();
    // observable variables should be defined after the initialization of the values
    makeObservable(this, {
      id: observable,
      status: observable,
      issue: observable,
      snoozed_till: observable,
      duplicate_to: observable,
      duplicate_issue_detail: observable,
      support_ticket: observable,
      created_by: observable,
      source: observable,
      outcome: observable,
      converted_to_issue: observable,
      // actions
      updateInboxIssueStatus: action,
      acceptInboxIssue: action,
      closeInboxIssue: action,
      declineInboxIssue: action,
      reopenInboxIssue: action,
      consultingInboxIssue: action,
      deferInboxIssue: action,
      updateInboxIssueDuplicateTo: action,
      updateInboxIssueSnoozeTill: action,
      updateSupportTicket: action,
      updateIssue: action,
      updateProjectIssue: action,
      fetchIssueActivity: action,
    });
  }

  private adjustPendingCount = (delta: number) => {
    const countKey = getPendingCountKey(this.store.projectInbox.hubMode);
    const currentCount = this.store.projectRoot.project.projectMap[this.projectId]?.[countKey] ?? 0;
    set(this.store.projectRoot.project.projectMap, [this.projectId, countKey], Math.max(0, currentCount + delta));
  };

  acceptInboxIssue = async (queueId?: string, destinationProjectId?: string) => {
    if (!this.issue.id) return;
    const previousStatus = this.status;
    const payload: Partial<TInboxIssue> & { destination_project_id?: string } = {
      status: EInboxIssueStatus.ACCEPTED,
    };
    if (queueId) payload.queue_id = queueId;
    if (destinationProjectId) payload.destination_project_id = destinationProjectId;
    const inboxIssue = await this.inboxIssueService.update(this.workspaceSlug, this.projectId, this.issue.id, payload);
    runInAction(() => {
      set(this, "status", inboxIssue?.status);
      if (inboxIssue?.support_ticket) set(this, "support_ticket", inboxIssue.support_ticket);
      if (previousStatus === EInboxIssueStatus.PENDING) this.adjustPendingCount(-1);
    });
  };

  closeInboxIssue = async (resolutionNote?: string) => {
    if (!this.issue.id) return;
    const inboxIssue = await this.inboxIssueService.update(this.workspaceSlug, this.projectId, this.issue.id, {
      status: EInboxIssueStatus.CLOSED,
      resolution_note: resolutionNote || undefined,
    });
    runInAction(() => {
      set(this, "status", inboxIssue?.status);
      if (inboxIssue?.support_ticket) set(this, "support_ticket", inboxIssue.support_ticket);
    });
  };

  updateInboxIssueStatus = async (status: TInboxIssueStatus) => {
    const previousData: Partial<TInboxIssue> = {
      status: this.status,
    };
    const previousStatus = this.status;

    try {
      if (!this.issue.id) return;

      const inboxIssue = await this.inboxIssueService.update(this.workspaceSlug, this.projectId, this.issue.id, {
        status: status,
      });
      runInAction(() => {
        set(this, "status", inboxIssue?.status);
        if (inboxIssue?.support_ticket) set(this, "support_ticket", inboxIssue.support_ticket);

        if (previousStatus === EInboxIssueStatus.PENDING && inboxIssue.status !== EInboxIssueStatus.PENDING) {
          this.adjustPendingCount(-1);
        } else if (previousStatus !== EInboxIssueStatus.PENDING && inboxIssue.status === EInboxIssueStatus.PENDING) {
          this.adjustPendingCount(1);
        }
      });

      // Update counts
      const currentTotalResults = this.store.projectInbox.inboxIssuePaginationInfo?.total_results ?? 0;
      const updatedCount = currentTotalResults > 0 ? currentTotalResults - 1 : currentTotalResults;
      set(this.store.projectInbox, ["inboxIssuePaginationInfo", "total_results"], updatedCount);
    } catch {
      runInAction(() => set(this, "status", previousData.status));
    }
  };

  declineInboxIssue = async (category: TInboxIssueDeclineCategory, reason: string) => {
    if (!this.issue.id) return;
    const previousStatus = this.status;
    const inboxIssue = await this.inboxIssueService.update(this.workspaceSlug, this.projectId, this.issue.id, {
      status: EInboxIssueStatus.DECLINED,
      decline_category: category,
      decline_reason: reason,
    });
    runInAction(() => {
      set(this, "status", inboxIssue?.status);
      if (inboxIssue?.support_ticket) set(this, "support_ticket", inboxIssue.support_ticket);
      if (previousStatus === EInboxIssueStatus.PENDING) this.adjustPendingCount(-1);
    });
  };

  reopenInboxIssue = async () => {
    if (!this.issue.id) return;
    const previousStatus = this.status;
    const inboxIssue = await this.inboxIssueService.update(this.workspaceSlug, this.projectId, this.issue.id, {
      status: EInboxIssueStatus.PENDING,
      reopen: true,
    });
    runInAction(() => {
      set(this, "status", inboxIssue?.status);
      if (inboxIssue?.support_ticket) set(this, "support_ticket", inboxIssue.support_ticket);
      if (previousStatus !== EInboxIssueStatus.PENDING && inboxIssue.status === EInboxIssueStatus.PENDING) {
        this.adjustPendingCount(1);
      }
    });
  };

  consultingInboxIssue = async (note: string) => {
    if (!this.issue.id) return;
    const previousStatus = this.status;
    // outcome + outcome_note are extra fields accepted by the API but not in TInboxIssue type
    const payload = { outcome: "consulting", outcome_note: note } as unknown as Partial<TInboxIssue>;
    const inboxIssue = await this.inboxIssueService.update(this.workspaceSlug, this.projectId, this.issue.id, payload);
    runInAction(() => {
      set(this, "status", inboxIssue?.status);
      set(this, "outcome", inboxIssue?.outcome ?? "consulting");
      if (previousStatus === EInboxIssueStatus.PENDING) this.adjustPendingCount(-1);
    });
  };

  deferInboxIssue = async (reason?: string) => {
    if (!this.issue.id) return;
    const previousStatus = this.status;
    // backend auto-sets status=3 (CLOSED) when outcome=deferred
    const payload = {
      outcome: "deferred",
      ...(reason ? { outcome_note: reason } : {}),
    } as unknown as Partial<TInboxIssue>;
    const inboxIssue = await this.inboxIssueService.update(this.workspaceSlug, this.projectId, this.issue.id, payload);
    runInAction(() => {
      set(this, "status", inboxIssue?.status);
      set(this, "outcome", inboxIssue?.outcome ?? "deferred");
      if (previousStatus === EInboxIssueStatus.PENDING) this.adjustPendingCount(-1);
    });
  };

  updateInboxIssueDuplicateTo = async (issueId: string) => {
    const inboxStatus = EInboxIssueStatus.DUPLICATE;
    const previousData: Partial<TInboxIssue> = {
      status: this.status,
      duplicate_to: this.duplicate_to,
      duplicate_issue_detail: this.duplicate_issue_detail,
    };
    const wasPending = this.status === EInboxIssueStatus.PENDING;
    try {
      if (!this.issue.id) return;
      const inboxIssue = await this.inboxIssueService.update(this.workspaceSlug, this.projectId, this.issue.id, {
        status: inboxStatus,
        duplicate_to: issueId,
      });
      runInAction(() => {
        set(this, "status", inboxIssue?.status);
        set(this, "duplicate_to", inboxIssue?.duplicate_to);
        set(this, "duplicate_issue_detail", inboxIssue?.duplicate_issue_detail);
        if (wasPending) this.adjustPendingCount(-1);
      });
    } catch {
      runInAction(() => {
        set(this, "status", previousData.status);
        set(this, "duplicate_to", previousData.duplicate_to);
        set(this, "duplicate_issue_detail", previousData.duplicate_issue_detail);
      });
    }
  };

  updateInboxIssueSnoozeTill = async (date: Date | undefined, snoozeReason?: string) => {
    const inboxStatus = date ? EInboxIssueStatus.SNOOZED : EInboxIssueStatus.PENDING;
    const previousData: Partial<TInboxIssue> = {
      status: this.status,
      snoozed_till: this.snoozed_till,
    };
    const previousStatus = this.status;
    try {
      if (!this.issue.id) return;
      const inboxIssue = await this.inboxIssueService.update(this.workspaceSlug, this.projectId, this.issue.id, {
        status: inboxStatus,
        snoozed_till: date ? new Date(date) : null,
        ...(snoozeReason ? { snooze_reason: snoozeReason } : {}),
      });
      runInAction(() => {
        set(this, "status", inboxIssue?.status);
        set(this, "snoozed_till", inboxIssue?.snoozed_till);
        if (inboxIssue?.support_ticket) set(this, "support_ticket", inboxIssue.support_ticket);
        if (previousStatus === EInboxIssueStatus.PENDING && inboxIssue.status === EInboxIssueStatus.SNOOZED) {
          this.adjustPendingCount(-1);
        } else if (previousStatus !== EInboxIssueStatus.PENDING && inboxIssue.status === EInboxIssueStatus.PENDING) {
          this.adjustPendingCount(1);
        }
      });
    } catch {
      runInAction(() => {
        set(this, "status", previousData.status);
        set(this, "snoozed_till", previousData.snoozed_till);
      });
    }
  };

  updateSupportTicket = async (payload: TInboxIssueSupportUpdatePayload) => {
    if (!this.issue.id) return;
    const inboxIssue = await this.inboxIssueService.update(
      this.workspaceSlug,
      this.projectId,
      this.issue.id,
      payload as Partial<TInboxIssue>
    );
    runInAction(() => {
      if (inboxIssue?.support_ticket) set(this, "support_ticket", inboxIssue.support_ticket);
    });
    await this.fetchIssueActivity();
  };

  updateIssue = async (issue: Partial<TIssue>) => {
    const inboxIssue = clone(this.issue);
    try {
      if (!this.issue.id) return;
      Object.keys(issue).forEach((key) => {
        const issueKey = key as keyof TIssue;
        set(this.issue, issueKey, issue[issueKey]);
      });
      await this.inboxIssueService.updateIssue(this.workspaceSlug, this.projectId, this.issue.id, issue);
      // fetching activity
      this.fetchIssueActivity();
    } catch {
      Object.keys(issue).forEach((key) => {
        const issueKey = key as keyof TIssue;
        set(this.issue, issueKey, inboxIssue[issueKey]);
      });
    }
  };

  updateProjectIssue = async (issue: Partial<TIssue>) => {
    const inboxIssue = clone(this.issue);
    try {
      if (!this.issue.id) return;
      Object.keys(issue).forEach((key) => {
        const issueKey = key as keyof TIssue;
        set(this.issue, issueKey, issue[issueKey]);
      });
      await this.issueService.patchIssue(this.workspaceSlug, this.projectId, this.issue.id, issue);
      if (issue.cycle_id) {
        await this.store.issue.issueDetail.addIssueToCycle(this.workspaceSlug, this.projectId, issue.cycle_id, [
          this.issue.id,
        ]);
      }
      if (issue.module_ids) {
        await this.store.issue.issueDetail.changeModulesInIssue(
          this.workspaceSlug,
          this.projectId,
          this.issue.id,
          issue.module_ids,
          []
        );
      }

      // fetching activity
      this.fetchIssueActivity();
    } catch {
      Object.keys(issue).forEach((key) => {
        const issueKey = key as keyof TIssue;
        set(this.issue, issueKey, inboxIssue[issueKey]);
      });
    }
  };

  fetchIssueActivity = async () => {
    try {
      if (!this.issue.id) return;
      await this.store.issue.issueDetail.fetchActivities(this.workspaceSlug, this.projectId, this.issue.id);
    } catch {
      console.error("Failed to fetch issue activity");
    }
  };
}
