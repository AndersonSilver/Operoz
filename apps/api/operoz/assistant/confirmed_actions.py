from __future__ import annotations

from typing import Any

import nh3

from operoz.assistant.security.access import get_accessible_issue
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


def execute_confirmed_action(ctx: AssistantActorContext, proposal: dict[str, Any]) -> dict[str, Any]:
    action_type = str(proposal.get("action_type") or "")
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
