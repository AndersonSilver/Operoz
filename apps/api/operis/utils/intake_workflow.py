"""Workflow helpers for classic project Intake (promote to backlog on accept)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from operis.db.models import State, StateGroup

if TYPE_CHECKING:
    from operis.db.models import Issue, Project


def resolve_backlog_state(project: Project) -> State | None:
    state = (
        State.objects.filter(
            project_id=project.id,
            workspace_id=project.workspace_id,
            default=True,
            deleted_at__isnull=True,
        )
        .exclude(group=StateGroup.TRIAGE.value)
        .order_by("sequence")
        .first()
    )
    if state:
        return state

    return (
        State.objects.filter(
            project_id=project.id,
            workspace_id=project.workspace_id,
            deleted_at__isnull=True,
        )
        .exclude(group=StateGroup.TRIAGE.value)
        .order_by("sequence")
        .first()
    )


def promote_issue_to_backlog(issue: Issue, project: Project) -> None:
    backlog_state = resolve_backlog_state(project)
    if not backlog_state:
        return
    if issue.state_id == backlog_state.id:
        return
    issue.state_id = backlog_state.id
    issue.save(update_fields=["state_id", "updated_at"])
