from __future__ import annotations

from django.db.models import Q

from operoz.app.permissions import ROLE
from operoz.assistant.types import AssistantActorContext
from operoz.db.models import Board, Issue, Page, Project, ProjectMember, WorkspaceMember


def project_permission_filter(user) -> Q:
    """Mesmo critério de BoardMetaViewSet / Cliente 360."""
    return Q(
        Q(
            project__project_projectmember__role=ROLE.GUEST.value,
            project__guest_view_all_features=True,
        )
        | Q(
            project__project_projectmember__role=ROLE.GUEST.value,
            project__guest_view_all_features=False,
            created_by=user,
        )
        | Q(project__project_projectmember__role__gt=ROLE.GUEST.value),
        project__project_projectmember__member=user,
        project__project_projectmember__is_active=True,
    )


def require_workspace_member(ctx: AssistantActorContext) -> bool:
    return WorkspaceMember.objects.filter(
        workspace=ctx.workspace,
        member=ctx.user,
        is_active=True,
    ).exists()


def require_workspace_role_at_least(ctx: AssistantActorContext, min_role: int) -> bool:
    member = WorkspaceMember.objects.filter(
        workspace=ctx.workspace,
        member=ctx.user,
        is_active=True,
    ).first()
    return bool(member and member.role >= min_role)


def is_project_member(ctx: AssistantActorContext, project_id: str) -> bool:
    return ProjectMember.objects.filter(
        project_id=project_id,
        member=ctx.user,
        is_active=True,
        project__workspace_id=ctx.workspace.id,
    ).exists()


def get_accessible_issue(ctx: AssistantActorContext, issue_id: str) -> Issue | None:
    return (
        Issue.issue_objects.filter(
            pk=issue_id,
            workspace_id=ctx.workspace.id,
        )
        .filter(project_permission_filter(ctx.user))
        .select_related("state", "project", "type")
        .first()
    )


def filter_accessible_issues(ctx: AssistantActorContext, project_id: str | None = None):
    qs = Issue.issue_objects.filter(workspace_id=ctx.workspace.id).filter(project_permission_filter(ctx.user))
    if project_id:
        if not is_project_member(ctx, project_id):
            return Issue.issue_objects.none()
        qs = qs.filter(project_id=project_id)
    if ctx.board_slug:
        board = Board.objects.filter(workspace=ctx.workspace, slug=ctx.board_slug, deleted_at__isnull=True).first()
        if board:
            qs = qs.filter(project__board_id=board.id)
    return qs.distinct()


def get_board(ctx: AssistantActorContext, board_slug: str) -> Board | None:
    return Board.objects.filter(
        workspace=ctx.workspace,
        slug=board_slug,
        archived_at__isnull=True,
        deleted_at__isnull=True,
    ).first()


def accessible_projects(ctx: AssistantActorContext, board_slug: str | None = None):
    qs = Project.objects.filter(
        workspace=ctx.workspace,
        archived_at__isnull=True,
        project_projectmember__member=ctx.user,
        project_projectmember__is_active=True,
    ).distinct()
    slug = board_slug or ctx.board_slug
    if slug:
        board = get_board(ctx, slug)
        if not board:
            return Project.objects.none()
        qs = qs.filter(board_id=board.id)
    return qs


def can_access_page(ctx: AssistantActorContext, page: Page, project_id: str) -> bool:
    if page.workspace_id != ctx.workspace.id:
        return False
    if page.owned_by_id == ctx.user.id:
        return True
    if not is_project_member(ctx, project_id):
        return False
    if page.access == Page.PRIVATE_ACCESS and page.owned_by_id != ctx.user.id:
        member = ProjectMember.objects.filter(
            project_id=project_id,
            member=ctx.user,
            is_active=True,
        ).first()
        if not member or member.role < ROLE.MEMBER.value:
            return False
    return True


def can_access_board(ctx: AssistantActorContext, board_slug: str) -> bool:
    if not require_workspace_member(ctx):
        return False
    board = get_board(ctx, board_slug)
    if not board:
        return False
    if require_workspace_role_at_least(ctx, ROLE.ADMIN.value):
        return True
    return accessible_projects(ctx, board_slug).exists()


def truncate_text(value: str | None, limit: int = 4000) -> str:
    if not value:
        return ""
    text = str(value)
    if len(text) <= limit:
        return text
    return text[: limit - 3] + "..."
