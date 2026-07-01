from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions import ROLE, allow_permission
from operoz.app.serializers import BoardStandardFieldSerializer, WorkspaceCustomFieldSerializer
from operoz.app.views.base import BaseAPIView
from operoz.db.models import Board, BoardStandardField, Project
from operoz.utils.board_custom_fields import get_project_enabled_custom_fields, sync_board_custom_fields_to_project
from operoz.utils.board_standard_fields import ensure_board_standard_fields, get_enabled_standard_field_keys


class ProjectCustomFieldEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, project_id):
        project = Project.objects.get(
            workspace__slug=slug, pk=project_id, deleted_at__isnull=True
        )
        if project.board_id:
            sync_board_custom_fields_to_project(project, request.user)
            board = Board.objects.get(pk=project.board_id, deleted_at__isnull=True)
            ensure_board_standard_fields(board, request.user)
            standard_fields = BoardStandardField.objects.filter(
                board_id=project.board_id,
                is_enabled=True,
                deleted_at__isnull=True,
            ).order_by("sort_order", "field_key")
            standard_data = BoardStandardFieldSerializer(standard_fields, many=True).data
        else:
            standard_data = []

        custom_fields = get_project_enabled_custom_fields(project)
        return Response(
            {
                "standard_fields": standard_data,
                "enabled_standard_keys": get_enabled_standard_field_keys(project.board_id)
                if project.board_id
                else [],
                "custom_fields": WorkspaceCustomFieldSerializer(custom_fields, many=True).data,
            },
            status=status.HTTP_200_OK,
        )
