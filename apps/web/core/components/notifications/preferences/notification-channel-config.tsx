import { observer } from "mobx-react";
import { useEffect } from "react";
import { useTranslation } from "@operis/i18n";
import type { TAlertChannel, TAlertType, TEmailFrequency } from "@operis/types";
import { Input } from "@operis/ui";
import { useAlertStore } from "@/hooks/store/notifications/use-alert";
import { ChannelToggle } from "../alert-settings/alert-rules-list";

const DEFAULT_TYPES: TAlertType[] = [
  "issue_created",
  "due_date_approaching",
  "support_ticket_created",
  "support_sla_approaching",
  "support_sla_breached",
];

const DEFAULT_CHANNELS: TAlertChannel[] = ["email", "in_app", "discord_dm", "google_calendar"];

const EMAIL_FREQUENCIES: TEmailFrequency[] = ["immediate", "digest_daily", "digest_weekly"];

const FREQUENCY_CHANNELS: TAlertChannel[] = ["email"];

export const QuietHoursConfig = observer(function QuietHoursConfig({ workspaceSlug }: { workspaceSlug: string }) {
  const { t } = useTranslation();
  const alertStore = useAlertStore();
  const prefs = alertStore.userPreferences;

  const patchQuiet = (field: "quiet_hours_start" | "quiet_hours_end" | "quiet_hours_timezone", value: string) => {
    void alertStore.updatePreferences(workspaceSlug, { [field]: value || null });
  };

  return (
    <div className="rounded-md border border-subtle bg-layer-1 p-4">
      <h3 className="text-13 font-medium text-primary">{t("alert.prefs.quiet_hours")}</h3>
      <p className="mt-1 text-11 text-tertiary">{t("alert.prefs.quiet_hours_desc")}</p>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Input
          type="time"
          value={prefs?.quiet_hours_start?.slice(0, 5) ?? ""}
          onChange={(e) => patchQuiet("quiet_hours_start", e.target.value)}
        />
        <Input
          type="time"
          value={prefs?.quiet_hours_end?.slice(0, 5) ?? ""}
          onChange={(e) => patchQuiet("quiet_hours_end", e.target.value)}
        />
        <Input
          value={prefs?.quiet_hours_timezone ?? ""}
          onChange={(e) => patchQuiet("quiet_hours_timezone", e.target.value)}
          placeholder={t("alert.prefs.timezone")}
        />
      </div>
    </div>
  );
});

export const ChannelDeliveryConfig = observer(function ChannelDeliveryConfig({
  workspaceSlug,
}: {
  workspaceSlug: string;
}) {
  const { t } = useTranslation();
  const alertStore = useAlertStore();
  const channels = alertStore.userPreferences?.channels ?? {};

  const getFrequency = (channel: TAlertChannel): TEmailFrequency => {
    const cfg = channels[channel];
    if (cfg && "frequency" in cfg && cfg.frequency) return cfg.frequency;
    return "immediate";
  };

  const setFrequency = (channel: TAlertChannel, frequency: TEmailFrequency) => {
    void alertStore.updatePreferences(workspaceSlug, {
      channels: {
        ...channels,
        [channel]: {
          ...channels[channel],
          frequency,
        },
      },
    });
  };

  return (
    <div className="rounded-md border border-subtle bg-layer-1 p-4">
      <h3 className="text-13 font-medium text-primary">{t("alert.prefs.delivery")}</h3>
      <p className="mt-1 text-11 text-tertiary">{t("alert.prefs.delivery_desc")}</p>
      <div className="mt-3 flex flex-col gap-3">
        {FREQUENCY_CHANNELS.map((channel) => (
          <label key={channel} className="block space-y-1">
            <span className="text-11 font-medium text-secondary">
              {t(`alert.channel.${channel}` as "alert.channel.email")} — {t("alert.prefs.frequency")}
            </span>
            <select
              className="w-full rounded-md border border-subtle bg-surface-1 px-2 py-1.5 text-13 text-primary md:max-w-xs"
              value={getFrequency(channel)}
              onChange={(e) => setFrequency(channel, e.target.value as TEmailFrequency)}
            >
              {EMAIL_FREQUENCIES.map((frequency) => (
                <option key={frequency} value={frequency}>
                  {t(`alert.prefs.frequency_${frequency}` as "alert.prefs.frequency_immediate")}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
});

export const NotificationChannelConfig = observer(function NotificationChannelConfig({
  workspaceSlug,
}: {
  workspaceSlug: string;
}) {
  const { t } = useTranslation();
  const alertStore = useAlertStore();

  useEffect(() => {
    void alertStore.fetchPreferences(workspaceSlug);
  }, [alertStore, workspaceSlug]);

  const isEnabled = (alertType: TAlertType, channel: TAlertChannel) => {
    const pref = alertStore.userPreferences?.preferences.find(
      (p) => p.alert_type === alertType && p.channel_type === channel
    );
    return pref?.enabled ?? true;
  };

  const toggle = (alertType: TAlertType, channel: TAlertChannel, enabled: boolean) => {
    const existing = alertStore.userPreferences?.preferences ?? [];
    const others = existing.filter((p) => !(p.alert_type === alertType && p.channel_type === channel));
    void alertStore.updatePreferences(workspaceSlug, {
      preferences: [...others, { alert_type: alertType, channel_type: channel, enabled }],
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <ChannelDeliveryConfig workspaceSlug={workspaceSlug} />
      {DEFAULT_TYPES.map((alertType) => (
        <div key={alertType} className="rounded-md border border-subtle bg-layer-1 p-4">
          <h3 className="mb-3 text-13 font-medium text-primary">
            {t(`alert.type.${alertType}` as "alert.type.issue_created")}
          </h3>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {DEFAULT_CHANNELS.map((channel) => (
              <ChannelToggle
                key={`${alertType}-${channel}`}
                channel={channel}
                enabled={isEnabled(alertType, channel)}
                onChange={(value) => toggle(alertType, channel, value)}
              />
            ))}
          </div>
        </div>
      ))}
      <QuietHoursConfig workspaceSlug={workspaceSlug} />
    </div>
  );
});
