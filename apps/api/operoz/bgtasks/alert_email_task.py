from __future__ import annotations

import json

from celery import shared_task

from operoz.alerts.email_renderer import build_alert_email_context, send_alert_email_sync
from operoz.db.models import Issue, User


@shared_task
def send_alert_email(
    *,
    issue_id: str,
    receiver_id: str,
    alert_type: str,
    issue_url: str,
    extra: dict | None = None,
) -> None:
    issue = (
        Issue.objects.select_related("project", "workspace")
        .prefetch_related("assignees")
        .filter(pk=issue_id, deleted_at__isnull=True)
        .first()
    )
    receiver = User.objects.filter(pk=receiver_id, is_active=True).first()
    if not issue or not receiver or not receiver.email:
        return

    context = build_alert_email_context(
        issue=issue,
        alert_type=alert_type,
        issue_url=issue_url,
        extra=extra or {},
    )
    send_alert_email_sync(to_email=receiver.email, context=context)
