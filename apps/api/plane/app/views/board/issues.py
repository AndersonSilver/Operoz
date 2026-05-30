# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.views.view.base import WorkspaceViewIssuesViewSet
from plane.db.models import Board


class BoardIssuesViewSet(WorkspaceViewIssuesViewSet):
    """
    Issues agregados de todos os projetos de um board (MVP-2).
    Reutiliza filtros, permissões e paginação de WorkspaceViewIssuesViewSet.
    """

    def _get_board(self):
        return Board.objects.filter(
            workspace__slug=self.kwargs.get("slug"),
            slug=self.kwargs.get("board_slug"),
            archived_at__isnull=True,
        ).first()

    def get_queryset(self):
        queryset = super().get_queryset()
        board_id = getattr(self, "_board_filter_id", None)
        if board_id:
            queryset = queryset.filter(project__board_id=board_id)
        return queryset

    @method_decorator(gzip_page)
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug, board_slug):
        board = self._get_board()
        if not board:
            return Response({"error": "Board not found"}, status=status.HTTP_404_NOT_FOUND)

        self._board_filter_id = board.id
        try:
            # slug must be passed as kwarg so parent @allow_permission sees kwargs["slug"]
            return super().list(request, slug=slug)
        finally:
            self._board_filter_id = None
