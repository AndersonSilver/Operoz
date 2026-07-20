"""Workflow helpers for classic project Intake (promote to backlog on accept)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from operoz.db.models import Issue, IssueRelation, State, StateGroup
from operoz.db.models.issue import IssueRelationChoices

if TYPE_CHECKING:
    from operoz.db.models import IntakeIssue, Project


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


class IntakeConvertError(Exception):
    pass


def convert_intake_to_project(
    intake_issue: IntakeIssue,
    destination_project: Project,
    actor_id: str | None,
) -> Issue:
    """Create a delivery issue in destination_project linked to the intake source issue.

    Returns the newly created destination Issue.
    Sets intake_issue.converted_to_issue (caller must save the intake_issue).
    """
    source_issue = intake_issue.issue
    backlog_state = resolve_backlog_state(destination_project)
    if not backlog_state:
        raise IntakeConvertError("Projeto destino não possui estado de backlog disponível.")

    dest_issue = Issue.objects.create(
        name=source_issue.name,
        description_html=source_issue.description_html or "<p></p>",
        priority=source_issue.priority or "none",
        state_id=backlog_state.id,
        project_id=destination_project.id,
        workspace_id=destination_project.workspace_id,
        created_by_id=actor_id,
        updated_by_id=actor_id,
    )

    IssueRelation.objects.get_or_create(
        issue=source_issue,
        related_issue=dest_issue,
        project_id=source_issue.project_id,
        workspace_id=source_issue.workspace_id,
        defaults={
            "relation_type": IssueRelationChoices.RELATES_TO,
            "created_by_id": actor_id,
            "updated_by_id": actor_id,
        },
    )

    # Caller saves the intake_issue after this call
    intake_issue.converted_to_issue = dest_issue
    return dest_issue
