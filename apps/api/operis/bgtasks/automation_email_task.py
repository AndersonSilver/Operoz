from __future__ import annotations

import logging

from celery import shared_task
from django.conf import settings

from operis.automation.email_renderer import deliver_automation_email

logger = logging.getLogger(__name__)

AUTOMATION_EMAIL_QUEUE = getattr(settings, "AUTOMATION_EMAIL_CELERY_QUEUE", "automation_email")
TRANSIENT_ERRORS = (ConnectionError, TimeoutError, OSError)


@shared_task(
    bind=True,
    autoretry_for=TRANSIENT_ERRORS,
    retry_backoff=True,
    retry_backoff_max=300,
    max_retries=5,
    retry_jitter=True,
    acks_late=True,
    queue=AUTOMATION_EMAIL_QUEUE,
)
def send_automation_email_task(
    self,
    *,
    subject_template: str,
    html_template: str,
    to_emails: list[str],
    context: dict,
) -> dict:
    try:
        return deliver_automation_email(
            subject_template=subject_template,
            html_template=html_template,
            to_emails=to_emails,
            context=context,
        )
    except Exception as exc:
        logger.exception("automation email task failed")
        return {"ok": False, "message": str(exc)}
