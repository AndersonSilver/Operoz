from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions import ROLE, allow_permission
from operoz.app.serializers.client_360_narrative import Client360NarrativeUpdateSerializer
from operoz.app.views.base import BaseAPIView
from operoz.app.views.workspace.client_360 import WorkspaceClient360ViewSet
from operoz.db.models import Client360Narrative, Client360StatusReportReminderLog
from operoz.utils.client_360_narrative import serialize_narrative, upsert_narrative


class WorkspaceClient360NarrativeEndpoint(BaseAPIView):
    view_set = WorkspaceClient360ViewSet()

    def _project(self, request, slug, project_id):
        self.view_set.request = request
        return self.view_set._accessible_projects(slug).filter(id=project_id).first()

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, project_id):
        period, err = self.view_set._parse_period(request)
        if err:
            return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)
        project = self._project(request, slug, project_id)
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
        row = Client360Narrative.objects.filter(project=project, period_start=period.start).first()
        return Response(serialize_narrative(row), status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def patch(self, request, slug, project_id):
        period, err = self.view_set._parse_period(request)
        if err:
            return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)
        project = self._project(request, slug, project_id)
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = Client360NarrativeUpdateSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        existing = Client360Narrative.objects.filter(project=project, period_start=period.start).first()
        row = upsert_narrative(
            workspace_id=project.workspace_id,
            project_id=project.id,
            period_start=period.start,
            period_end=period.end,
            wins_md=serializer.validated_data.get("wins_md", existing.wins_md if existing else ""),
            risks_md=serializer.validated_data.get("risks_md", existing.risks_md if existing else ""),
            next_steps_md=serializer.validated_data.get(
                "next_steps_md", existing.next_steps_md if existing else ""
            ),
        )
        return Response(serialize_narrative(row), status=status.HTTP_200_OK)


class BoardClient360ReminderLogsEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, board_slug):
        from operoz.app.views.board.automation import _get_board

        board = _get_board(slug, board_slug)
        if not board:
            return Response({"error": "Board not found"}, status=status.HTTP_404_NOT_FOUND)
        logs = Client360StatusReportReminderLog.objects.filter(board=board).order_by("-created_at")[:30]
        payload = [
            {
                "id": str(log.id),
                "period_start": log.period_start.isoformat(),
                "period_end": log.period_end.isoformat(),
                "notified_count": log.notified_count,
                "skipped_count": log.skipped_count,
                "details": log.details,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ]
        return Response(payload, status=status.HTTP_200_OK)
