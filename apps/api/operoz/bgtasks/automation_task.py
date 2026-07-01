import logging
from datetime import timedelta

from celery import shared_task
from django.db import IntegrityError, OperationalError
from django.utils import timezone

from operoz.automation.dlq import persist_dead_letter
from operoz.automation.domain import DomainEvent
from operoz.automation.executor import execute_graph
from operoz.automation.governance import is_circuit_open, record_rule_failure, record_rule_success
from operoz.automation.observability import (
    automation_log,
    bind_correlation,
    observe_duration,
    record_metric,
)
from operoz.automation.outbox import mark_outbox_enqueued, mark_outbox_failed
from operoz.automation.rule_lifecycle import get_rule_execution_graph
from operoz.automation.secrets import redact_for_storage
from operoz.db.models import BoardAutomationOutbox, BoardAutomationRun, BoardAutomationRule

logger = logging.getLogger(__name__)

AUTOMATION_QUEUE = "automation"
TRANSIENT_ERRORS = (OperationalError, ConnectionError, TimeoutError)


@shared_task(
    bind=True,
    autoretry_for=TRANSIENT_ERRORS,
    retry_backoff=True,
    retry_backoff_max=600,
    max_retries=5,
    retry_jitter=True,
    acks_late=True,
    queue=AUTOMATION_QUEUE,
)
def enqueue_automation_outbox(self, outbox_id: str) -> None:
    try:
        outbox = BoardAutomationOutbox.objects.select_related("rule").get(pk=outbox_id)
    except BoardAutomationOutbox.DoesNotExist:
        logger.warning("automation outbox not found %s", outbox_id)
        return

    if outbox.status != BoardAutomationOutbox.STATUS_PENDING:
        return

    if not mark_outbox_enqueued(outbox_id):
        return

    event_payload = outbox.event_payload or {}
    bind_correlation(event_payload.get("event_id", outbox.event_id))

    try:
        run_board_automation.delay(
            rule_id=str(outbox.rule_id),
            event_payload=event_payload,
            outbox_id=outbox_id,
        )
        record_metric("outbox_enqueued")
    except Exception as exc:
        mark_outbox_failed(outbox_id, str(exc))
        record_metric("outbox_enqueue_failed")
        raise


