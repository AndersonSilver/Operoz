from __future__ import annotations

import json
from typing import Any

from operoz.automation.dispatcher import dispatch_domain_event
from operoz.automation.domain import DomainEvent


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


def emit_intake_converted(
    issue,
    *,
    actor_id: str | None,
    destination_project_id: str,
    destination_issue_id: str,
) -> None:
    emit_issue_event(
        event_type="intake.converted",
        issue=issue,
        actor_id=actor_id,
        extra={
            "destination_project_id": destination_project_id,
            "destination_issue_id": destination_issue_id,
        },
    )


def emit_intake_rejected(issue, *, actor_id: str | None, decline_category: str | None, decline_reason: str | None) -> None:
    emit_issue_event(
        event_type="intake.rejected",
        issue=issue,
        actor_id=actor_id,
        extra={"decline_category": decline_category, "decline_reason": decline_reason},
    )


def emit_intake_deferred(issue, *, actor_id: str | None, deferred_until: str | None) -> None:
    emit_issue_event(
        event_type="intake.deferred",
        issue=issue,
        actor_id=actor_id,
        extra={"deferred_until": deferred_until},
    )


def emit_intake_consulting(issue, *, actor_id: str | None, outcome_note: str | None) -> None:
    emit_issue_event(
        event_type="intake.consulting",
        issue=issue,
        actor_id=actor_id,
        extra={"outcome_note": outcome_note},
    )


def emit_intake_needs_info(issue, *, actor_id: str | None) -> None:
    emit_issue_event(
        event_type="intake.needs_info",
        issue=issue,
        actor_id=actor_id,
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


def build_issue_automation_snapshot(issue) -> dict[str, Any]:
    """Lightweight issue snapshot for automation diffs (no full IssueDetailSerializer)."""

    def _value(field: str) -> Any:
        if not hasattr(issue, field):
            return None
        raw = getattr(issue, field)
        if hasattr(raw, "hex"):
            return str(raw)
        if isinstance(raw, list):
            return [str(item) if hasattr(item, "hex") else item for item in raw]
        return raw

    return {
        "id": str(issue.id),
        "name": _value("name"),
        "state_id": _value("state_id"),
        "type_id": _value("type_id"),
        "priority": _value("priority"),
        "assignee_ids": _value("assignee_ids") or [],
        "label_ids": _value("label_ids") or [],
        "module_ids": _value("module_ids") or [],
        "description_html": _value("description_html"),
        "start_date": _value("start_date"),
        "target_date": _value("target_date"),
        "parent_id": _value("parent_id"),
        "estimate_point": _value("estimate_point_id"),
        "project_id": _value("project_id"),
    }
