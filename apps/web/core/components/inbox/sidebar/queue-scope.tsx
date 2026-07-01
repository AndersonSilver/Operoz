import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import { cn } from "@operoz/utils";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { useUser } from "@/hooks/store/user";

type TQueueScope = "all" | "mine" | "unassigned";

const OPTIONS: TQueueScope[] = ["all", "mine", "unassigned"];

export const InboxQueueScope = observer(function InboxQueueScope() {
  const { t } = useTranslation();
  const { inboxFilters, handleInboxIssueFilters } = useProjectInbox();
  const { data: currentUser } = useUser();

  const assignees = inboxFilters?.assignees ?? [];
  const activeScope: TQueueScope =
    assignees.length === 1 && assignees[0] === "None"
      ? "unassigned"
      : currentUser?.id && assignees.length === 1 && assignees[0] === currentUser.id
        ? "mine"
        : "all";

  const handleScope = (scope: TQueueScope) => {
    if (scope === "all") {
      handleInboxIssueFilters("assignees", []);
      return;
    }
    if (scope === "mine" && currentUser?.id) {
      handleInboxIssueFilters("assignees", [currentUser.id]);
      return;
    }
    if (scope === "unassigned") {
      handleInboxIssueFilters("assignees", ["None"]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1 border-b border-subtle px-3 py-2">
      {OPTIONS.map((scope) => (
        <button
          key={scope}
          type="button"
          onClick={() => handleScope(scope)}
          className={cn(
            "rounded-full px-2.5 py-1 text-11 font-medium transition-colors",
            activeScope === scope
              ? "bg-accent-primary/15 text-accent-primary"
              : "bg-layer-2 text-secondary hover:text-primary"
          )}
        >
          {t(`inbox_issue.queue_scope.${scope}`)}
        </button>
      ))}
    </div>
  );
});
