from rest_framework import status
from rest_framework.response import Response

from operis.app.permissions import ROLE, allow_permission
from operis.app.permissions.board_access import allow_workspace_or_board_admin
from operis.app.serializers import BoardIssueTypeCreateSerializer, BoardIssueTypeSerializer
from operis.app.views.base import BaseAPIView
from operis.db.models import Board, BoardIssueType, IssueType
from operis.utils.board_issue_types import (
    ensure_default_issue_type_icons,
    seed_board_issue_types,
    sync_board_issue_types_to_all_board_projects,
)


class BoardIssueTypeEndpoint(BaseAPIView):
    def _get_board(self, slug: str, board_slug: str):
        return Board.objects.get(workspace__slug=slug, slug=board_slug, deleted_at__isnull=True)

    def _queryset(self, board):
        return (
            BoardIssueType.objects.filter(board=board, deleted_at__isnull=True)
            .select_related("issue_type")
            .order_by("sort_order", "issue_type__name")
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, board_slug):
        board = self._get_board(slug, board_slug)
        seed_board_issue_types(board, request.user)
        ensure_default_issue_type_icons(board)
        items = self._queryset(board)
        return Response(BoardIssueTypeSerializer(items, many=True).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug):
        board = self._get_board(slug, board_slug)
        serializer = BoardIssueTypeCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        workspace_id = board.workspace_id

        if IssueType.objects.filter(workspace_id=workspace_id, name=data["name"], deleted_at__isnull=True).exists():
            return Response({"name": "ISSUE_TYPE_NAME_ALREADY_EXISTS"}, status=status.HTTP_400_BAD_REQUEST)

        max_order = (
            BoardIssueType.objects.filter(board=board, deleted_at__isnull=True)
            .order_by("-sort_order")
            .values_list("sort_order", flat=True)
            .first()
        )
        sort_order = data.get("sort_order")
        if sort_order is None:
            sort_order = (max_order or 0) + 1000

        issue_type = IssueType.objects.create(
            workspace_id=workspace_id,
            name=data["name"],
            description=data.get("description", ""),
            logo_props=data.get("logo_props") or {},
            is_active=True,
            is_epic=False,
        )
        board_issue_type = BoardIssueType.objects.create(
            board=board,
            workspace_id=workspace_id,
            issue_type=issue_type,
            sort_order=sort_order,
            is_enabled=data.get("is_enabled", True),
        )
        sync_board_issue_types_to_all_board_projects(board, request.user)
        return Response(
            BoardIssueTypeSerializer(board_issue_type, context={"workspace_id": workspace_id}).data,
            status=status.HTTP_201_CREATED,
        )


class BoardIssueTypeDetailEndpoint(BaseAPIView):
    def _get_board(self, slug: str, board_slug: str):
        return Board.objects.get(workspace__slug=slug, slug=board_slug, deleted_at__isnull=True)

    def _queryset(self, board):
        return (
            BoardIssueType.objects.filter(board=board, deleted_at__isnull=True)
            .select_related("issue_type")
            .order_by("sort_order", "issue_type__name")
        )

    @allow_workspace_or_board_admin
    def patch(self, request, slug, board_slug, pk):
        board = self._get_board(slug, board_slug)
        board_issue_type = self._queryset(board).get(pk=pk)
        serializer = BoardIssueTypeSerializer(
            board_issue_type,
            data=request.data,
            partial=True,
            context={"workspace_id": board.workspace_id},
        )
        if serializer.is_valid():
            serializer.save()
            if board_issue_type.is_enabled:
                sync_board_issue_types_to_all_board_projects(board, request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_workspace_or_board_admin
    def delete(self, request, slug, board_slug, pk):
        board = self._get_board(slug, board_slug)
        board_issue_type = self._queryset(board).get(pk=pk)
        board_issue_type.is_enabled = False
        board_issue_type.save(update_fields=["is_enabled", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)
