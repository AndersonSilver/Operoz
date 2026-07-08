from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from operoz.app.permissions import allow_permission, ROLE
from operoz.app.serializers.board_support_queue import BoardSupportQueueSerializer
from operoz.app.views.base import BaseAPIView
from operoz.db.models import BoardSupportQueue, Project


class ProjectSupportQueueListEndpoint(BaseAPIView):
    permission_classes = [IsAuthenticated]

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id):
        project = Project.objects.filter(workspace__slug=slug, pk=project_id, deleted_at__isnull=True).first()
        if not project or not project.board_id:
            return Response([], status=status.HTTP_200_OK)
        queues = BoardSupportQueue.objects.filter(board_id=project.board_id, deleted_at__isnull=True).order_by(
            "sort_order", "name"
        )
        return Response(BoardSupportQueueSerializer(queues, many=True).data)
