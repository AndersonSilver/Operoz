import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useTranslation } from "@operoz/i18n";
import type { TIssue } from "@operoz/types";
import { AlertModalCore } from "@operoz/ui";
import { useProject } from "@/hooks/store/use-project";
import { projectSupportQueueService } from "@/services/inbox/project-support-queue.service";

type Props = {
  workspaceSlug: string;
  projectId: string;
  data: Partial<TIssue>;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (queueId: string) => Promise<void>;
};

export function AcceptSupportTicketModal(props: Props) {
  const { isOpen, onClose, data, onSubmit, workspaceSlug, projectId } = props;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queueId, setQueueId] = useState("");
  const { getProjectById } = useProject();
  const { t } = useTranslation();
  const projectDetails = data.project_id ? getProjectById(data?.project_id) : undefined;
  const ticketLabel = `${projectDetails?.identifier}-${data?.sequence_id}`;

  const { data: queues = [] } = useSWR(
    isOpen && workspaceSlug && projectId ? `PROJECT_SUPPORT_QUEUES_${workspaceSlug}_${projectId}` : null,
    () => projectSupportQueueService.list(workspaceSlug, projectId)
  );

  const defaultQueueId = useMemo(() => queues.find((queue) => queue.is_default)?.id ?? queues[0]?.id ?? "", [queues]);

  useEffect(() => {
    if (isOpen) setQueueId(defaultQueueId);
  }, [isOpen, defaultQueueId]);

  const handleClose = () => {
    setIsSubmitting(false);
    onClose();
  };

  const handleAccept = async () => {
    if (!queueId) return;
    setIsSubmitting(true);
    await onSubmit(queueId).finally(() => {
      setIsSubmitting(false);
      handleClose();
    });
  };

  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={handleAccept}
      isSubmitting={isSubmitting}
      isOpen={isOpen}
      title={t("inbox_issue.modals.accept.title")}
      primaryButtonText={{
        loading: t("inbox_issue.modals.accept.loading"),
        default: t("inbox_issue.actions.accept"),
      }}
      content={
        <div className="space-y-4">
          <p>{t("inbox_issue.modals.accept.content", { value: ticketLabel })}</p>
          <div className="space-y-1.5">
            <label htmlFor="accept-queue-select" className="text-13 font-medium text-secondary">
              {t("inbox_issue.modals.accept.queue_label")}
            </label>
            <select
              id="accept-queue-select"
              className="w-full rounded-md border border-subtle bg-layer-1 px-3 py-2 text-13"
              value={queueId}
              onChange={(event) => setQueueId(event.target.value)}
              disabled={queues.length === 0}
            >
              {queues.length === 0 ? (
                <option value="">{t("inbox_issue.modals.accept.no_queues")}</option>
              ) : (
                queues.map((queue) => (
                  <option key={queue.id} value={queue.id}>
                    {queue.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      }
    />
  );
}
