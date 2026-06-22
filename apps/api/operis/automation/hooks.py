from __future__ import annotations

import json
from typing import Any

from operis.automation.dispatcher import dispatch_domain_event
from operis.automation.domain import DomainEvent


def _diff_changed_fields(before: dict[str, Any], after: dict[str, Any]) -> list[str]:
    changed: list[str] = []
    for key in set(before.keys()) | set(after.keys()):
        if before.get(key) != after.get(key):
            changed.append(key)
    return changed


def emit_issue_event(
    *,
    event_type: str,
    issue,
    actor_id: str | None,
    before: dict[str, Any] | None = None,
    after: dict[str, Any] | None = None,
    extra: dict[str, Any] | None = None,
) -> None:
    project = issue.project
    board_id = getattr(project, "board_id", None)
    if not board_id:
        return

    payload: dict[str, Any] = {"issue_id": str(issue.id), **(extra or {})}
    if before is not None and after is not None:
        payload["changed_fields"] = _diff_changed_fields(before, after)
        payload["before"] = before
        payload["after"] = after

    event = DomainEvent.create(
        event_type=event_type,
        workspace_id=str(project.workspace_id),
        board_id=str(board_id),
        actor_id=actor_id,
        entity_type="issue",
        entity_id=str(issue.id),
        project_id=str(project.id),
        payload=payload,
    )
    dispatch_domain_event(event)


def emit_issue_created(issue, *, actor_id: str | None) -> None:
    emit_issue_event(event_type="issue.created", issue=issue, actor_id=actor_id)


def emit_intake_submitted(
    issue,
    *,
    actor_id: str | None,
    intake_form_id: str | None = None,
    board_intake_form_id: str | None = None,
    source: str = "IN_APP",
) -> None:
    emit_issue_event(
        event_type="intake.submitted",
        issue=issue,
        actor_id=actor_id,
        extra={
            "intake_form_id": intake_form_id,
            "board_intake_form_id": board_intake_form_id,
            "source": source,
        },
    )


def emit_issue_updated(issue, *, actor_id: str | None, before: dict, after: dict) -> None:
    changed = _diff_changed_fields(before, after)
    emit_issue_event(
        event_type="issue.updated",
        issue=issue,
        actor_id=actor_id,
        before=before,
        after=after,
    )
    if "state" in changed or "state_id" in changed:
        emit_issue_event(
            event_type="issue.state_changed",
            issue=issue,
            actor_id=actor_id,
            before=before,
            after=after,
        )
    if "assignees" in changed or "assignee_ids" in changed:
        emit_issue_event(
            event_type="issue.assignee_changed",
            issue=issue,
            actor_id=actor_id,
            before=before,
            after=after,
        )


def serialize_issue_snapshot(issue_data: dict | str) -> dict[str, Any]:
    if isinstance(issue_data, str):
        return json.loads(issue_data)
    return issue_data
