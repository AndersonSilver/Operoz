from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions.board_access import allow_workspace_or_board_admin
from operoz.app.serializers.board_support_queue import (
    BoardSupportQueueSerializer,
    BoardSupportQueueWriteSerializer,
)
from operoz.app.views.base import BaseAPIView
from operoz.app.views.board.automation import _get_board
from operoz.db.models import BoardSupportQueue


class BoardSupportQueueListCreateEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        queues = BoardSupportQueue.objects.filter(board=board, deleted_at__isnull=True).order_by("sort_order", "name")
        return Response(BoardSupportQueueSerializer(queues, many=True).data)

    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        serializer = BoardSupportQueueWriteSerializer(data=request.data, context={"board": board})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        queue = serializer.save(board=board, workspace_id=board.workspace_id, created_by=request.user)
        return Response(BoardSupportQueueSerializer(queue).data, status=status.HTTP_201_CREATED)


class BoardSupportQueueDetailEndpoint(BaseAPIView):
    def _get_queue(self, slug, board_slug, queue_id):
        board = _get_board(slug, board_slug)
        return BoardSupportQueue.objects.get(pk=queue_id, board=board, deleted_at__isnull=True)

    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug, queue_id):
        queue = self._get_queue(slug, board_slug, queue_id)
        return Response(BoardSupportQueueSerializer(queue).data)

    @allow_workspace_or_board_admin
    def patch(self, request, slug, board_slug, queue_id):
        queue = self._get_queue(slug, board_slug, queue_id)
        serializer = BoardSupportQueueWriteSerializer(
            queue, data=request.data, partial=True, context={"board": queue.board}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        queue = serializer.save(updated_by=request.user)
        return Response(BoardSupportQueueSerializer(queue).data)

    @allow_workspace_or_board_admin
    def delete(self, request, slug, board_slug, queue_id):
        queue = self._get_queue(slug, board_slug, queue_id)
        if queue.is_default:
            return Response({"error": "Cannot delete the default queue."}, status=status.HTTP_400_BAD_REQUEST)
        queue.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
