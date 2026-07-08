from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from operoz.db.models import User

from operoz.alerts.types import AlertSubject


def resolve_recipients(subject: AlertSubject, config: dict) -> list[User]:
    """Pure resolver: assignees and/or creator based on rule config."""
    issue = subject.issue
    notify_assignees = bool(config.get("notify_assignees", True))
    notify_creator = bool(config.get("notify_creator", False))
    notify_support_team = bool(config.get("notify_support_team", False))

    recipients: list[User] = []
    seen: set[str] = set()

    def _add(user: User | None) -> None:
        if user is None:
            return
        if getattr(user, "is_bot", False):
            return
        user_id = str(user.id)
        if user_id in seen:
            return
        seen.add(user_id)
        recipients.append(user)

    if notify_assignees:
        for assignee in issue.assignees.all():
            _add(assignee)

    if notify_creator and issue.created_by_id:
        _add(issue.created_by)

    if bool(config.get("notify_project_lead", False)) and issue.project_id:
        from operoz.db.models import Project

        project = Project.objects.filter(pk=issue.project_id).select_related("project_lead").first()
        if project and project.project_lead:
            _add(project.project_lead)

    if notify_support_team and subject.intake_issue is not None:
        from operoz.db.models import ProjectMember, WorkspaceMember
        from operoz.app.permissions import ROLE

        workspace_id = issue.workspace_id
        project_id = issue.project_id
        member_ids = ProjectMember.objects.filter(
            project_id=project_id,
            workspace_id=workspace_id,
            is_active=True,
            role__gte=ROLE.MEMBER.value,
        ).values_list("member_id", flat=True)
        admin_ids = WorkspaceMember.objects.filter(
            workspace_id=workspace_id,
            is_active=True,
            role=ROLE.ADMIN.value,
        ).values_list("member_id", flat=True)
        from operoz.db.models import User

        for user in User.objects.filter(id__in=set(member_ids) | set(admin_ids)):
            _add(user)

    return recipients


def resolve_support_recipients(subject: AlertSubject, config: dict) -> list[User]:
    """Support tickets: creator, assignees, and optional project lead by default."""
    merged = {
        "notify_assignees": True,
        "notify_creator": True,
        "notify_support_team": False,
        "notify_project_lead": True,
        **config,
    }
    return resolve_recipients(subject, merged)
