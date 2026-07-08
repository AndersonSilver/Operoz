"""Enforcement 5.4b-v1: permissões de board em cards (issues) de projetos ligados a um board."""

from __future__ import annotations

from typing import TYPE_CHECKING

from rest_framework import status
from rest_framework.response import Response

from operoz.db.models import BoardMemberRole, Project
from operoz.utils.board_roles import get_user_board_permission_keys

if TYPE_CHECKING:
    from operoz.db.models import User


def permission_granted(keys: set[str], permission_key: str) -> bool:
    if "board.administer" in keys:
        return True
    return permission_key in keys


def user_has_explicit_board_roles(board_id, user_id) -> bool:
    if not board_id or not user_id:
        return False
    return BoardMemberRole.objects.filter(board_id=board_id, user_id=user_id, deleted_at__isnull=True).exists()


def get_effective_board_permission_keys(board_id, user_id) -> set[str] | None:
    """
    None = utilizador sem funções explícitas no board → manter permissões de projeto/workspace.
    """
    if not board_id or not user_id:
        return None
    if not user_has_explicit_board_roles(board_id, user_id):
        return None
    return get_user_board_permission_keys(board_id, user_id)


def board_permission_denied_response(
    user: User,
    project: Project,
    permission_key: str,
) -> Response | None:
    if not project.board_id:
        return None

    keys = get_effective_board_permission_keys(project.board_id, user.id)
    if keys is None:
        return None

    if permission_granted(keys, permission_key):
        return None

    return Response(
        {
            "error": "BOARD_PERMISSION_DENIED",
            "permission": permission_key,
        },
        status=status.HTTP_403_FORBIDDEN,
    )


def deny_board_permission(user: User, project: Project, permission_key: str) -> Response | None:
    return board_permission_denied_response(user, project, permission_key)


def deny_for_issue_patch(user: User, project: Project, data: dict) -> Response | None:
    if denied := deny_board_permission(user, project, "items.edit"):
        return denied
    if "state_id" in data:
        if denied := deny_board_permission(user, project, "items.transition"):
            return denied
    assignee_keys = {"assignee_ids", "assignees", "assignee_id"}
    if assignee_keys.intersection(data.keys()):
        if denied := deny_board_permission(user, project, "items.assign"):
            return denied
    return None


def deny_for_comment_mutation(user: User, project: Project, *, actor_id, is_delete: bool) -> Response | None:
    if str(actor_id) == str(user.id):
        key = "items.comments.delete_own" if is_delete else "items.comments.edit_own"
    else:
        key = "items.comments.delete_any" if is_delete else "items.comments.edit_any"
    return deny_board_permission(user, project, key)


def deny_for_attachment_delete(user: User, project: Project, *, asset_created_by_id) -> Response | None:
    if str(asset_created_by_id) == str(user.id):
        return deny_board_permission(user, project, "items.attachments.delete_own")
    return deny_board_permission(user, project, "items.attachments.delete_any")


def get_project_for_enforcement(project_id, workspace_slug: str | None = None) -> Project:
    qs = Project.objects.select_related("board")
    if workspace_slug:
        qs = qs.filter(workspace__slug=workspace_slug)
    return qs.get(pk=project_id)
