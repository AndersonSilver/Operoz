import { observer } from "mobx-react";
import { CheckCircle2, BookOpen, PauseCircle, XCircle, ExternalLink } from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import type { TIntakeOutcome } from "@operoz/types";
import { useProject } from "@/hooks/store/use-project";
import type { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";

const OUTCOME_CONFIG: Record<
  TIntakeOutcome,
  { icon: React.FC<{ className?: string }>; labelKey: string; colorClass: string; bgClass: string }
> = {
  converted: {
    icon: CheckCircle2,
    labelKey: "inbox_issue.outcomes.converted",
    colorClass: "text-success-primary",
    bgClass: "bg-success-subtle border-success-subtle",
  },
  consulting: {
    icon: BookOpen,
    labelKey: "inbox_issue.outcomes.consulting",
    colorClass: "text-accent-primary",
    bgClass: "bg-accent-subtle border-accent-subtle",
  },
  deferred: {
    icon: PauseCircle,
    labelKey: "inbox_issue.outcomes.deferred",
    colorClass: "text-warning-primary",
    bgClass: "bg-warning-subtle border-warning-subtle",
  },
  rejected: {
    icon: XCircle,
    labelKey: "inbox_issue.outcomes.rejected",
    colorClass: "text-danger-primary",
    bgClass: "bg-danger-subtle border-danger-subtle",
  },
};

type Props = {
  inboxIssue: IInboxIssueStore;
  workspaceSlug: string;
};

export const IntakeOutcomePanel = observer(function IntakeOutcomePanel({ inboxIssue, workspaceSlug }: Props) {
  const { t } = useTranslation();
  const { getProjectById } = useProject();

  const outcome = inboxIssue.outcome;
  const convertedTo = inboxIssue.converted_to_issue;
  const issue = inboxIssue.issue;

  if (!outcome) return null;

  const config = OUTCOME_CONFIG[outcome];
  if (!config) return null;

  const Icon = config.icon;

  let convertedIssueHref: string | undefined;
  if (outcome === "converted" && convertedTo && issue.project_id) {
    const project = getProjectById(issue.project_id);
    if (project) {
      convertedIssueHref = `/${workspaceSlug}/projects/${issue.project_id}/issues/${convertedTo}`;
    }
  }

  return (
    <div className={`mx-4 mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 ${config.bgClass}`}>
      <Icon className={`mt-0.5 size-4 shrink-0 ${config.colorClass}`} />
      <div className="min-w-0 flex-1 space-y-1">
        <p className={`text-13 font-semibold ${config.colorClass}`}>{t(config.labelKey)}</p>
        {outcome === "converted" && convertedIssueHref && (
          <a
            href={convertedIssueHref}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-12 text-secondary hover:underline"
          >
            {t("inbox_issue.outcomes.view_converted_issue")}
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    </div>
  );
});
