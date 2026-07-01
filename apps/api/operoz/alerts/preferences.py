from __future__ import annotations

from typing import TYPE_CHECKING

from operoz.db.models import AlertRule, UserAlertPreference, UserNotificationPreference

if TYPE_CHECKING:
    from operoz.db.models import User

ALL_CHANNEL_TYPES = ("email", "discord_dm", "google_calendar", "in_app")


class UserAlertPreferences:
    def __init__(
        self,
        *,
        user: User,
        workspace_id: str,
        overrides: dict[tuple[str, str], bool],
        notification_pref: UserNotificationPreference | None,
    ):
        self.user = user
        self.workspace_id = workspace_id
        self.overrides = overrides
        self.notification_pref = notification_pref

    def is_enabled(self, alert_type: str, channel_type: str) -> bool:
        override_key = (alert_type, channel_type)
        if override_key in self.overrides:
            return self.overrides[override_key]

        if self.notification_pref and self.notification_pref.channels:
            channel_cfg = self.notification_pref.channels.get(channel_type)
            if isinstance(channel_cfg, dict) and "enabled" in channel_cfg:
                return bool(channel_cfg.get("enabled"))

        return True

    @property
    def quiet_hours_pref(self) -> UserNotificationPreference | None:
        return self.notification_pref


def get_user_alert_preferences(user: User, workspace_id: str) -> UserAlertPreferences:
    overrides = {
        (row.alert_type, row.channel_type): row.enabled
        for row in UserAlertPreference.objects.filter(user_id=user.id, workspace_id=workspace_id, deleted_at__isnull=True)
    }
    notification_pref = (
        UserNotificationPreference.objects.filter(user_id=user.id, workspace_id=workspace_id, deleted_at__isnull=True)
        .order_by("-updated_at")
        .first()
    )
    if notification_pref is None:
        notification_pref = UserNotificationPreference.objects.filter(user_id=user.id, workspace__isnull=True).first()
    return UserAlertPreferences(
        user=user,
        workspace_id=workspace_id,
        overrides=overrides,
        notification_pref=notification_pref,
    )


def is_alert_type_enabled_for_user(prefs: UserAlertPreferences, alert_type: str) -> bool:
    notification_pref = prefs.notification_pref
    if notification_pref is None:
        return True
    if alert_type in ("due_date_approaching", "due_date_overdue"):
        return notification_pref.due_date_alert
    if alert_type == "missing_due_date":
        return notification_pref.missing_due_date_alert
    if alert_type == "issue_created":
        return notification_pref.issue_created_alert
    return True


def resolve_channels_for_rule(rule: AlertRule, *, days_until: int | None = None) -> list[str]:
    schedule = rule.escalation_schedule or []
    if days_until is not None and schedule:
        matched = None
        for entry in sorted(schedule, key=lambda item: item.get("days_before", 0), reverse=True):
            if days_until <= int(entry.get("days_before", 0)):
                matched = entry
                break
        if matched and matched.get("channels"):
            return list(matched["channels"])
    return list(rule.channels or [])
