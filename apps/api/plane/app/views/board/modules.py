# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers.board import BoardModuleListSerializer
from plane.app.views.base import BaseViewSet
from plane.db.models import Board, Module, Project


class BoardModulesViewSet(BaseViewSet):
    """Lista módulos de todos os projetos de um board (cronograma multi-projeto)."""

    use_read_replica = True

    def _get_board(self, slug: str, board_slug: str):
        return (
            Board.objects.filter(
                workspace__slug=slug,
                slug=board_slug,
                archived_at__isnull=True,
                deleted_at__isnull=True,
            )
            .first()
        )

    def _accessible_project_ids(self, slug: str, board_id: str):
        return (
            Project.objects.filter(
                workspace__slug=slug,
                board_id=board_id,
                archived_at__isnull=True,
                project_projectmember__member=self.request.user,
                project_projectmember__is_active=True,
            )
            .distinct()
            .values_list("id", flat=True)
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug, board_slug):
        board = self._get_board(slug, board_slug)
        if not board:
            return Response({"error": "Board not found"}, status=status.HTTP_404_NOT_FOUND)

        project_ids = list(self._accessible_project_ids(slug, board.id))
        if not project_ids:
            return Response([], status=status.HTTP_200_OK)

        project_id_param = request.query_params.get("project_id")
        if project_id_param:
            filter_ids = {pid.strip() for pid in project_id_param.split(",") if pid.strip()}
            project_ids = [pid for pid in project_ids if str(pid) in filter_ids]

        modules = (
            Module.objects.filter(
                project_id__in=project_ids,
                archived_at__isnull=True,
            )
            .select_related("project")
            .order_by("project_id", "sort_order", "-created_at")
        )

        serializer = BoardModuleListSerializer(modules, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
