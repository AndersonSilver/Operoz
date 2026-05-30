from collections import defaultdict

from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from operis.app.permissions import ROLE, allow_permission
from operis.app.permissions.board_access import allow_workspace_or_board_admin
from operis.app.serializers.board_role import (
    BoardMemberAssignSerializer,
    BoardMemberRolesUpdateSerializer,
    BoardMemberSerializer,
)
from operis.app.views.base import BaseAPIView
from operis.db.models import Board, BoardMemberRole, BoardRole, User, WorkspaceMember
from operis.utils.board_roles import seed_board_roles


class _BoardMemberRow:
    def __init__(self, user, assignments):
        self.user = user
        self.user_id = user.id
        self.assignments = assignments
        self.email = user.email


class BoardMemberEndpoint(BaseAPIView):
    def _get_board(self, slug: str, board_slug: str):
        return Board.objects.get(workspace__slug=slug, slug=board_slug, deleted_at__isnull=True)

    def _member_rows(self, board):
        assignments = (
            BoardMemberRole.objects.filter(board=board, deleted_at__isnull=True)
            .select_related("role", "user")
            .order_by("user__display_name")
        )
        by_user: dict = defaultdict(list)
        for row in assignments:
            by_user[row.user_id].append(row)
        if not by_user:
            return []
        users = User.objects.filter(id__in=by_user.keys())
        return [_BoardMemberRow(u, by_user[u.id]) for u in users]

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, board_slug):
        board = self._get_board(slug, board_slug)
        seed_board_roles(board, request.user)
        rows = self._member_rows(board)
        return Response(BoardMemberSerializer(rows, many=True).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug):
        board = self._get_board(slug, board_slug)
        seed_board_roles(board, request.user)
        serializer = BoardMemberAssignSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        user_id = data["user_id"]
        role_ids = data["role_ids"]

        if not WorkspaceMember.objects.filter(
            workspace_id=board.workspace_id, member_id=user_id, deleted_at__isnull=True
        ).exists():
            return Response({"error": "USER_NOT_IN_WORKSPACE"}, status=status.HTTP_400_BAD_REQUEST)

        valid_roles = list(BoardRole.objects.filter(board=board, id__in=role_ids, deleted_at__isnull=True))
        if len(valid_roles) != len(role_ids):
            return Response({"error": "INVALID_ROLE"}, status=status.HTTP_400_BAD_REQUEST)

        for role in valid_roles:
            existing = (
                BoardMemberRole.objects.filter(board=board, user_id=user_id, role=role)
                .order_by("-created_at")
                .first()
            )
            if existing and existing.deleted_at is None:
                continue
            if existing:
                existing.deleted_at = None
                existing.save(update_fields=["deleted_at", "updated_at"])
            else:
                BoardMemberRole.objects.create(
                    board=board,
                    workspace_id=board.workspace_id,
                    user_id=user_id,
                    role=role,
                    created_by=request.user,
                )

        rows = self._member_rows(board)
        match = next((r for r in rows if str(r.user_id) == str(user_id)), None)
        if match:
            return Response(BoardMemberSerializer(match).data, status=status.HTTP_201_CREATED)
        return Response(status=status.HTTP_201_CREATED)


class BoardMemberDetailEndpoint(BaseAPIView):
    def _get_board(self, slug: str, board_slug: str):
        return Board.objects.get(workspace__slug=slug, slug=board_slug, deleted_at__isnull=True)

    @allow_workspace_or_board_admin
    def patch(self, request, slug, board_slug, user_id):
        board = self._get_board(slug, board_slug)
        serializer = BoardMemberRolesUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        role_ids = serializer.validated_data["role_ids"]
        valid_roles = list(BoardRole.objects.filter(board=board, id__in=role_ids, deleted_at__isnull=True))
        if len(valid_roles) != len(role_ids):
            return Response({"error": "INVALID_ROLE"}, status=status.HTTP_400_BAD_REQUEST)

        now = timezone.now()
        BoardMemberRole.objects.filter(board=board, user_id=user_id, deleted_at__isnull=True).update(
            deleted_at=now
        )
        for role in valid_roles:
            BoardMemberRole.objects.create(
                board=board,
                workspace_id=board.workspace_id,
                user_id=user_id,
                role=role,
                created_by=request.user,
            )

        endpoint = BoardMemberEndpoint()
        rows = endpoint._member_rows(board)
        match = next((r for r in rows if str(r.user_id) == str(user_id)), None)
        if match:
            return Response(BoardMemberSerializer(match).data, status=status.HTTP_200_OK)
        return Response(status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def delete(self, request, slug, board_slug, user_id):
        board = self._get_board(slug, board_slug)
        for row in BoardMemberRole.objects.filter(board=board, user_id=user_id, deleted_at__isnull=True):
            row.delete(soft=True)
        return Response(status=status.HTTP_204_NO_CONTENT)
