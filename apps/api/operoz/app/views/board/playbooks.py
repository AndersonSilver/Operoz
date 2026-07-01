from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions.board_access import allow_workspace_or_board_admin
from operoz.app.serializers.board_playbook import BoardPlaybookSerializer
from operoz.app.views.base import BaseAPIView
from operoz.app.views.board.automation import _get_board
from operoz.db.models import BoardPlaybook
from operoz.playbooks.lifecycle import publish_playbook


class BoardPlaybookListEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        playbooks = BoardPlaybook.objects.filter(board=board, deleted_at__isnull=True).order_by(
            "sort_order", "-created_at"
        )
        return Response(BoardPlaybookSerializer(playbooks, many=True).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        serializer = BoardPlaybookSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        playbook = serializer.save(board=board)
        return Response(BoardPlaybookSerializer(playbook).data, status=status.HTTP_201_CREATED)


class BoardPlaybookDetailEndpoint(BaseAPIView):
    def _get_playbook(self, slug, board_slug, playbook_id):
        board = _get_board(slug, board_slug)
        return BoardPlaybook.objects.get(pk=playbook_id, board=board, deleted_at__isnull=True)

    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug, playbook_id):
        playbook = self._get_playbook(slug, board_slug, playbook_id)
        return Response(BoardPlaybookSerializer(playbook).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def patch(self, request, slug, board_slug, playbook_id):
        playbook = self._get_playbook(slug, board_slug, playbook_id)
        serializer = BoardPlaybookSerializer(playbook, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        playbook = serializer.save(updated_by=request.user)
        return Response(BoardPlaybookSerializer(playbook).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def delete(self, request, slug, board_slug, playbook_id):
        playbook = self._get_playbook(slug, board_slug, playbook_id)
        playbook.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BoardPlaybookPublishEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug, playbook_id):
        playbook = BoardPlaybookDetailEndpoint()._get_playbook(slug, board_slug, playbook_id)
        publish_playbook(playbook)
        return Response(BoardPlaybookSerializer(playbook).data, status=status.HTTP_200_OK)
