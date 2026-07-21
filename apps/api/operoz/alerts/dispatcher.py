from __future__ import annotations

from typing import TYPE_CHECKING

from django.utils import timezone

from operoz.alerts.access import user_can_receive_issue_alert
from operoz.alerts.channels import get_channel_handler
from operoz.alerts.preferences import (
    get_user_alert_preferences,
    is_alert_type_enabled_for_user,
    resolve_channels_for_rule,
)
from operoz.alerts.quiet_hours import is_in_quiet_hours
from operoz.alerts.recipients import resolve_recipients, resolve_support_recipients
from operoz.alerts.throttle import rate_limit_check, throttle_check
from operoz.alerts.types import AlertContext, AlertSubject
from operoz.db.models import AlertLog, AlertRule
from operoz.utils.host import frontend_base_url

if TYPE_CHECKING:
    from operoz.db.models import Issue, User


SUPPORT_ALERT_TYPES = frozenset(
    {
        AlertRule.AlertType.INTAKE_CREATED,
        AlertRule.AlertType.SUPPORT_TICKET_CREATED,
        AlertRule.AlertType.SUPPORT_TICKET_ACCEPTED,
        AlertRule.AlertType.SUPPORT_SLA_APPROACHING,
        AlertRule.AlertType.SUPPORT_SLA_BREACHED,
        AlertRule.AlertType.SUPPORT_TICKET_CLOSED,
        AlertRule.AlertType.SUPPORT_NO_TEAM_RESPONSE,
    }
)


def build_issue_url(issue: Issue) -> str:
    return f"{frontend_base_url()}/{issue.workspace.slug}/projects/{issue.project_id}/issues/{issue.id}"


def _resolve_recipients_for_alert(
    subject: AlertSubject, rule: AlertRule, config_override: dict | None = None
) -> list[User]:
    config = config_override if config_override is not None else (rule.config or {})
    if rule.alert_type in SUPPORT_ALERT_TYPES:
        return resolve_support_recipients(subject, config)
    return resolve_recipients(subject, config)


def dispatch_to_channels(
    *,
    rule: AlertRule,
    subject: AlertSubject,
    user: User,
    alert_type: str,
    extra: dict | None = None,
    actor_id: str | None = None,
) -> None:
    issue = subject.issue
    if not user_can_receive_issue_alert(user=user, issue=issue):
        _log_skipped(rule, issue, user, alert_type, "all", "user cannot access issue")
        return

    prefs = get_user_alert_preferences(user, str(issue.workspace_id))
    if not is_alert_type_enabled_for_user(prefs, alert_type):
        _log_skipped(rule, issue, user, alert_type, "all", "alert type disabled for user")
        return

    if is_in_quiet_hours(prefs=prefs.quiet_hours_pref):
        _log_skipped(rule, issue, user, alert_type, "all", "quiet hours")
        return

    days_until = extra.get("days_until") if extra else None
    channels = resolve_channels_for_rule(rule, days_until=days_until)

    for channel_type in channels:
        if (
            actor_id
            and str(user.id) == str(actor_id)
            and alert_type == AlertRule.AlertType.ISSUE_CREATED
            and channel_type in ("email", "in_app")
        ):
            _log_skipped(rule, issue, user, alert_type, channel_type, "actor is creator")
            continue

        if not prefs.is_enabled(alert_type, channel_type):
            _log_skipped(rule, issue, user, alert_type, channel_type, "channel disabled")
            continue

        if not rate_limit_check(workspace_id=str(issue.workspace_id), user_id=str(user.id), channel=channel_type):
            _log_status(rule, issue, user, alert_type, channel_type, AlertLog.Status.THROTTLED)
            continue

        if not throttle_check(
            user_id=str(user.id),
            issue_id=str(issue.id),
            alert_type=alert_type,
            channel=channel_type,
        ):
            _log_status(rule, issue, user, alert_type, channel_type, AlertLog.Status.THROTTLED)
            continue

        handler = get_channel_handler(channel_type)
        if handler is None:
            _log_status(
                rule,
                issue,
                user,
                alert_type,
                channel_type,
                AlertLog.Status.FAILED,
                error="unknown channel",
            )
            continue

        if not handler.validate_account(user, issue.workspace):
            if channel_type in ("discord_dm", "google_calendar"):
                _log_status(
                    rule,
                    issue,
                    user,
                    alert_type,
                    channel_type,
                    AlertLog.Status.SKIPPED,
                    error="external account not linked",
                )
                continue

        context = AlertContext(
            subject=subject,
            user=user,
            alert_type=alert_type,
            workspace=issue.workspace,
            extra=extra or {},
            issue_url=build_issue_url(issue),
        )
        result = handler.send(context)
        status = AlertLog.Status.SENT if result.success else AlertLog.Status.FAILED
        _log_status(rule, issue, user, alert_type, channel_type, status, error=result.error, data=context.extra)


def dispatch_rule_for_subject(
    *,
    rule: AlertRule,
    subject: AlertSubject,
    alert_type: str,
    extra: dict | None = None,
    actor_id: str | None = None,
    config_override: dict | None = None,
) -> None:
    recipients = _resolve_recipients_for_alert(subject, rule, config_override=config_override)
    for user in recipients:
        dispatch_to_channels(
            rule=rule,
            subject=subject,
            user=user,
            alert_type=alert_type,
            extra=extra,
            actor_id=actor_id,
        )


def _log_skipped(rule, issue, user, alert_type, channel, reason: str) -> None:
    _log_status(rule, issue, user, alert_type, channel, AlertLog.Status.SKIPPED, error=reason)


def _log_status(rule, issue, user, alert_type, channel, status, error: str = "", data: dict | None = None) -> None:
    AlertLog.objects.create(
        workspace_id=issue.workspace_id,
        alert_rule=rule,
        issue=issue,
        receiver=user,
        channel=channel,
        alert_type=alert_type,
        status=status,
        error=error or "",
        data=data or {},
        sent_at=timezone.now() if status == AlertLog.Status.SENT else None,
    )
