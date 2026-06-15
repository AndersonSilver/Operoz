from rest_framework import status
from rest_framework.response import Response

from operis.app.permissions.board_access import allow_workspace_or_board_admin
from operis.app.serializers.board_automation_hooks import BoardAutomationHookSerializer
from operis.app.views.base import BaseAPIView
from operis.app.views.board.automation import _get_board
from operis.db.models import BoardAutomationHook


class BoardAutomationHookListEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        hooks = BoardAutomationHook.objects.filter(board=board, deleted_at__isnull=True).order_by(
            "sort_order", "-created_at"
        )
        return Response(BoardAutomationHookSerializer(hooks, many=True).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        serializer = BoardAutomationHookSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        hook = serializer.save(board=board, workspace=board.workspace)
        return Response(BoardAutomationHookSerializer(hook).data, status=status.HTTP_201_CREATED)


class BoardAutomationHookDetailEndpoint(BaseAPIView):
    def _get_hook(self, slug, board_slug, hook_id):
        board = _get_board(slug, board_slug)
        return BoardAutomationHook.objects.get(pk=hook_id, board=board, deleted_at__isnull=True)

    @allow_workspace_or_board_admin
    def patch(self, request, slug, board_slug, hook_id):
        hook = self._get_hook(slug, board_slug, hook_id)
        serializer = BoardAutomationHookSerializer(hook, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        hook = serializer.save()
        return Response(BoardAutomationHookSerializer(hook).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def delete(self, request, slug, board_slug, hook_id):
        hook = self._get_hook(slug, board_slug, hook_id)
        hook.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
