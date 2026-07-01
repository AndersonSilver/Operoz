import { observer } from "mobx-react";
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  Mail,
  Moon,
  PlusCircle,
  ShieldAlert,
  Ticket,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "@operoz/i18n";
import type { TAlertChannel, TAlertType, TEmailFrequency } from "@operoz/types";
import { Input, cn } from "@operoz/ui";
import { useAlertStore } from "@/hooks/store/notifications/use-alert";
import { ChannelToggle } from "../alert-settings/alert-rules-list";
import "../alerts-settings.css";

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

const ALERT_TYPE_ICONS: Record<TAlertType, LucideIcon> = {
  issue_created: PlusCircle,
  due_date_approaching: Clock,
  due_date_overdue: AlertTriangle,
  missing_due_date: Calendar,
  state_change: Bell,
  assignee_change: Bell,
  support_ticket_created: Ticket,
  support_ticket_accepted: CheckCircle,
  support_sla_approaching: Timer,
  support_sla_breached: ShieldAlert,
  support_ticket_closed: CheckCircle,
};

const SELECT_CLASS =
  "h-9 w-full rounded-md border border-subtle bg-surface-1 px-3 text-13 text-primary focus:border-strong focus:outline-none focus:ring-1 focus:ring-accent-primary md:max-w-xs";

function SettingsPanelCard({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("overflow-hidden rounded-xl border border-subtle bg-layer-1", className)}>
      <div className="border-b border-subtle px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-subtle bg-surface-1 text-accent-primary">
            <Icon className="size-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h3 className="text-14 font-semibold text-primary">{title}</h3>
            {description ? <p className="mt-1 text-12 leading-relaxed text-secondary">{description}</p> : null}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </article>
  );
}

export const QuietHoursConfig = observer(function QuietHoursConfig({ workspaceSlug }: { workspaceSlug: string }) {
  const { t } = useTranslation();
  const alertStore = useAlertStore();
  const prefs = alertStore.userPreferences;

  const patchQuiet = (field: "quiet_hours_start" | "quiet_hours_end" | "quiet_hours_timezone", value: string) => {
    void alertStore.updatePreferences(workspaceSlug, { [field]: value || null });
  };

  return (
    <SettingsPanelCard icon={Moon} title={t("alert.prefs.quiet_hours")} description={t("alert.prefs.quiet_hours_desc")}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-11 font-medium text-tertiary">{t("alert.prefs.quiet_start")}</span>
          <Input
            type="time"
            value={prefs?.quiet_hours_start?.slice(0, 5) ?? ""}
            onChange={(e) => patchQuiet("quiet_hours_start", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-11 font-medium text-tertiary">{t("alert.prefs.quiet_end")}</span>
          <Input
            type="time"
            value={prefs?.quiet_hours_end?.slice(0, 5) ?? ""}
            onChange={(e) => patchQuiet("quiet_hours_end", e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-11 font-medium text-tertiary">{t("alert.prefs.timezone")}</span>
          <Input
            value={prefs?.quiet_hours_timezone ?? ""}
            onChange={(e) => patchQuiet("quiet_hours_timezone", e.target.value)}
            placeholder={t("alert.prefs.timezone_placeholder")}
          />
        </label>
      </div>
    </SettingsPanelCard>
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
    <SettingsPanelCard icon={Mail} title={t("alert.prefs.delivery")} description={t("alert.prefs.delivery_desc")}>
      <div className="flex flex-col gap-3">
        {FREQUENCY_CHANNELS.map((channel) => (
          <label key={channel} className="flex flex-col gap-1.5">
            <span className="text-11 font-medium text-secondary">
              {t(`alert.channel.${channel}` as "alert.channel.email")} — {t("alert.prefs.frequency")}
            </span>
            <select
              className={SELECT_CLASS}
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
    </SettingsPanelCard>
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChannelDeliveryConfig workspaceSlug={workspaceSlug} />
        <QuietHoursConfig workspaceSlug={workspaceSlug} />
      </div>

      <div className="alerts-settings-prefs-grid">
        {DEFAULT_TYPES.map((alertType) => {
          const TypeIcon = ALERT_TYPE_ICONS[alertType];
          return (
            <article key={alertType} className="overflow-hidden rounded-xl border border-subtle bg-layer-1">
              <div className="flex items-center gap-2.5 border-b border-subtle px-4 py-3">
                <span className="grid size-8 place-items-center rounded-md border border-subtle bg-surface-1 text-accent-primary">
                  <TypeIcon className="size-3.5" strokeWidth={1.75} />
                </span>
                <h3 className="text-13 font-semibold text-primary">
                  {t(`alert.type.${alertType}` as "alert.type.issue_created")}
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-2 p-4">
                {DEFAULT_CHANNELS.map((channel) => (
                  <ChannelToggle
                    key={`${alertType}-${channel}`}
                    channel={channel}
                    enabled={isEnabled(alertType, channel)}
                    onChange={(value) => toggle(alertType, channel, value)}
                  />
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
});
