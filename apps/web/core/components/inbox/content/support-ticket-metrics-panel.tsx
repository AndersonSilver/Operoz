import { useTranslation } from "@operoz/i18n";
import type { IInboxIssueStore } from "@/store/inbox/inbox-issue.store";

type Props = {
  inboxIssue: IInboxIssueStore;
};

function formatSeconds(value: number | null | undefined, t: (key: string) => string): string {
  if (value == null || value <= 0) return t("common.none");
  if (value < 60) return `${value}s`;

  const minutes = Math.floor(value / 60);
  if (minutes < 60) return `${minutes}min`;

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  if (hours < 48) return restMinutes > 0 ? `${hours}h ${restMinutes}min` : `${hours}h`;

  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours > 0 ? `${days}d ${restHours}h` : `${days}d`;
}

export function SupportTicketMetricsPanel({ inboxIssue }: Props) {
  const { t } = useTranslation();
  const metrics = inboxIssue.support_ticket?.metrics;

  return (
    <section className="rounded-lg border border-subtle bg-layer-1/40 px-4 py-3">
      <h5 className="mb-2 text-11 font-semibold tracking-wide text-tertiary uppercase">
        {t("inbox_issue.support_metrics.title")}
      </h5>
      <dl className="grid gap-2 text-13 sm:grid-cols-3">
        <div className="rounded-md border border-subtle/70 bg-surface-1 px-3 py-2">
          <dt className="text-11 text-tertiary">{t("inbox_issue.support_metrics.tta")}</dt>
          <dd className="mt-1 font-medium text-primary">{formatSeconds(metrics?.time_to_accept_seconds ?? null, t)}</dd>
        </div>
        <div className="rounded-md border border-subtle/70 bg-surface-1 px-3 py-2">
          <dt className="text-11 text-tertiary">{t("inbox_issue.support_metrics.ttr")}</dt>
          <dd className="mt-1 font-medium text-primary">
            {formatSeconds(metrics?.time_to_resolve_seconds ?? null, t)}
          </dd>
        </div>
        <div className="rounded-md border border-subtle/70 bg-surface-1 px-3 py-2">
          <dt className="text-11 text-tertiary">{t("inbox_issue.support_metrics.in_progress")}</dt>
          <dd className="mt-1 font-medium text-primary">
            {formatSeconds(metrics?.time_in_progress_seconds ?? null, t)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