@shared_task(
    bind=True,
    autoretry_for=TRANSIENT_ERRORS,
    retry_backoff=True,
    retry_backoff_max=600,
    max_retries=5,
    retry_jitter=True,
    acks_late=True,
    queue=AUTOMATION_QUEUE,
)
def run_board_automation(
    self,
    rule_id: str,
    event_payload: dict,
    dry_run: bool = False,
    outbox_id: str | None = None,
) -> None:
    event = DomainEvent.from_dict(event_payload)
    bind_correlation(event.event_id)

    try:
        rule = BoardAutomationRule.objects.select_related("board", "created_by", "workspace").get(
            pk=rule_id, deleted_at__isnull=True
        )
    except BoardAutomationRule.DoesNotExist:
        logger.warning("automation rule not found %s", rule_id)
        record_metric("run_rule_not_found")
        return

    if not rule.enabled and not dry_run:
        record_metric("run_rule_disabled")
        return

    execution_graph = get_rule_execution_graph(rule)

    if not dry_run and not execution_graph.get("nodes"):
        record_metric("run_rule_unpublished")
        return

    if not dry_run and is_circuit_open(rule_id):
        automation_log("run_skipped_circuit_open", rule_id=rule_id)
        record_metric("run_circuit_open")
        return

    automation_actor = rule.created_by
    run = None

    if not dry_run:
        try:
            run, created = BoardAutomationRun.objects.get_or_create(
                rule=rule,
                event_id=event.event_id,
                dry_run=False,
                defaults={
                    "board": rule.board,
                    "event_type": event.event_type,
                    "status": BoardAutomationRun.STATUS_PENDING,
                    "context_snapshot": redact_for_storage(event.to_dict()),
                    "graph_snapshot": execution_graph,
                    "graph_version": rule.published_version or rule.graph_version,
                    "correlation_id": event.event_id,
                },
            )
            if not created:
                record_metric("run_duplicate_skipped")
                return
        except IntegrityError:
            record_metric("run_duplicate_skipped")
            return

        run.status = BoardAutomationRun.STATUS_RUNNING
        run.started_at = timezone.now()
        run.save(update_fields=["status", "started_at", "updated_at"])

    automation_log("run_started", rule_id=rule_id, event_type=event.event_type, dry_run=dry_run)

    try:
        with observe_duration("run_duration_ms", rule_id=rule_id):
            result = execute_graph(
                execution_graph,
                event,
                rule_id=str(rule.id),
                automation_actor=automation_actor,
                dry_run=dry_run,
            )

        if dry_run:
            return

        if not run:
            return

        step_logs = redact_for_storage(result.get("steps", []))

        if not result.get("matched"):
            run.status = BoardAutomationRun.STATUS_SKIPPED
            run.step_logs = step_logs
            run.finished_at = timezone.now()
            run.save(update_fields=["status", "step_logs", "finished_at", "updated_at"])
            record_metric("run_skipped")
            record_rule_success(rule_id)
            return

        if not result.get("passed_filters", True):
            run.status = BoardAutomationRun.STATUS_SKIPPED
            run.step_logs = step_logs
            run.finished_at = timezone.now()
            run.save(update_fields=["status", "step_logs", "finished_at", "updated_at"])
            record_metric("run_filtered")
            record_rule_success(rule_id)
            return

        failed = any(s.get("kind") == "action" and not s.get("ok", False) for s in step_logs)
        run.status = BoardAutomationRun.STATUS_FAILED if failed else BoardAutomationRun.STATUS_SUCCESS
        run.step_logs = step_logs
        run.finished_at = timezone.now()
        run.save(update_fields=["status", "step_logs", "finished_at", "updated_at"])

        if failed:
            record_metric("run_failed")
            record_rule_failure(rule_id)
        else:
            record_metric("run_success")
            record_rule_success(rule_id)

        automation_log("run_finished", rule_id=rule_id, status=run.status)
    except TRANSIENT_ERRORS:
        raise
    except Exception as exc:
        logger.exception("automation run failed rule=%s", rule_id)
        if run:
            run.status = BoardAutomationRun.STATUS_FAILED
            run.error_message = str(exc)[:4000]
            run.finished_at = timezone.now()
            run.save(update_fields=["status", "error_message", "finished_at", "updated_at"])

        record_rule_failure(rule_id)
        record_metric("run_exception")

        if self.request.retries >= self.max_retries:
            persist_dead_letter(
                rule_id=rule_id,
                board_id=str(rule.board_id),
                workspace_id=str(rule.workspace_id),
                event_id=event.event_id,
                event_payload=event_payload,
                error_message=str(exc),
                exc=exc,
                retry_count=self.request.retries,
                task_id=self.request.id or "",
            )
            record_metric("dlq_persisted")
            automation_log("run_dead_lettered", rule_id=rule_id, event_id=event.event_id)
        raise


@shared_task(queue=AUTOMATION_QUEUE)
def dispatch_scheduled_automation_rules() -> None:
    """Varre regras com gatilho schedule.cron e dispara as que estão no horário."""
    from operoz.automation.schedule import dispatch_due_scheduled_rules

    try:
        count = dispatch_due_scheduled_rules()
        if count:
            record_metric("schedule_dispatched", amount=count)
            automation_log("schedule_dispatch_completed", dispatched=count)
    except Exception:
        logger.exception("dispatch_scheduled_automation_rules failed")
        record_metric("schedule_dispatch_failed")
        raise


@shared_task(queue=AUTOMATION_QUEUE)
def flush_stale_automation_outbox() -> None:
    """Recupera entradas pendentes na outbox (falha entre persistência e enqueue)."""
    cutoff = timezone.now() - timedelta(minutes=2)
    stale_ids = list(
        BoardAutomationOutbox.objects.filter(
            status=BoardAutomationOutbox.STATUS_PENDING,
            created_at__lte=cutoff,
        ).values_list("id", flat=True)[:200]
    )

    for outbox_id in stale_ids:
        enqueue_automation_outbox.delay(str(outbox_id))

    if stale_ids:
        record_metric("outbox_flush_recovered", amount=len(stale_ids))
