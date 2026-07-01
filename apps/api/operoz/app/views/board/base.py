from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions import ROLE, allow_permission
from operoz.app.permissions.board_access import allow_workspace_or_board_admin
from operoz.app.serializers import BoardSerializer
from operoz.app.views.base import BaseViewSet
from operoz.db.models import Board, Workspace
from operoz.utils.board_issue_types import seed_board_issue_types


class BoardViewSet(BaseViewSet):
    serializer_class = BoardSerializer
    model = Board
    use_read_replica = True

    def get_queryset(self):
        queryset = (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace", "board_lead", "default_assignee")
            .order_by("sort_order", "-created_at")
        )
        if self.request.query_params.get("include_archived", "").lower() not in ("true", "1"):
            queryset = queryset.filter(archived_at__isnull=True)
        return self.filter_queryset(queryset)

    def get_board(self, include_archived: bool = False):
        queryset = Board.objects.filter(workspace__slug=self.kwargs.get("slug")).select_related(
            "board_lead", "default_assignee"
        )
        if not include_archived:
            queryset = queryset.filter(archived_at__isnull=True)
        return queryset.get(slug=self.kwargs.get("board_slug"))

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug):
        boards = self.get_queryset()
        return self.paginate(
            request=request,
            queryset=boards,
            on_results=lambda items: BoardSerializer(items, many=True).data,
            default_per_page=50,
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = BoardSerializer(data=request.data, context={"workspace_slug": slug})
        if serializer.is_valid():
            board = serializer.save(workspace=workspace)
            seed_board_issue_types(board, request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def retrieve(self, request, slug, board_slug):
        board = self.get_board()
        return Response(
            BoardSerializer(board, context={"workspace_slug": slug}).data,
            status=status.HTTP_200_OK,
        )

    @allow_workspace_or_board_admin
    def partial_update(self, request, slug, board_slug):
        board = self.get_board()
        serializer = BoardSerializer(board, data=request.data, partial=True, context={"workspace_slug": slug})
        if serializer.is_valid():
            board = serializer.save()
            board = self.get_queryset().filter(pk=board.pk).first()
            return Response(
                BoardSerializer(board, context={"workspace_slug": slug}).data,
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_workspace_or_board_admin
    def destroy(self, request, slug, board_slug):
        board = self.get_board()
        board.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_workspace_or_board_admin
    def archive(self, request, slug, board_slug):
        board = self.get_board()
        board.archived_at = timezone.now()
        board.save(update_fields=["archived_at", "updated_at"])
        return Response(BoardSerializer(board).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def unarchive(self, request, slug, board_slug):
        board = self.get_board(include_archived=True)
        board.archived_at = None
        board.save(update_fields=["archived_at", "updated_at"])
        return Response(BoardSerializer(board).data, status=status.HTTP_200_OK)
