from __future__ import annotations

from typing import Any

from django.utils import timezone

from operoz.automation.domain import DomainEvent
from operoz.automation.secrets import redact_for_storage


def _status_from_result(result: dict[str, Any], step_logs: list[dict[str, Any]]) -> str:
    from operoz.db.models import BoardAutomationRun

    if not result.get("matched"):
        return BoardAutomationRun.STATUS_SKIPPED
    if not result.get("passed_filters", True):
        return BoardAutomationRun.STATUS_SKIPPED
    failed = any(s.get("kind") == "action" and not s.get("ok", False) for s in step_logs)
    return BoardAutomationRun.STATUS_FAILED if failed else BoardAutomationRun.STATUS_SUCCESS


def persist_automation_run(
    rule,
    event: DomainEvent,
    graph: dict[str, Any],
    result: dict[str, Any],
    *,
    dry_run: bool,
) -> Any | None:
    """Grava execução no histórico. Testes manuais (live) e produção usam dry_run=False."""
    if dry_run:
        return None

    from operoz.db.models import BoardAutomationRun

    now = timezone.now()
    step_logs = redact_for_storage(result.get("steps", []))
    status = _status_from_result(result, step_logs)

    return BoardAutomationRun.objects.create(
        rule=rule,
        board=rule.board,
        event_id=event.event_id,
        event_type=event.event_type,
        dry_run=False,
        status=status,
        context_snapshot=redact_for_storage(event.to_dict()),
        graph_snapshot=graph,
        graph_version=rule.published_version or rule.graph_version,
        correlation_id=event.event_id,
        step_logs=step_logs,
        started_at=now,
        finished_at=now,
    )
