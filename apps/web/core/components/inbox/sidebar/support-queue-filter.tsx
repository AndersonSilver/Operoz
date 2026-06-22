import { observer } from "mobx-react";
import useSWR from "swr";
import { useTranslation } from "@operis/i18n";
import { cn } from "@operis/utils";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { projectSupportQueueService } from "@/services/inbox/project-support-queue.service";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const InboxSupportQueueFilter = observer(function InboxSupportQueueFilter({ workspaceSlug, projectId }: Props) {
  const { t } = useTranslation();
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  const selectedQueueIds = inboxFilters?.queue_id ?? [];

  const { data: queues = [] } = useSWR(`PROJECT_SUPPORT_QUEUES_${workspaceSlug}_${projectId}`, () =>
    projectSupportQueueService.list(workspaceSlug, projectId)
  );

  if (!queues.length) return null;

  const activeQueueId = selectedQueueIds.length === 1 ? selectedQueueIds[0] : "all";

  const handleSelect = (queueId: string) => {
    if (queueId === "all") {
      handleInboxIssueFilters("queue_id", []);
      return;
    }
    handleInboxIssueFilters("queue_id", [queueId]);
  };

  return (
    <div className="flex flex-wrap gap-1 border-b border-subtle px-3 py-2">
      <button
        type="button"
        onClick={() => handleSelect("all")}
        className={cn(
          "rounded-full px-2.5 py-1 text-11 font-medium transition-colors",
          activeQueueId === "all"
            ? "bg-accent-primary/15 text-accent-primary"
            : "bg-layer-2 text-secondary hover:text-primary"
        )}
      >
        {t("inbox_issue.queue_filter.all")}
      </button>
      {queues.map((queue) => (
        <button
          key={queue.id}
          type="button"
          onClick={() => handleSelect(queue.id)}
          className={cn(
            "rounded-full px-2.5 py-1 text-11 font-medium transition-colors",
            activeQueueId === queue.id
              ? "bg-accent-primary/15 text-accent-primary"
              : "bg-layer-2 text-secondary hover:text-primary"
          )}
          style={activeQueueId === queue.id ? { color: queue.color } : undefined}
        >
          {queue.name}
        </button>
      ))}
    </div>
  );
});
