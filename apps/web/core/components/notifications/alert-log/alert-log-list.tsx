import { observer } from "mobx-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@operis/i18n";
import type { TAlertChannel, TAlertLogStatus, TAlertType } from "@operis/types";
import { Button } from "@operis/propel/button";
import { useAlertStore } from "@/hooks/store/notifications/use-alert";

const ALERT_TYPES: TAlertType[] = [
  "issue_created",
  "due_date_approaching",
  "due_date_overdue",
  "missing_due_date",
  "state_change",
  "assignee_change",
  "support_ticket_created",
  "support_ticket_accepted",
  "support_sla_approaching",
  "support_sla_breached",
  "support_ticket_closed",
];

const CHANNELS: TAlertChannel[] = ["email", "in_app", "discord_dm", "google_calendar"];
const STATUSES: TAlertLogStatus[] = ["sent", "failed", "throttled", "skipped"];

export const AlertLogList = observer(function AlertLogList({ workspaceSlug }: { workspaceSlug: string }) {
  const { t } = useTranslation();
  const alertStore = useAlertStore();
  const [alertType, setAlertType] = useState<TAlertType | "">("");
  const [channel, setChannel] = useState<TAlertChannel | "">("");
  const [logStatus, setLogStatus] = useState<TAlertLogStatus | "">("");

  const filters = useMemo(
    () => ({
      ...(alertType ? { alert_type: alertType } : {}),
      ...(channel ? { channel } : {}),
      ...(logStatus ? { status: logStatus } : {}),
    }),
    [alertType, channel, logStatus]
  );

  useEffect(() => {
    void alertStore.fetchAlertLogs(workspaceSlug, filters);
  }, [alertStore, workspaceSlug, filters]);

  if (alertStore.isLoadingLogs) {
    return <p className="text-13 text-tertiary">{t("common.loading")}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-11 text-tertiary">{t("alert.logs.type")}</span>
          <select
            className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
            value={alertType}
            onChange={(e) => setAlertType(e.target.value as TAlertType | "")}
          >
            <option value="">{t("alert.logs.filter_all")}</option>
            {ALERT_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`alert.type.${type}` as "alert.type.issue_created")}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-11 text-tertiary">{t("alert.logs.channel")}</span>
          <select
            className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
            value={channel}
            onChange={(e) => setChannel(e.target.value as TAlertChannel | "")}
          >
            <option value="">{t("alert.logs.filter_all")}</option>
            {CHANNELS.map((item) => (
              <option key={item} value={item}>
                {t(`alert.channel.${item}` as "alert.channel.email")}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-11 text-tertiary">{t("alert.logs.status")}</span>
          <select
            className="rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary"
            value={logStatus}
            onChange={(e) => setLogStatus(e.target.value as TAlertLogStatus | "")}
          >
            <option value="">{t("alert.logs.filter_all")}</option>
            {STATUSES.map((item) => (
              <option key={item} value={item}>
                {t(`alert.logs.${item}` as "alert.logs.sent")}
              </option>
            ))}
          </select>
        </label>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setAlertType("");
            setChannel("");
            setLogStatus("");
          }}
        >
          {t("alert.logs.clear_filters")}
        </Button>
      </div>

      {alertStore.alertLogs.length === 0 ? (
        <p className="text-13 text-tertiary">{t("alert.logs.empty")}</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-subtle">
          <table className="w-full text-left text-13">
            <thead className="bg-surface-2 text-11 text-tertiary uppercase">
              <tr>
                <th className="px-3 py-2">{t("alert.logs.issue")}</th>
                <th className="px-3 py-2">{t("alert.logs.type")}</th>
                <th className="px-3 py-2">{t("alert.logs.channel")}</th>
                <th className="px-3 py-2">{t("alert.logs.status")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle bg-layer-1">
              {alertStore.alertLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-3 py-2 text-primary">{log.issue.identifier}</td>
                  <td className="px-3 py-2 text-secondary">
                    {t(`alert.type.${log.alert_type}` as "alert.type.issue_created")}
                  </td>
                  <td className="px-3 py-2 text-secondary">
                    {t(`alert.channel.${log.channel}` as "alert.channel.email")}
                  </td>
                  <td className="px-3 py-2 text-secondary">{t(`alert.logs.${log.status}` as "alert.logs.sent")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});
