from __future__ import annotations

import logging

from django.db import transaction
from django.utils import timezone

from operis.automation.domain import DomainEvent
from operis.automation.governance import record_dispatch
from operis.automation.observability import automation_log, record_metric

logger = logging.getLogger(__name__)


def schedule_automation_jobs(event: DomainEvent, rules) -> None:
    if not rules:
        return

    from operis.db.models import BoardAutomationOutbox

    outbox_ids: list[str] = []

    with transaction.atomic():
        for rule in rules:
            row = BoardAutomationOutbox.objects.create(
                workspace_id=event.workspace_id,
                board_id=event.board_id,
                rule_id=rule.id,
                event_id=event.event_id,
                event_payload=event.to_dict(),
                status=BoardAutomationOutbox.STATUS_PENDING,
            )
            outbox_ids.append(str(row.id))
            record_dispatch(rule, event)

    def flush() -> None:
        from operis.bgtasks.automation_task import enqueue_automation_outbox

        for outbox_id in outbox_ids:
            try:
                enqueue_automation_outbox.delay(outbox_id)
            except Exception:
                logger.exception("failed to enqueue automation outbox id=%s", outbox_id)

    transaction.on_commit(flush)
    automation_log(
        "outbox_scheduled",
        board_id=event.board_id,
        event_id=event.event_id,
        rules=len(outbox_ids),
    )
    record_metric("outbox_scheduled", amount=len(outbox_ids))


def mark_outbox_enqueued(outbox_id: str) -> bool:
    from operis.db.models import BoardAutomationOutbox

    updated = BoardAutomationOutbox.objects.filter(
        pk=outbox_id,
        status=BoardAutomationOutbox.STATUS_PENDING,
    ).update(
        status=BoardAutomationOutbox.STATUS_ENQUEUED,
        enqueued_at=timezone.now(),
    )
    return updated == 1


def mark_outbox_failed(outbox_id: str, message: str) -> None:
    from operis.db.models import BoardAutomationOutbox

    BoardAutomationOutbox.objects.filter(pk=outbox_id).update(
        status=BoardAutomationOutbox.STATUS_FAILED,
        error_message=message[:2000],
        updated_at=timezone.now(),
    )
