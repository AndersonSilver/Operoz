import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import type { TIssueServiceType } from "@operoz/types";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";

type Props = {
  parentIssueId: string;
  issueServiceType?: TIssueServiceType;
};

export const SubIssuesProgressBar = observer(function SubIssuesProgressBar(props: Props) {
  const { parentIssueId, issueServiceType } = props;
  const { t } = useTranslation();
  const {
    subIssues: { subIssuesByIssueId, stateDistributionByIssueId },
  } = useIssueDetail(issueServiceType);

  const subIssues = subIssuesByIssueId(parentIssueId);
  if (!subIssues?.length) return null;

  const subIssuesDistribution = stateDistributionByIssueId(parentIssueId);
  const completedCount = subIssuesDistribution?.completed?.length ?? 0;
  const totalCount = subIssues.length;
  const percentage = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="mb-3 flex items-center gap-3">
      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-layer-2">
        <div
          className="h-full rounded-full bg-success-primary transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="shrink-0 text-12 text-tertiary">
        {t("sub_work_item.table.progress_completed", { percent: percentage })}
      </span>
    </div>
  );
});
