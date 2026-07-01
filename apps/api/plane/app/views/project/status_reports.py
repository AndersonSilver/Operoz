# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import copy

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers.board_status_report import (
    BoardStatusReportSerializer,
    BoardStatusReportUpdateSerializer,
    ProjectStatusReportCreateSerializer,
)
from plane.app.views.base import BaseAPIView
from plane.db.models import BoardStatusReport, Module, Project, ProjectMember
from plane.utils.board_permission_enforcement import (
    get_effective_board_permission_keys,
    permission_granted,
)
from plane.utils.board_status_report import (
    apply_live_entregas_from_module,
    build_project_module_status_report_content,
    default_report_title,
)
from plane.utils.status_report_export import (
    apply_live_report_row_labels,
    build_export_context,
    content_to_html,
    content_to_markdown,
    content_to_pdf_bytes,
)


class ProjectStatusReportEndpoint(BaseAPIView):
    def _get_project(self, slug: str, project_id: str):
        return Project.objects.get(
            workspace__slug=slug,
            id=project_id,
            archived_at__isnull=True,
        )

    def _get_module(self, project: Project, module_id: str):
        return Module.objects.get(
            project_id=project.id,
            id=module_id,
            archived_at__isnull=True,
        )

    def _is_project_admin(self, request, project: Project) -> bool:
        return ProjectMember.objects.filter(
            member=request.user,
            project_id=project.id,
            role=ROLE.ADMIN.value,
            is_active=True,
        ).exists()

    def _status_report_permission_denied(self, request, project: Project, permission_key: str):
        keys = get_effective_board_permission_keys(project.board_id, request.user.id)
        if keys is not None:
            if permission_granted(keys, permission_key):
                return None
            return Response(
                {"error": "BOARD_PERMISSION_DENIED", "permission": permission_key},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not self._is_project_admin(request, project):
            return Response({"error": "Project admin required"}, status=status.HTTP_403_FORBIDDEN)
        return None

    def _queryset(self, project, request):
        qs = BoardStatusReport.objects.filter(
            project=project,
            deleted_at__isnull=True,
        ).select_related("created_by", "created_by__avatar_asset", "module", "project")
        if not self._is_project_admin(request, project):
            qs = qs.filter(published_at__isnull=False)
        return qs.order_by("-period_end", "-created_at")

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id):
        project = self._get_project(slug, project_id)
        items = self._queryset(project, request)
        return Response(BoardStatusReportSerializer(items, many=True).data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def post(self, request, slug, project_id):
        project = self._get_project(slug, project_id)
        if denied := self._status_report_permission_denied(request, project, "status_reports.manage"):
            return denied
        serializer = ProjectStatusReportCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        if data["period_end"] < data["period_start"]:
            return Response(
                {"period_end": "Must be on or after period_start."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            module = self._get_module(project, str(data["module_id"]))
        except Module.DoesNotExist:
            return Response({"module_id": "Module not found in this project."}, status=status.HTTP_400_BAD_REQUEST)

        content = build_project_module_status_report_content(
            project=project,
            module=module,
            user=request.user,
            workspace_slug=slug,
            period_start=data["period_start"],
            period_end=data["period_end"],
        )
        summary_html = data.get("executive_summary_html", "")
        if summary_html:
            content["sections"]["executive_summary"]["html"] = summary_html

        title = (data.get("title") or "").strip() or default_report_title(
            data["period_start"], data["period_end"], module.name
        )

        report = BoardStatusReport.objects.create(
            board_id=project.board_id,
            project=project,
            module=module,
            workspace_id=project.workspace_id,
            title=title,
            period_start=data["period_start"],
            period_end=data["period_end"],
            content=content,
            created_by=request.user,
        )
        return Response(BoardStatusReportSerializer(report).data, status=status.HTTP_201_CREATED)


class ProjectStatusReportDetailEndpoint(BaseAPIView):
    def _get_project(self, slug: str, project_id: str):
        return Project.objects.get(
            workspace__slug=slug,
            id=project_id,
            archived_at__isnull=True,
        )

    def _is_project_admin(self, request, project: Project) -> bool:
        return ProjectMember.objects.filter(
            member=request.user,
            project_id=project.id,
            role=ROLE.ADMIN.value,
            is_active=True,
        ).exists()

    def _status_report_permission_denied(self, request, project: Project, permission_key: str):
        keys = get_effective_board_permission_keys(project.board_id, request.user.id)
        if keys is not None:
            if permission_granted(keys, permission_key):
                return None
            return Response(
                {"error": "BOARD_PERMISSION_DENIED", "permission": permission_key},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not self._is_project_admin(request, project):
            return Response({"error": "Project admin required"}, status=status.HTTP_403_FORBIDDEN)
        return None

    def _get_report(self, project, pk, request):
        qs = BoardStatusReport.objects.filter(project=project, pk=pk, deleted_at__isnull=True)
        if not self._is_project_admin(request, project):
            qs = qs.filter(published_at__isnull=False)
        return qs.select_related("created_by", "created_by__avatar_asset", "module", "project", "board").get()

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id, pk):
        project = self._get_project(slug, project_id)
        report = self._get_report(project, pk, request)
        return Response(BoardStatusReportSerializer(report).data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def patch(self, request, slug, project_id, pk):
        project = self._get_project(slug, project_id)
        if denied := self._status_report_permission_denied(request, project, "status_reports.manage"):
            return denied
        report = BoardStatusReport.objects.get(project=project, pk=pk, deleted_at__isnull=True)

        serializer = BoardStatusReportUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        if "title" in data:
            report.title = data["title"].strip() or report.title
        if "period_start" in data:
            report.period_start = data["period_start"]
        if "period_end" in data:
            report.period_end = data["period_end"]
        if report.period_end < report.period_start:
            return Response(
                {"period_end": "Must be on or after period_start."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if "content" in data:
            report.content = data["content"]
        elif "executive_summary_html" in data:
            content = report.content or {}
            sections = content.setdefault("sections", {})
            executive = sections.setdefault("executive_summary", {})
            executive["html"] = data["executive_summary_html"]

        if "em_execucao" in data or "pontos_atencao" in data:
            content = report.content or {}
            sections = content.setdefault("sections", {})
            obs = sections.setdefault("observacoes", {"em_execucao": [], "pontos_atencao": []})
            if "em_execucao" in data:
                obs["em_execucao"] = [line for line in data["em_execucao"] if str(line).strip()]
            if "pontos_atencao" in data:
                obs["pontos_atencao"] = [line for line in data["pontos_atencao"] if str(line).strip()]

        if data.get("publish"):
            report.published_at = timezone.now()
        if data.get("unpublish"):
            report.published_at = None

        report.save()
        return Response(BoardStatusReportSerializer(report).data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="PROJECT")
    def delete(self, request, slug, project_id, pk):
        project = self._get_project(slug, project_id)
        if denied := self._status_report_permission_denied(request, project, "status_reports.delete"):
            return denied
        report = BoardStatusReport.objects.get(project=project, pk=pk, deleted_at__isnull=True)
        report.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectStatusReportExportEndpoint(BaseAPIView):
    def _get_project(self, slug: str, project_id: str):
        return Project.objects.get(workspace__slug=slug, id=project_id, archived_at__isnull=True)

    def _is_project_admin(self, request, project: Project) -> bool:
        return ProjectMember.objects.filter(
            member=request.user,
            project_id=project.id,
            role=ROLE.ADMIN.value,
            is_active=True,
        ).exists()

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def get(self, request, slug, project_id, pk):
        project = self._get_project(slug, project_id)
        qs = BoardStatusReport.objects.filter(project=project, pk=pk, deleted_at__isnull=True)
        if not self._is_project_admin(request, project):
            qs = qs.filter(published_at__isnull=False)
        report = qs.select_related(
            "board", "project", "module", "created_by", "created_by__avatar_asset", "workspace"
        ).get()

        export_format = (request.GET.get("format") or "md").lower().strip()
        ctx = build_export_context(report)
        live_content = apply_live_report_row_labels(report, copy.deepcopy(report.content or {}))
        ctx.content = apply_live_entregas_from_module(report, live_content, request.user)
        if not ctx.title:
            module_name = report.module.name if report.module_id else None
            ctx.title = default_report_title(report.period_start, report.period_end, module_name)
        base_name = f"status-report-{report.period_end.isoformat()}"

        if export_format == "html":
            body = content_to_html(ctx)
            response = HttpResponse(body, content_type="text/html; charset=utf-8")
            response["Content-Disposition"] = f'attachment; filename="{base_name}.html"'
            return response

        if export_format == "pdf":
            html_body = content_to_html(ctx, for_pdf=True)
            pdf_bytes = content_to_pdf_bytes(html_body)
            if pdf_bytes:
                response = HttpResponse(pdf_bytes, content_type="application/pdf")
                response["Content-Disposition"] = f'attachment; filename="{base_name}.pdf"'
                return response
            response = HttpResponse(html_body, content_type="text/html; charset=utf-8")
            response["Content-Disposition"] = f'inline; filename="{base_name}-print.html"'
            response["X-Status-Report-Pdf-Fallback"] = "html-print"
            return response

        markdown = content_to_markdown(ctx)
        response = HttpResponse(markdown, content_type="text/markdown; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{base_name}.md"'
        return response
