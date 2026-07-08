from django.http import HttpResponse
from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions import ROLE, allow_permission
from operoz.app.serializers.client_360_finops import (
    Client360ProjectFinopsProfileWriteSerializer,
    WorkspaceClient360FinopsSettingsSerializer,
    WorkspaceClient360FinopsSettingsWriteSerializer,
    serialize_finops_profile,
)
from operoz.app.views.base import BaseAPIView
from operoz.db.models import Client360ProjectFinopsProfile, Project, Workspace, WorkspaceClient360FinopsSettings
from operoz.utils.client_360_finops import (
    build_consultant_heatmap,
    build_finops_csv_content,
    load_finops_settings,
    month_start,
    sync_harness_costs_for_workspace,
)


class WorkspaceClient360FinopsSettingsEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        row = WorkspaceClient360FinopsSettings.objects.filter(
            workspace=workspace,
            deleted_at__isnull=True,
        ).first()
        if not row:
            return Response(load_finops_settings(workspace.id), status=status.HTTP_200_OK)
        return Response(WorkspaceClient360FinopsSettingsSerializer(row).data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = WorkspaceClient360FinopsSettingsWriteSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        row, _ = WorkspaceClient360FinopsSettings.objects.get_or_create(workspace=workspace)
        for key, value in serializer.validated_data.items():
            setattr(row, key, value)
        row.save()
        return Response(WorkspaceClient360FinopsSettingsSerializer(row).data, status=status.HTTP_200_OK)


class WorkspaceClient360FinopsConsultantHeatmapEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        period = month_start()
        board_ids = request.query_params.get("board_ids")
        project_ids = None
        if board_ids:
            project_ids = list(
                Project.objects.filter(
                    workspace=workspace,
                    board_id__in=[b.strip() for b in board_ids.split(",") if b.strip()],
                    archived_at__isnull=True,
                ).values_list("id", flat=True)
            )
        payload = build_consultant_heatmap(
            workspace.id,
            period_month=period,
            project_ids=[str(pid) for pid in project_ids] if project_ids else None,
        )
        return Response(payload, status=status.HTTP_200_OK)


class WorkspaceClient360FinopsExportEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def get(self, request, slug):
        from operoz.app.views.workspace.client_360 import WorkspaceClient360ViewSet

        viewset = WorkspaceClient360ViewSet()
        viewset.request = request
        viewset.format_kwarg = None
        list_response = viewset.list(request, slug=slug)
        if list_response.status_code != status.HTTP_200_OK:
            return list_response
        clients = list_response.data.get("clients", [])
        period_start = list_response.data.get("period_start")
        period = month_start(parse_date(period_start) if period_start else None)
        content = build_finops_csv_content(clients, workspace_slug=slug, period_month=period)
        response = HttpResponse(content, content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="operoz-finops-{slug}-{period.isoformat()}.csv"'
        return response


class WorkspaceClient360FinopsHarnessSyncEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        result = sync_harness_costs_for_workspace(workspace.id)
        return Response(result, status=status.HTTP_200_OK)


class WorkspaceClient360ProjectFinopsProfileEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def patch(self, request, slug, project_id):
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)
        project = Project.objects.filter(id=project_id, workspace=workspace, archived_at__isnull=True).first()
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = Client360ProjectFinopsProfileWriteSerializer(data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        period = month_start()
        row, _ = Client360ProjectFinopsProfile.objects.get_or_create(
            workspace=workspace,
            project=project,
            period_month=period,
        )
        for key, value in serializer.validated_data.items():
            setattr(row, key, value)
        row.save()
        return Response(serialize_finops_profile(row), status=status.HTTP_200_OK)
