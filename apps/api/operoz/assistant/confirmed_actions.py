from __future__ import annotations

from typing import Any

import nh3

from operoz.assistant.security.access import accessible_projects, get_accessible_issue
from operoz.assistant.types import AssistantActorContext
from operoz.db.models import IssueComment, State


def build_issue_comment_proposal(*, ctx: AssistantActorContext, issue_id: str, comment: str) -> dict[str, Any]:
    issue = get_accessible_issue(ctx, issue_id)
    if not issue:
        return {"ok": False, "error": "issue_not_found_or_forbidden"}
    clean_comment = nh3.clean(comment.strip(), tags=set())
    if not clean_comment:
        return {"ok": False, "error": "comment_required"}
    return {
        "ok": True,
        "action_proposal": {
            "action_type": "issue_comment",
            "issue_id": str(issue.id),
            "work_item": f"{issue.project.identifier}-{issue.sequence_id}",
            "issue_name": issue.name,
            "comment": clean_comment,
            "summary": f"Comentar em {issue.project.identifier}-{issue.sequence_id}",
        },
    }


def build_issue_state_change_proposal(
    *,
    ctx: AssistantActorContext,
    issue_id: str,
    state_id: str,
) -> dict[str, Any]:
    issue = get_accessible_issue(ctx, issue_id)
    if not issue:
        return {"ok": False, "error": "issue_not_found_or_forbidden"}
    state = State.objects.filter(pk=state_id, project_id=issue.project_id).first()
    if not state:
        return {"ok": False, "error": "state_not_found"}
    return {
        "ok": True,
        "action_proposal": {
            "action_type": "issue_state_change",
            "issue_id": str(issue.id),
            "state_id": str(state.id),
            "state_name": state.name,
            "work_item": f"{issue.project.identifier}-{issue.sequence_id}",
            "issue_name": issue.name,
            "summary": f"Mover {issue.project.identifier}-{issue.sequence_id} → {state.name}",
        },
    }


def build_intake_create_proposal(
    *,
    ctx: AssistantActorContext,
    project_id: str,
    name: str,
    description_html: str,
    priority: str = "none",
) -> dict[str, Any]:
    """Build a proposal for creating an intake issue (requires user confirmation before writing)."""
    projects = accessible_projects(ctx, ctx.board_slug).filter(pk=project_id)
    project = projects.first()
    if not project:
        return {"ok": False, "error": "project_not_found_or_forbidden"}

    clean_name = nh3.clean(name.strip(), tags=set())
    if not clean_name:
        return {"ok": False, "error": "name_required"}

    clean_description = nh3.clean(description_html.strip()) if description_html else ""
    valid_priorities = {"low", "medium", "high", "urgent", "none"}
    safe_priority = priority if priority in valid_priorities else "none"

    return {
        "ok": True,
        "action_proposal": {
            "action_type": "intake_create",
            "project_id": str(project.id),
            "project_name": project.name,
            "name": clean_name,
            "description_html": clean_description or "<p></p>",
            "priority": safe_priority,
            "summary": f'Abrir pedido no intake de {project.name}: "{clean_name}"',
        },
    }


def execute_confirmed_action(ctx: AssistantActorContext, proposal: dict[str, Any]) -> dict[str, Any]:
    action_type = str(proposal.get("action_type") or "")

    if action_type == "intake_create":
        from operoz.db.models import Intake, IntakeIssue, Issue, Project, State, StateGroup
        from operoz.db.models.intake import SourceType, IntakeTicketKind
        from operoz.automation.hooks import emit_intake_submitted

        project_id = str(proposal.get("project_id") or "")
        project = (
            accessible_projects(ctx, ctx.board_slug).filter(pk=project_id).first()
        )
        if not project:
            return {"ok": False, "error": "project_not_found_or_forbidden"}

        intake = Intake.objects.filter(project=project, deleted_at__isnull=True).first()
        if not intake:
            return {"ok": False, "error": "intake_not_enabled_for_project"}

        triage_state = (
            State.objects.filter(
                project=project,
                group=StateGroup.TRIAGE.value,
                deleted_at__isnull=True,
            )
            .order_by("sequence")
            .first()
        )
        if not triage_state:
            triage_state = State.objects.filter(
                project=project, deleted_at__isnull=True
            ).order_by("sequence").first()

        issue = Issue.objects.create(
            name=str(proposal.get("name") or ""),
            description_html=str(proposal.get("description_html") or "<p></p>"),
            priority=str(proposal.get("priority") or "none"),
            state=triage_state,
            project=project,
            workspace=project.workspace,
            created_by=ctx.user,
            updated_by=ctx.user,
        )
        intake_issue = IntakeIssue.objects.create(
            intake=intake,
            issue=issue,
            project=project,
            workspace=project.workspace,
            source=SourceType.IN_APP,
            ticket_kind=IntakeTicketKind.INTAKE,
            created_by=ctx.user,
            updated_by=ctx.user,
        )
        emit_intake_submitted(
            issue,
            actor_id=str(ctx.user.id),
            source=SourceType.IN_APP,
        )
        return {
            "ok": True,
            "action_type": action_type,
            "intake_issue_id": str(intake_issue.id),
            "issue_id": str(issue.id),
            "project_id": str(project.id),
            "project_name": project.name,
        }

    issue_id = str(proposal.get("issue_id") or "")
    issue = get_accessible_issue(ctx, issue_id)
    if not issue:
        return {"ok": False, "error": "issue_not_found_or_forbidden"}

    if action_type == "issue_comment":
        comment = nh3.clean(str(proposal.get("comment") or "").strip(), tags=set())
        if not comment:
            return {"ok": False, "error": "comment_required"}
        created = IssueComment.objects.create(
            issue=issue,
            project=issue.project,
            actor=ctx.user,
            comment_stripped=comment,
            comment_html=f"<p>{comment}</p>",
            created_by=ctx.user,
        )
        return {"ok": True, "comment_id": str(created.id), "action_type": action_type}

    if action_type == "issue_state_change":
        state_id = str(proposal.get("state_id") or "")
        state = State.objects.filter(pk=state_id, project_id=issue.project_id).first()
        if not state:
            return {"ok": False, "error": "state_not_found"}
        issue.state = state
        issue.updated_by = ctx.user
        issue.save(update_fields=["state", "updated_by", "updated_at"])
        return {
            "ok": True,
            "issue_id": str(issue.id),
            "state_id": str(state.id),
            "action_type": action_type,
        }

    return {"ok": False, "error": "unknown_action_type"}
