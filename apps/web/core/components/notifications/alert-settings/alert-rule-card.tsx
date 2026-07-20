import {
  AlertTriangle,
  Archive,
  Bell,
  Calendar,
  CalendarX,
  CheckCircle,
  Clock,
  GitBranch,
  Hourglass,
  Inbox,
  Mail,
  MessageCircle,
  PauseCircle,
  Pencil,
  PlusCircle,
  ShieldAlert,
  Ticket,
  Timer,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "@operoz/i18n";
import { IconButton } from "@operoz/propel/icon-button";
import type { TAlertChannel, TAlertRule, TAlertType } from "@operoz/types";
import { Badge, ToggleSwitch, cn } from "@operoz/ui";
import { useProject } from "@/hooks/store/use-project";
import "../alerts-settings.css";

const ALERT_TYPE_ICONS: Record<TAlertType, LucideIcon> = {
  issue_created: PlusCircle,
  due_date_approaching: Clock,
  due_date_overdue: AlertTriangle,
  missing_due_date: CalendarX,
  state_change: GitBranch,
  assignee_change: UserRound,
  support_ticket_created: Ticket,
  support_ticket_accepted: CheckCircle,
  support_sla_approaching: Timer,
  support_sla_breached: ShieldAlert,
  support_ticket_closed: Archive,
  support_no_team_response: Inbox,
  issue_no_activity: Hourglass,
  in_progress_too_long: PauseCircle,
};

const CHANNEL_ICONS: Record<TAlertChannel, LucideIcon> = {
  email: Mail,
  in_app: Bell,
  discord_dm: MessageCircle,
  google_calendar: Calendar,
};

function alertTypeBadgeVariant(alertType: TAlertType): "neutral" | "warning" | "destructive" | "success" {
  if (alertType.includes("overdue") || alertType.includes("breached")) return "destructive";
  if (alertType.includes("approaching") || alertType.includes("sla")) return "warning";
  if (alertType.includes("created") || alertType.includes("accepted")) return "success";
  return "neutral";
}

type Props = {
  rule: TAlertRule;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
};

export function AlertRuleCard(props: Props) {
  const { rule, onEdit, onDelete, onToggle } = props;
  const { t } = useTranslation();
  const { getPartialProjectById } = useProject();

  const project = rule.project ? getPartialProjectById(rule.project) : null;
  const TypeIcon = ALERT_TYPE_ICONS[rule.alert_type] ?? Bell;
  const displayName = rule.name || t(`alert.type.${rule.alert_type}` as "alert.type.issue_created");
  const channels = rule.channels ?? [];

  return (
    <article
      className={cn(
        "group relative flex min-h-[200px] flex-col overflow-hidden rounded-xl border border-subtle bg-layer-1 transition-all duration-150",
        "hover:border-strong hover:shadow-raised-100",
        rule.enabled && "alerts-settings-card-active",
        !rule.enabled && "opacity-75"
      )}
    >
      <span
        className={cn("absolute inset-x-0 top-0 h-0.5", rule.enabled ? "bg-accent-primary" : "bg-subtle")}
        aria-hidden
      />

      <button
        type="button"
        className="flex flex-1 flex-col p-5 text-left transition-colors group-hover:bg-layer-1-hover/40"
        onClick={onEdit}
      >
        <div className="flex items-start gap-3 pr-6">
          <span className="shadow-sm grid size-11 shrink-0 place-items-center rounded-lg border border-subtle bg-surface-1">
            <TypeIcon className="size-5 text-accent-primary" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="line-clamp-2 text-14 leading-snug font-semibold tracking-tight text-primary">
                {displayName}
              </h3>
              {!rule.enabled && (
                <span className="shrink-0 rounded-full bg-layer-2 px-2 py-0.5 text-10 font-semibold tracking-wide text-tertiary uppercase">
                  {t("alert.rules.card.disabled")}
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge variant={alertTypeBadgeVariant(rule.alert_type)} size="sm" disabled>
                {t(`alert.type.${rule.alert_type}` as "alert.type.issue_created")}
              </Badge>
              {project ? (
                <Badge variant="neutral" size="sm" disabled>
                  {project.name}
                </Badge>
              ) : (
                <Badge variant="neutral" size="sm" disabled>
                  {t("alert.form.workspace_scope")}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {channels.length > 0 ? (
            channels.map((channel) => {
              const ChannelIcon = CHANNEL_ICONS[channel] ?? Bell;
              return (
                <span
                  key={channel}
                  className="inline-flex items-center gap-1 rounded-md border border-subtle bg-layer-2 px-2 py-0.5 text-10 font-medium text-secondary"
                >
                  <ChannelIcon className="size-3 opacity-70" strokeWidth={1.75} />
                  {t(`alert.channel.${channel}` as "alert.channel.email")}
                </span>
              );
            })
          ) : (
            <span className="text-11 text-placeholder">{t("alert.rules.card.no_channels")}</span>
          )}
        </div>
      </button>

      <footer className="flex items-center justify-between gap-2 border-t border-subtle px-4 py-3">
        <span className="text-11 text-tertiary">
          {rule.enabled ? t("alert.rules.card.enabled") : t("alert.rules.card.paused")}
        </span>
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <IconButton
            variant="ghost"
            size="sm"
            icon={Pencil}
            aria-label={t("alert.form.edit_title")}
            onClick={onEdit}
          />
          <IconButton
            variant="ghost"
            size="sm"
            icon={Trash2}
            aria-label={t("alert.form.delete_title")}
            onClick={onDelete}
          />
          <ToggleSwitch value={rule.enabled} onChange={onToggle} />
        </div>
      </footer>
    </article>
  );
}
