from __future__ import annotations

from operis.alerts.channels.base import BaseAlertChannel
from operis.alerts.email_renderer import build_alert_email_context
from operis.alerts.types import AlertContext, AlertResult
from operis.bgtasks.alert_digest_task import queue_alert_for_digest
from operis.bgtasks.alert_email_task import send_alert_email
from operis.db.models import UserNotificationPreference


class EmailAlertChannel(BaseAlertChannel):
    channel_type = "email"

    def _email_frequency(self, context: AlertContext) -> str:
        pref = UserNotificationPreference.objects.filter(
            user_id=context.user.id,
            workspace_id=context.workspace.id,
            deleted_at__isnull=True,
        ).first()
        if pref and pref.channels:
            cfg = pref.channels.get("email") or {}
            return cfg.get("frequency") or "immediate"
        return "immediate"

    def send(self, context: AlertContext) -> AlertResult:
        issue = context.subject.issue
        email_context = build_alert_email_context(
            issue=issue,
            alert_type=context.alert_type,
            issue_url=context.issue_url,
            extra=context.extra,
        )
        frequency = self._email_frequency(context)

        if frequency in ("digest_daily", "digest_weekly"):
            queue_alert_for_digest(
                user_id=str(context.user.id),
                workspace_id=str(context.workspace.id),
                payload=email_context,
            )
            return AlertResult(success=True)

        try:
            send_alert_email.delay(
                issue_id=str(issue.id),
                receiver_id=str(context.user.id),
                alert_type=context.alert_type,
                issue_url=context.issue_url,
                extra=context.extra,
            )
            return AlertResult(success=True)
        except Exception as exc:
            return AlertResult(success=False, error=str(exc))
