from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions import ROLE, allow_permission
from operoz.app.permissions.board_access import allow_workspace_or_board_admin
from operoz.app.serializers.board_module_stage import (
    BoardModuleStageCreateSerializer,
    BoardModuleStageSerializer,
)
from operoz.app.views.base import BaseAPIView
from operoz.db.models import Board, BoardModuleStage
from operoz.utils.board_module_stages import seed_board_module_stages


class BoardModuleStageEndpoint(BaseAPIView):
    def _get_board(self, slug: str, board_slug: str):
        return Board.objects.get(workspace__slug=slug, slug=board_slug, deleted_at__isnull=True)

    def _queryset(self, board):
        return BoardModuleStage.objects.filter(board=board, deleted_at__isnull=True).order_by(
            "sort_order", "created_at"
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, board_slug):
        board = self._get_board(slug, board_slug)
        seed_board_module_stages(board, request.user)
        items = self._queryset(board)
        return Response(BoardModuleStageSerializer(items, many=True).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug):
        board = self._get_board(slug, board_slug)
        serializer = BoardModuleStageCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        max_order = (
            BoardModuleStage.objects.filter(board=board, deleted_at__isnull=True)
            .order_by("-sort_order")
            .values_list("sort_order", flat=True)
            .first()
        )
        sort_order = data.get("sort_order")
        if sort_order is None:
            sort_order = (max_order or 0) + 1000

        if data.get("is_default"):
            BoardModuleStage.objects.filter(board=board, deleted_at__isnull=True, is_default=True).update(
                is_default=False
            )

        stage = BoardModuleStage.objects.create(
            board=board,
            workspace_id=board.workspace_id,
            name=data["name"],
            color=data.get("color", "#00b8a9"),
            sort_order=sort_order,
            is_default=data.get("is_default", False),
            is_active=data.get("is_active", True),
        )
        return Response(
            BoardModuleStageSerializer(stage, context={"board_id": board.id}).data,
            status=status.HTTP_201_CREATED,
        )


class BoardModuleStageDetailEndpoint(BaseAPIView):
    def _get_board(self, slug: str, board_slug: str):
        return Board.objects.get(workspace__slug=slug, slug=board_slug, deleted_at__isnull=True)

    def _queryset(self, board):
        return BoardModuleStage.objects.filter(board=board, deleted_at__isnull=True).order_by(
            "sort_order", "created_at"
        )

    @allow_workspace_or_board_admin
    def patch(self, request, slug, board_slug, pk):
        board = self._get_board(slug, board_slug)
        stage = self._queryset(board).get(pk=pk)
        serializer = BoardModuleStageSerializer(
            stage,
            data=request.data,
            partial=True,
            context={"board_id": board.id},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if serializer.validated_data.get("is_default"):
            BoardModuleStage.objects.filter(board=board, deleted_at__isnull=True, is_default=True).exclude(
                pk=stage.pk
            ).update(is_default=False)

        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def delete(self, request, slug, board_slug, pk):
        board = self._get_board(slug, board_slug)
        stage = self._queryset(board).get(pk=pk)
        stage.is_active = False
        stage.save(update_fields=["is_active", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)
