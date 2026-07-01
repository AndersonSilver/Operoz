from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions.board_access import allow_workspace_or_board_admin
from operoz.app.serializers.board_automation_secrets import BoardAutomationSecretSerializer
from operoz.app.views.base import BaseAPIView
from operoz.app.views.board.automation import _get_board
from operoz.db.models import BoardAutomationSecret


class BoardAutomationSecretListEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        secrets = BoardAutomationSecret.objects.filter(workspace=board.workspace, deleted_at__isnull=True).order_by(
            "key"
        )
        return Response(BoardAutomationSecretSerializer(secrets, many=True).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def post(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        serializer = BoardAutomationSecretSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        if not request.data.get("value"):
            return Response({"value": ["Obrigatório na criação."]}, status=status.HTTP_400_BAD_REQUEST)
        secret = serializer.save(workspace=board.workspace)
        return Response(BoardAutomationSecretSerializer(secret).data, status=status.HTTP_201_CREATED)


class BoardAutomationSecretDetailEndpoint(BaseAPIView):
    def _get_secret(self, slug, board_slug, secret_id):
        board = _get_board(slug, board_slug)
        return BoardAutomationSecret.objects.get(
            pk=secret_id,
            workspace=board.workspace,
            deleted_at__isnull=True,
        )

    @allow_workspace_or_board_admin
    def patch(self, request, slug, board_slug, secret_id):
        secret = self._get_secret(slug, board_slug, secret_id)
        serializer = BoardAutomationSecretSerializer(secret, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        secret = serializer.save()
        return Response(BoardAutomationSecretSerializer(secret).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def delete(self, request, slug, board_slug, secret_id):
        secret = self._get_secret(slug, board_slug, secret_id)
        secret.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
