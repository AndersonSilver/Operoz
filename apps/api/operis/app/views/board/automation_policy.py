from rest_framework import status
from rest_framework.response import Response

from operis.app.permissions.board_access import allow_workspace_or_board_admin
from operis.app.serializers.board_automation_policy import (
    BoardAutomationPolicySerializer,
    BoardAutomationPublishAuditSerializer,
)
from operis.app.views.base import BaseAPIView
from operis.app.views.board.automation import _get_board
from operis.automation.policy import get_or_create_board_policy
from operis.db.models import BoardAutomationPublishAudit


class BoardAutomationPolicyEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        policy = get_or_create_board_policy(board)
        return Response(BoardAutomationPolicySerializer(policy).data, status=status.HTTP_200_OK)

    @allow_workspace_or_board_admin
    def patch(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        policy = get_or_create_board_policy(board)
        serializer = BoardAutomationPolicySerializer(policy, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        policy = serializer.save(updated_by=request.user)
        return Response(BoardAutomationPolicySerializer(policy).data, status=status.HTTP_200_OK)


class BoardAutomationPublishAuditListEndpoint(BaseAPIView):
    @allow_workspace_or_board_admin
    def get(self, request, slug, board_slug):
        board = _get_board(slug, board_slug)
        rule_id = request.query_params.get("rule_id")
        audits = BoardAutomationPublishAudit.objects.filter(board=board, deleted_at__isnull=True).select_related(
            "rule", "published_by"
        )
        if rule_id:
            audits = audits.filter(rule_id=rule_id)
        audits = audits.order_by("-published_at")[:100]
        return Response(BoardAutomationPublishAuditSerializer(audits, many=True).data, status=status.HTTP_200_OK)
