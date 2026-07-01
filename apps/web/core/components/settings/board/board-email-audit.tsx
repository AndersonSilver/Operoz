import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@operoz/i18n";
import type { IEmailNotificationLog } from "@operoz/types";
import { renderFormattedDate } from "@operoz/utils";
import { BoardService } from "@/services/board/board.service";

const boardService = new BoardService();

export const BoardEmailAudit = observer(function BoardEmailAudit(props: { workspaceSlug: string; boardSlug: string }) {
  const { workspaceSlug, boardSlug } = props;
  const { t } = useTranslation();
  const [logs, setLogs] = useState<IEmailNotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    boardService
      .getEmailNotificationLogs(workspaceSlug, boardSlug)
      .then((data) => {
        if (!cancelled) setLogs(data);
      })
      .catch((err: { error?: string }) => {
        if (!cancelled) setError(err?.error ?? t("something_went_wrong"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceSlug, boardSlug, t]);

  if (isLoading) {
    return <p className="text-13 text-tertiary">{t("loading")}</p>;
  }

  if (error) {
    return <p className="text-13 text-danger-primary">{error}</p>;
  }

  if (logs.length === 0) {
    return <p className="text-13 text-tertiary">{t("boards.settings.notifications.audit.empty")}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-subtle">
      <table className="w-full min-w-[720px] text-left text-13">
        <thead className="border-b border-subtle bg-surface-1 text-11 font-medium text-secondary">
          <tr>
            <th className="px-3 py-2">{t("boards.settings.notifications.audit.columns.recipient")}</th>
            <th className="px-3 py-2">{t("boards.settings.notifications.audit.columns.triggered_by")}</th>
            <th className="px-3 py-2">{t("boards.settings.notifications.audit.columns.change")}</th>
            <th className="px-3 py-2">{t("boards.settings.notifications.audit.columns.sent_at")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-subtle">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-3 py-2 text-primary">
                <div>{log.receiver_name || log.receiver_email}</div>
                <div className="text-11 text-tertiary">{log.receiver_email}</div>
              </td>
              <td className="px-3 py-2 text-secondary">{log.triggered_by_name || log.triggered_by_email || "—"}</td>
              <td className="px-3 py-2 text-secondary">
                {log.old_value || log.new_value ? (
                  <>
                    {log.old_value ? <span>{log.old_value}</span> : null}
                    {log.old_value && log.new_value ? <span className="text-tertiary"> → </span> : null}
                    {log.new_value ? <span>{log.new_value}</span> : null}
                  </>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-3 py-2 text-tertiary">
                {log.sent_at ? renderFormattedDate(log.sent_at) : renderFormattedDate(log.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});
