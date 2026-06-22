"""Permissões do módulo de sustentação (chamados de intake)."""

from __future__ import annotations

from typing import TYPE_CHECKING

from operis.app.permissions.base import ROLE
from operis.db.models import WorkspaceMember
from operis.utils.board_permission_enforcement import (
    get_effective_board_permission_keys,
    permission_granted,
)
from operis.utils.board_roles import user_can_administer_board

if TYPE_CHECKING:
    from operis.db.models import Project, User

SUPPORT_TICKET_DELETE_ERROR = "Only board admin can delete the support ticket"


def user_is_workspace_admin(user: User, workspace_slug: str) -> bool:
    return WorkspaceMember.objects.filter(
        member=user,
        workspace__slug=workspace_slug,
        role=ROLE.ADMIN.value,
        is_active=True,
    ).exists()


def user_can_delete_support_ticket(user: User, project: Project, *, workspace_slug: str) -> bool:
    """
    Apagar chamado de sustentação permanentemente.

    Permitido apenas para admin do workspace ou função com board.administer.
    Admin de projeto e criador do chamado não podem apagar.
    """
    if user_is_workspace_admin(user, workspace_slug):
        return True

    board_id = getattr(project, "board_id", None)
    if not board_id:
        return False

    keys = get_effective_board_permission_keys(board_id, user.id)
    if keys is not None:
        return permission_granted(keys, "board.administer")

    return user_can_administer_board(board_id, user.id)
