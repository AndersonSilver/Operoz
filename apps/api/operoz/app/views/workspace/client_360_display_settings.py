from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions import ROLE, allow_permission
from operoz.app.serializers.workspace_client_360_display import (
    WorkspaceClient360DisplaySettingsUpdateSerializer,
)
from operoz.app.views.base import BaseAPIView
from operoz.db.models import Workspace, WorkspaceClient360Settings
from operoz.utils.client_360_display import serialize_workspace_client360_settings


class WorkspaceClient360DisplaySettingsEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        row = WorkspaceClient360Settings.objects.filter(
            workspace=workspace,
            deleted_at__isnull=True,
        ).first()
        return Response(serialize_workspace_client360_settings(row), status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = WorkspaceClient360DisplaySettingsUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        row = WorkspaceClient360Settings.objects.filter(
            workspace=workspace,
            deleted_at__isnull=True,
        ).first()
        if row is None:
            row = WorkspaceClient360Settings(workspace=workspace)

        row.health_score_display_enabled = serializer.validated_data["health_score_display_enabled"]
        row.save(updated_by=request.user)
        return Response(serialize_workspace_client360_settings(row), status=status.HTTP_200_OK)
