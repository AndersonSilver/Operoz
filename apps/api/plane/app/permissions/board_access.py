# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Permissões de settings do board: admin do workspace OU board.administer."""

from functools import wraps

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions.base import ROLE
from plane.db.models import Board, WorkspaceMember
from plane.utils.board_permission_enforcement import (
    get_effective_board_permission_keys,
    permission_granted,
)


def _workspace_admin(request, slug: str) -> bool:
    return WorkspaceMember.objects.filter(
        member=request.user,
        workspace__slug=slug,
        role=ROLE.ADMIN.value,
        is_active=True,
    ).exists()


def _board_administer(request, slug: str, board_slug: str) -> bool:
    try:
        board = Board.objects.get(workspace__slug=slug, slug=board_slug, deleted_at__isnull=True)
    except Board.DoesNotExist:
        return False
    keys = get_effective_board_permission_keys(board.id, request.user.id)
    if keys is None:
        return False
    return permission_granted(keys, "board.administer")


def allow_workspace_or_board_admin(view_func):
    """
    Mutações de settings do board: admin do workspace ou função com board.administer.
    Utilizadores sem funções explícitas no board continuam dependentes só do admin WS.
    """

    @wraps(view_func)
    def _wrapped(instance, request, *args, **kwargs):
        slug = kwargs.get("slug")
        board_slug = kwargs.get("board_slug")
        if not slug or not board_slug:
            return Response(
                {"error": "You don't have the required permissions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if _workspace_admin(request, slug) or _board_administer(request, slug, board_slug):
            return view_func(instance, request, *args, **kwargs)

        try:
            board = Board.objects.get(workspace__slug=slug, slug=board_slug, deleted_at__isnull=True)
            if get_effective_board_permission_keys(board.id, request.user.id) is not None:
                return Response(
                    {
                        "error": "BOARD_PERMISSION_DENIED",
                        "permission": "board.administer",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
        except Board.DoesNotExist:
            pass

        return Response(
            {"error": "You don't have the required permissions."},
            status=status.HTTP_403_FORBIDDEN,
        )

    return _wrapped
