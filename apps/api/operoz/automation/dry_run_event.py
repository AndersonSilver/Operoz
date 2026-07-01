from __future__ import annotations

from dataclasses import replace
from uuid import UUID

from operoz.automation.compiler import compile_graph
from operoz.automation.domain import DomainEvent
from operoz.db.models import Issue


def _is_valid_uuid(value: str) -> bool:
    try:
        UUID(str(value))
        return True
    except (ValueError, TypeError, AttributeError):
        return False


def run_requires_issue(graph: dict, event: DomainEvent) -> bool:
    """Agendamentos cron podem ser testados sem card; ações que precisam de card falham no fluxo."""
    if event.event_type == "schedule.cron":
        return False
    try:
        compiled = compile_graph(graph)
        if compiled.trigger.catalog_key == "schedule.cron":
            return False
    except ValueError:
        pass
    return True


def resolve_board_test_event(board, event: DomainEvent) -> tuple[DomainEvent, Issue | None]:
    """Substitui IDs fictícios do teste por um card real do board (mais recente)."""
    issue: Issue | None = None

    if event.event_type == "schedule.cron":
        issue = (
            Issue.objects.filter(
                project__board_id=board.id,
                deleted_at__isnull=True,
            )
            .select_related("project")
            .order_by("-created_at")
            .first()
        )
        if issue is None:
            return event, None
        payload = dict(event.payload or {})
        payload["issue_id"] = str(issue.id)
        return replace(event, payload=payload), issue

    if event.entity_type == "issue" and event.entity_id and _is_valid_uuid(event.entity_id):
        issue = (
            Issue.objects.filter(
                id=event.entity_id,
                project__board_id=board.id,
                deleted_at__isnull=True,
            )
            .select_related("project")
            .first()
        )

    if issue is None:
        issue = (
            Issue.objects.filter(
                project__board_id=board.id,
                deleted_at__isnull=True,
            )
            .select_related("project")
            .order_by("-created_at")
            .first()
        )

    if issue is None:
        return event, None

    payload = dict(event.payload or {})
    payload["issue_id"] = str(issue.id)

    resolved = replace(
        event,
        entity_id=str(issue.id),
        project_id=str(issue.project_id),
        workspace_id=str(board.workspace_id),
        board_id=str(board.id),
        payload=payload,
    )
    return resolved, issue
