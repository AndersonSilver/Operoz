from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions import ROLE, allow_permission
from operoz.app.serializers.notification import EmailNotificationLogSerializer
from operoz.app.views.base import BaseAPIView
from operoz.db.models import Board, EmailNotificationLog, Issue, Project


class BoardEmailNotificationAuditEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug, board_slug):
        try:
            board = Board.objects.get(workspace__slug=slug, slug=board_slug, deleted_at__isnull=True)
        except Board.DoesNotExist:
            return Response({"error": "Board not found"}, status=status.HTTP_404_NOT_FOUND)

        project_ids = Project.objects.filter(board=board, deleted_at__isnull=True).values_list("id", flat=True)
        issue_ids = Issue.objects.filter(project_id__in=project_ids, deleted_at__isnull=True).values_list("id", flat=True)

        logs = (
            EmailNotificationLog.objects.filter(entity_name="issue", entity_identifier__in=issue_ids)
            .select_related("receiver", "triggered_by")
            .order_by("-created_at")[:200]
        )

        return Response(EmailNotificationLogSerializer(logs, many=True).data, status=status.HTTP_200_OK)
