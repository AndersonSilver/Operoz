"""Access control — only alert users who can view the issue."""

from __future__ import annotations

from operoz.app.permissions import ROLE
from operoz.db.models import Issue, ProjectMember, WorkspaceMember


def user_can_receive_issue_alert(*, user, issue: Issue) -> bool:
    if not user or not getattr(user, "is_active", True):
        return False

    workspace_id = issue.workspace_id
    project_id = issue.project_id

    if WorkspaceMember.objects.filter(
        workspace_id=workspace_id,
        member_id=user.id,
        is_active=True,
        role=ROLE.ADMIN.value,
    ).exists():
        return True

    member = ProjectMember.objects.filter(
        workspace_id=workspace_id,
        project_id=project_id,
        member_id=user.id,
        is_active=True,
    ).first()
    if not member:
        return False

    if member.role <= ROLE.GUEST.value:
        return str(issue.created_by_id) == str(user.id)

    return True
