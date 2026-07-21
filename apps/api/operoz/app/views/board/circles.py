from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions import ROLE, allow_permission
from operoz.app.permissions.board_access import allow_workspace_or_board_admin
from operoz.app.serializers.board_circle import (
    BoardCircleMemberAddSerializer,
    BoardCircleMemberSerializer,
    BoardCircleSerializer,
    BoardCircleUpdateSerializer,
    BoardCircleWriteSerializer,
)
from operoz.app.views.base import BaseAPIView
from operoz.db.models import Board, BoardCircle, BoardCircleMember, BoardRole, WorkspaceMember
from operoz.utils.board_roles import assign_board_role


def _get_board(slug: str, board_slug: str) -> Board:
    return Board.objects.get(workspace__slug=slug, slug=board_slug, deleted_at__isnull=True)


class BoardCircleEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        circles = BoardCircle.objects.filter(board=board, deleted_at__isnull=True).select_related("role")
        return Response(BoardCircleSerializer(circles, many=True).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        serializer = BoardCircleWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        role = None
        role_id = data.get("role_id")
        if role_id:
            try:
                role = BoardRole.objects.get(board=board, id=role_id, deleted_at__isnull=True)
            except BoardRole.DoesNotExist:
                return Response({"error": "INVALID_ROLE"}, status=status.HTTP_400_BAD_REQUEST)

        circle = BoardCircle.objects.create(
            board=board,
            workspace_id=board.workspace_id,
            name=data["name"],
            description=data.get("description", ""),
            color=data.get("color", ""),
            role=role,
            created_by=request.user,
        )
        return Response(BoardCircleSerializer(circle).data, status=status.HTTP_201_CREATED)


class BoardCircleDetailEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def patch(self, request, slug, board_slug, pk):
        board = _get_board(slug, board_slug)
        circle = BoardCircle.objects.get(board=board, pk=pk, deleted_at__isnull=True)

        serializer = BoardCircleUpdateSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        if "role_id" in data:
            role_id = data["role_id"]
            if role_id:
                try:
                    circle.role = BoardRole.objects.get(board=board, id=role_id, deleted_at__isnull=True)
                except BoardRole.DoesNotExist:
                    return Response({"error": "INVALID_ROLE"}, status=status.HTTP_400_BAD_REQUEST)
            else:
                circle.role = None
        for field in ("name", "description", "color"):
            if field in data:
                setattr(circle, field, data[field])
        circle.updated_by = request.user
        circle.save()

        return Response(BoardCircleSerializer(circle).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def delete(self, request, slug, board_slug, pk):
        board = _get_board(slug, board_slug)
        circle = BoardCircle.objects.get(board=board, pk=pk, deleted_at__isnull=True)
        now = timezone.now()
        BoardCircleMember.objects.filter(circle=circle, deleted_at__isnull=True).update(deleted_at=now)
        circle.delete(soft=True)
        return Response(status=status.HTTP_204_NO_CONTENT)


class BoardCircleMemberEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, board_slug, circle_id):
        board = _get_board(slug, board_slug)
        circle = BoardCircle.objects.get(board=board, pk=circle_id, deleted_at__isnull=True)
        members = (
            BoardCircleMember.objects.filter(circle=circle, deleted_at__isnull=True)
            .select_related("user")
            .order_by("user__display_name")
        )
        return Response(BoardCircleMemberSerializer(members, many=True).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug, circle_id):
        board = _get_board(slug, board_slug)
        circle = BoardCircle.objects.get(board=board, pk=circle_id, deleted_at__isnull=True)

        serializer = BoardCircleMemberAddSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_ids = list(dict.fromkeys(serializer.validated_data["user_ids"]))
        valid_user_count = WorkspaceMember.objects.filter(
            workspace_id=board.workspace_id, member_id__in=user_ids, deleted_at__isnull=True
        ).count()
        if valid_user_count != len(user_ids):
            return Response({"error": "USER_NOT_IN_WORKSPACE"}, status=status.HTTP_400_BAD_REQUEST)

        for user_id in user_ids:
            existing = (
                BoardCircleMember.objects.filter(circle=circle, user_id=user_id).order_by("-created_at").first()
            )
            if existing and existing.deleted_at is None:
                continue
            if existing:
                existing.deleted_at = None
                existing.save(update_fields=["deleted_at", "updated_at"])
            else:
                BoardCircleMember.objects.create(
                    circle=circle,
                    board=board,
                    workspace_id=board.workspace_id,
                    user_id=user_id,
                    created_by=request.user,
                )
            if circle.role_id:
                assign_board_role(board, user_id, circle.role, created_by=request.user)

        members = (
            BoardCircleMember.objects.filter(circle=circle, deleted_at__isnull=True)
            .select_related("user")
            .order_by("user__display_name")
        )
        return Response(BoardCircleMemberSerializer(members, many=True).data, status=status.HTTP_201_CREATED)


class BoardCircleMemberDetailEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def delete(self, request, slug, board_slug, circle_id, user_id):
        board = _get_board(slug, board_slug)
        circle = BoardCircle.objects.get(board=board, pk=circle_id, deleted_at__isnull=True)
        BoardCircleMember.objects.filter(circle=circle, user_id=user_id, deleted_at__isnull=True).update(
            deleted_at=timezone.now()
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceCircleLookupEndpoint(BaseAPIView):
    """Resolve um círculo por ID, sem precisar saber a qual board ele pertence — usado para
    renderizar a menção (@círculo) num comentário/descrição já salvo."""

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, circle_id):
        circle = (
            BoardCircle.objects.filter(workspace__slug=slug, pk=circle_id, deleted_at__isnull=True)
            .select_related("board", "role")
            .first()
        )
        if not circle:
            return Response({"error": "CIRCLE_NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND)

        member_count = BoardCircleMember.objects.filter(circle=circle, deleted_at__isnull=True).count()
        return Response(
            {
                "id": circle.id,
                "name": circle.name,
                "color": circle.color,
                "member_count": member_count,
                "board_slug": circle.board.slug,
            },
            status=status.HTTP_200_OK,
        )
