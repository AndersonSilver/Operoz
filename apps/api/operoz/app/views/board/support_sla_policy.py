from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions.board_access import allow_workspace_or_board_admin
from operoz.app.serializers.board_support_sla_policy import (
    BoardSupportSlaPolicySerializer,
    BoardSupportSlaPolicyWriteSerializer,
)
from operoz.app.views.base import BaseAPIView
from operoz.app.views.board.automation import _get_board
from operoz.db.models import BoardSupportSlaPolicy
from operoz.db.models.board_support_sla_policy import default_support_sla_policies


class BoardSupportSlaPolicyEndpoint(BaseAPIView):
    def _get_or_create_policy(self, board):
        policy, _ = BoardSupportSlaPolicy.objects.get_or_create(
            board=board,
            defaults={"workspace_id": board.workspace_id, "policies": default_support_sla_policies()},
        )
        return policy

    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        policy = self._get_or_create_policy(board)
        return Response(BoardSupportSlaPolicySerializer(policy).data)

    @allow_workspace_or_board_admin
    def patch(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        policy = self._get_or_create_policy(board)
        serializer = BoardSupportSlaPolicyWriteSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        policy.policies = serializer.validated_data["policies"]
        policy.updated_by = request.user
        policy.save(update_fields=["policies", "updated_at", "updated_by"])
        return Response(BoardSupportSlaPolicySerializer(policy).data)
