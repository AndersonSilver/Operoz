# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.permissions.board_access import allow_workspace_or_board_admin
from plane.app.serializers import (
    BoardProjectFieldLayoutAddCustomSerializer,
    BoardProjectFieldLayoutSerializer,
    BoardProjectFieldLayoutUpdateSerializer,
)
from plane.app.views.base import BaseAPIView
from plane.db.models import Board, BoardCustomField, BoardProjectFieldLayout, BoardProjectFieldSource
from plane.utils.board_project_field_layout import ensure_board_project_field_layout


class BoardProjectFieldLayoutEndpoint(BaseAPIView):
    def _get_board(self, slug: str, board_slug: str):
        return Board.objects.get(workspace__slug=slug, slug=board_slug, deleted_at__isnull=True)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, board_slug):
        board = self._get_board(slug, board_slug)
        ensure_board_project_field_layout(board, request.user)
        items = (
            BoardProjectFieldLayout.objects.filter(board=board, deleted_at__isnull=True)
            .select_related("custom_field")
            .order_by("sort_order", "standard_field_key", "custom_field__name")
        )
        return Response(
            BoardProjectFieldLayoutSerializer(items, many=True).data,
            status=status.HTTP_200_OK,
        )

    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug):
        board = self._get_board(slug, board_slug)
        serializer = BoardProjectFieldLayoutAddCustomSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        custom_field_id = data["custom_field_id"]

        on_board = BoardCustomField.objects.filter(
            board=board,
            custom_field_id=custom_field_id,
            is_enabled=True,
            deleted_at__isnull=True,
        ).exists()
        if not on_board:
            return Response({"error": "FIELD_NOT_ON_BOARD"}, status=status.HTTP_400_BAD_REQUEST)

        existing = (
            BoardProjectFieldLayout.objects.filter(
                board=board, field_source=BoardProjectFieldSource.CUSTOM, custom_field_id=custom_field_id
            )
            .order_by("-created_at")
            .first()
        )
        if existing and existing.deleted_at is None:
            return Response({"error": "FIELD_ALREADY_IN_LAYOUT"}, status=status.HTTP_400_BAD_REQUEST)

        max_order = (
            BoardProjectFieldLayout.objects.filter(board=board, deleted_at__isnull=True)
            .order_by("-sort_order")
            .values_list("sort_order", flat=True)
            .first()
        )
        sort_order = data.get("sort_order")
        if sort_order is None:
            sort_order = (max_order or 0) + 1000

        if existing:
            existing.deleted_at = None
            existing.is_enabled = True
            existing.section = data["section"]
            existing.sort_order = sort_order
            existing.is_required = data.get("is_required", False)
            existing.form_span = data.get("form_span", "half")
            existing.save(
                update_fields=[
                    "deleted_at",
                    "is_enabled",
                    "section",
                    "sort_order",
                    "is_required",
                    "form_span",
                    "updated_at",
                ]
            )
            layout = existing
        else:
            layout = BoardProjectFieldLayout.objects.create(
                board=board,
                workspace_id=board.workspace_id,
                field_source=BoardProjectFieldSource.CUSTOM,
                custom_field_id=custom_field_id,
                section=data["section"],
                sort_order=sort_order,
                is_required=data.get("is_required", False),
                form_span=data.get("form_span", "half"),
                is_enabled=True,
                created_by=request.user,
            )

        layout = BoardProjectFieldLayout.objects.select_related("custom_field").get(pk=layout.pk)
        return Response(
            BoardProjectFieldLayoutSerializer(layout).data,
            status=status.HTTP_201_CREATED,
        )


class BoardProjectFieldLayoutDetailEndpoint(BaseAPIView):
    def _get_board(self, slug: str, board_slug: str):
        return Board.objects.get(workspace__slug=slug, slug=board_slug, deleted_at__isnull=True)

    @allow_workspace_or_board_admin
    def patch(self, request, slug, board_slug, pk):
        board = self._get_board(slug, board_slug)
        layout = BoardProjectFieldLayout.objects.filter(board=board, deleted_at__isnull=True, pk=pk).first()
        if not layout:
            return Response({"error": "NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND)

        serializer = BoardProjectFieldLayoutUpdateSerializer(layout, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            layout = BoardProjectFieldLayout.objects.select_related("custom_field").get(pk=layout.pk)
            return Response(BoardProjectFieldLayoutSerializer(layout).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_workspace_or_board_admin
    def delete(self, request, slug, board_slug, pk):
        board = self._get_board(slug, board_slug)
        layout = BoardProjectFieldLayout.objects.filter(board=board, deleted_at__isnull=True, pk=pk).first()
        if not layout:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if layout.field_source == BoardProjectFieldSource.SYSTEM:
            layout.is_enabled = False
            layout.save(update_fields=["is_enabled", "updated_at"])
        else:
            layout.is_enabled = False
            layout.delete(soft=True)
        return Response(status=status.HTTP_204_NO_CONTENT)
