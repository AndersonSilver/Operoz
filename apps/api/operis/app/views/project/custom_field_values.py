from rest_framework import status
from rest_framework.response import Response

from operis.app.permissions import ROLE, allow_permission
from operis.app.serializers import (
    BoardProjectFieldLayoutSerializer,
    ProjectCustomFieldValueSerializer,
    ProjectCustomFieldValuesBulkSerializer,
)
from operis.app.views.base import BaseAPIView
from operis.db.models import Project, ProjectCustomFieldValue
from operis.utils.board_project_field_layout import (
    ensure_board_project_field_layout,
    get_board_project_field_layout,
    get_layout_custom_field_ids,
    validate_project_custom_values,
)
from operis.utils.board_custom_fields import sync_board_custom_fields_to_project


def _layout_response(board, project=None, user=None):
    ensure_board_project_field_layout(board, user)
    items = get_board_project_field_layout(board.id).filter(is_enabled=True)
    allowed_custom_ids = get_layout_custom_field_ids(board.id)
    values = []
    if project:
        sync_board_custom_fields_to_project(project, user)
        values = ProjectCustomFieldValue.objects.filter(
            project=project, deleted_at__isnull=True, custom_field_id__in=allowed_custom_ids
        ).select_related("custom_field")
    return {
        "board_id": str(board.id),
        "board_slug": board.slug,
        "layout": BoardProjectFieldLayoutSerializer(items, many=True).data,
        "custom_field_values": ProjectCustomFieldValueSerializer(values, many=True).data,
    }


class BoardProjectFormLayoutEndpoint(BaseAPIView):
    """Layout para criar projeto (board conhecido)."""

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, board_slug):
        from operis.db.models import Board

        board = Board.objects.get(workspace__slug=slug, slug=board_slug, deleted_at__isnull=True)
        return Response(_layout_response(board, user=request.user), status=status.HTTP_200_OK)


class ProjectFormLayoutEndpoint(BaseAPIView):
    """Layout + valores ao editar projeto existente."""

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, project_id):
        project = Project.objects.get(workspace__slug=slug, pk=project_id, deleted_at__isnull=True)
        if not project.board_id:
            return Response({"layout": [], "board_id": None, "custom_field_values": []}, status=status.HTTP_200_OK)
        return Response(
            _layout_response(project.board, project=project, user=request.user),
            status=status.HTTP_200_OK,
        )


class ProjectCustomFieldValueEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug, project_id):
        project = Project.objects.get(workspace__slug=slug, pk=project_id, deleted_at__isnull=True)
        if not project.board_id:
            return Response([], status=status.HTTP_200_OK)
        allowed_ids = get_layout_custom_field_ids(project.board_id)
        values = ProjectCustomFieldValue.objects.filter(
            project=project, deleted_at__isnull=True, custom_field_id__in=allowed_ids
        ).select_related("custom_field")
        return Response(
            ProjectCustomFieldValueSerializer(values, many=True).data,
            status=status.HTTP_200_OK,
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def put(self, request, slug, project_id):
        project = Project.objects.get(workspace__slug=slug, pk=project_id, deleted_at__isnull=True)
        serializer = ProjectCustomFieldValuesBulkSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        if project.board_id:
            missing = validate_project_custom_values(project.board_id, serializer.validated_data["values"])
            if missing:
                return Response(
                    {"error": "REQUIRED_CUSTOM_FIELDS_MISSING", "fields": missing},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        allowed_ids = get_layout_custom_field_ids(project.board_id) if project.board_id else set()
        saved = []

        for item in serializer.validated_data["values"]:
            field_id = item["custom_field_id"]
            if project.board_id and field_id not in allowed_ids:
                continue
            value_obj, created = ProjectCustomFieldValue.objects.update_or_create(
                project=project,
                custom_field_id=field_id,
                defaults={
                    "value": item.get("value") or {},
                    "workspace_id": project.workspace_id,
                    "updated_by": request.user,
                },
            )
            if created:
                value_obj.created_by = request.user
                value_obj.save(update_fields=["created_by", "updated_at"])
            saved.append(value_obj)

        values = ProjectCustomFieldValue.objects.filter(
            project=project, pk__in=[v.pk for v in saved], deleted_at__isnull=True
        ).select_related("custom_field")
        return Response(
            ProjectCustomFieldValueSerializer(values, many=True).data,
            status=status.HTTP_200_OK,
        )
