from __future__ import annotations

from operoz.alerts.channels.base import BaseAlertChannel
from operoz.alerts.services.google_calendar import (
    CALENDAR_DELETE_ALERT_TYPES,
    calendar_event_summary,
    delete_issue_event,
    resolve_calendar_event_at,
    upsert_issue_event,
)
from operoz.alerts.types import AlertContext, AlertResult
from operoz.db.models import UserExternalAccount, UserNotificationPreference
from operoz.db.models.external_account import UserExternalAccount as ExternalAccountModel


class GoogleCalendarChannel(BaseAlertChannel):
    channel_type = "google_calendar"

    def validate_account(self, user, workspace) -> bool:
        return UserExternalAccount.objects.filter(
            user_id=user.id,
            workspace_id=workspace.id,
            provider=ExternalAccountModel.Provider.GOOGLE_CALENDAR,
            is_active=True,
            deleted_at__isnull=True,
        ).exists()

    def _auto_create_enabled(self, context: AlertContext) -> bool:
        pref = UserNotificationPreference.objects.filter(
            user_id=context.user.id,
            workspace_id=context.workspace.id,
            deleted_at__isnull=True,
        ).first()
        if pref and pref.channels:
            gcal = pref.channels.get("google_calendar") or {}
            if "auto_create_events" in gcal:
                return bool(gcal.get("auto_create_events"))
        account = UserExternalAccount.objects.filter(
            user_id=context.user.id,
            workspace_id=context.workspace.id,
            provider=ExternalAccountModel.Provider.GOOGLE_CALENDAR,
            is_active=True,
            deleted_at__isnull=True,
        ).first()
        if account and account.metadata:
            return bool(account.metadata.get("auto_create_events", True))
        return True

    def send(self, context: AlertContext) -> AlertResult:
        account = UserExternalAccount.objects.filter(
            user_id=context.user.id,
            workspace_id=context.workspace.id,
            provider=ExternalAccountModel.Provider.GOOGLE_CALENDAR,
            is_active=True,
            deleted_at__isnull=True,
        ).first()
        if not account:
            return AlertResult(success=False, error="Google Calendar not connected")

        issue = context.subject.issue
        try:
            if context.alert_type in CALENDAR_DELETE_ALERT_TYPES:
                delete_issue_event(account=account, issue=issue)
                return AlertResult(success=True)

            event_at, all_day = resolve_calendar_event_at(
                issue=issue,
                intake_issue=context.subject.intake_issue,
                alert_type=context.alert_type,
            )
            if event_at is None:
                return AlertResult(success=False, error="no due date or SLA for calendar event")

            if not self._auto_create_enabled(context):
                return AlertResult(success=True)

            summary = calendar_event_summary(issue=issue, alert_type=context.alert_type)
            event_id = upsert_issue_event(
                account=account,
                issue=issue,
                issue_url=context.issue_url,
                event_at=event_at,
                all_day=all_day,
                summary=summary,
            )
            if not event_id:
                return AlertResult(success=False, error="Could not sync calendar event")
            return AlertResult(success=True)
        except Exception as exc:
            account.is_active = False
            account.save(update_fields=["is_active", "updated_at"])
            return AlertResult(success=False, error=str(exc))
