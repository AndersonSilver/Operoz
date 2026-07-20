import { observer } from "mobx-react";
import { History, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@operoz/i18n";
import type { TAlertChannel, TAlertLogStatus, TAlertType } from "@operoz/types";
import { EmptyStateCompact } from "@operoz/propel/empty-state";
import { Badge, CustomSelect, Loader, Avatar, cn } from "@operoz/ui";
import { getFileURL } from "@operoz/utils";
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
  "support_no_team_response",
  "issue_no_activity",
  "in_progress_too_long",
];

const CHANNELS: TAlertChannel[] = ["email", "in_app", "discord_dm", "google_calendar"];
const STATUSES: TAlertLogStatus[] = ["sent", "failed", "throttled", "skipped"];

const SELECT_CLASS =
  "h-9 min-w-[9.5rem] !rounded-md !border-subtle !bg-surface-1 !px-3 !py-0 !text-13 !font-normal shadow-none hover:!bg-layer-1-hover";

function logErrorLabel(t: (key: string) => string, error: string | undefined): string | null {
  if (!error?.trim()) return null;
  const normalized = error.trim().toLowerCase();
  if (normalized === "external account not linked") return t("alert.logs.errors.external_account");
  if (normalized === "no due date or sla for calendar event") return t("alert.logs.errors.no_calendar_date");
  if (normalized === "quiet hours") return t("alert.logs.errors.quiet_hours");
  if (normalized === "channel disabled") return t("alert.logs.errors.channel_disabled");
  return error.trim();
}

function logStatusVariant(status: TAlertLogStatus): "success" | "destructive" | "warning" | "neutral" {
  if (status === "sent") return "success";
  if (status === "failed") return "destructive";
  if (status === "throttled") return "warning";
  return "neutral";
}

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

  const hasFilters = Boolean(alertType || channel || logStatus);

  useEffect(() => {
    void alertStore.fetchAlertLogs(workspaceSlug, filters);
  }, [alertStore, workspaceSlug, filters]);

  const typeOptions = [
    { value: "", label: t("alert.logs.filter_all") },
    ...ALERT_TYPES.map((type) => ({
      value: type,
      label: t(`alert.type.${type}` as "alert.type.issue_created"),
    })),
  ];

  const channelOptions = [
    { value: "", label: t("alert.logs.filter_all") },
    ...CHANNELS.map((item) => ({
      value: item,
      label: t(`alert.channel.${item}` as "alert.channel.email"),
    })),
  ];

  const statusOptions = [
    { value: "", label: t("alert.logs.filter_all") },
    ...STATUSES.map((item) => ({
      value: item,
      label: t(`alert.logs.${item}` as "alert.logs.sent"),
    })),
  ];

  if (alertStore.isLoadingLogs) {
    return (
      <Loader className="w-full">
        <Loader.Item height="280px" />
      </Loader>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-subtle bg-layer-1 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <CustomSelect
            input
            value={alertType}
            onChange={(val: string) => setAlertType(val as TAlertType | "")}
            label={typeOptions.find((o) => o.value === alertType)?.label}
            buttonClassName={SELECT_CLASS}
          >
            {typeOptions.map((opt) => (
              <CustomSelect.Option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </CustomSelect.Option>
            ))}
          </CustomSelect>

          <CustomSelect
            input
            value={channel}
            onChange={(val: string) => setChannel(val as TAlertChannel | "")}
            label={channelOptions.find((o) => o.value === channel)?.label}
            buttonClassName={SELECT_CLASS}
          >
            {channelOptions.map((opt) => (
              <CustomSelect.Option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </CustomSelect.Option>
            ))}
          </CustomSelect>

          <CustomSelect
            input
            value={logStatus}
            onChange={(val: string) => setLogStatus(val as TAlertLogStatus | "")}
            label={statusOptions.find((o) => o.value === logStatus)?.label}
            buttonClassName={SELECT_CLASS}
          >
            {statusOptions.map((opt) => (
              <CustomSelect.Option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </CustomSelect.Option>
            ))}
          </CustomSelect>

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setAlertType("");
                setChannel("");
                setLogStatus("");
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-subtle px-3 text-12 text-secondary transition-colors hover:bg-layer-1-hover hover:text-primary"
            >
              <X className="size-3.5" />
              {t("alert.logs.clear_filters")}
            </button>
          )}
        </div>

        <p
          className={cn(
            "mt-3 text-12 text-tertiary",
            alertStore.alertLogs.length === 0 && hasFilters && "text-warning-primary"
          )}
        >
          {t("alert.logs.results", { count: alertStore.alertLogs.length })}
        </p>
      </div>

      {alertStore.alertLogs.length === 0 ? (
        <EmptyStateCompact
          assetKey="search"
          title={t("alert.logs.empty")}
          description={hasFilters ? t("alert.logs.empty_filters_hint") : undefined}
          actions={
            hasFilters
              ? [
                  {
                    label: t("alert.logs.clear_filters"),
                    onClick: () => {
                      setAlertType("");
                      setChannel("");
                      setLogStatus("");
                    },
                  },
                ]
              : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-subtle bg-layer-1">
          <div className="flex items-center gap-2 border-b border-subtle px-5 py-3">
            <History className="size-4 text-tertiary" strokeWidth={1.75} />
            <h3 className="text-13 font-semibold text-primary">{t("alert.logs.recent")}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-13">
              <thead className="bg-surface-2 text-11 font-medium tracking-wide text-tertiary uppercase">
                <tr>
                  <th className="px-5 py-3">{t("alert.logs.issue")}</th>
                  <th className="px-5 py-3">{t("alert.logs.type")}</th>
                  <th className="px-5 py-3">{t("alert.logs.receiver")}</th>
                  <th className="px-5 py-3">{t("alert.logs.channel")}</th>
                  <th className="px-5 py-3">{t("alert.logs.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {alertStore.alertLogs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-layer-1-hover/50">
                    <td className="px-5 py-3 font-medium text-primary">{log.issue.identifier}</td>
                    <td className="px-5 py-3 text-secondary">
                      {t(`alert.type.${log.alert_type}` as "alert.type.issue_created")}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar
                          size="sm"
                          name={log.receiver.display_name}
                          src={getFileURL(log.receiver.avatar_url ?? "")}
                        />
                        <span className="truncate text-secondary">{log.receiver.display_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-secondary">
                      {t(`alert.channel.${log.channel}` as "alert.channel.email")}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge variant={logStatusVariant(log.status)} size="sm" disabled>
                          {t(`alert.logs.${log.status}` as "alert.logs.sent")}
                        </Badge>
                        {logErrorLabel(t, log.error) ? (
                          <span className="max-w-[14rem] text-11 text-tertiary">{logErrorLabel(t, log.error)}</span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});
