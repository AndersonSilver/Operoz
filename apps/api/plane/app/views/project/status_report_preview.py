# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import copy

from django.http import HttpResponse
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers.board_status_report import ProjectStatusReportPreviewSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import BoardStatusReport, Project
from plane.utils.board_status_report import apply_live_entregas_from_module, default_report_title
from plane.utils.status_report_export import (
    StatusReportExportContext,
    apply_live_report_row_labels,
    build_export_context,
    content_to_html,
    content_to_markdown,
    content_to_pdf_bytes,
)


def _merge_preview_content(report: BoardStatusReport, data: dict) -> dict:
    content = copy.deepcopy(report.content or {})
    sections = content.setdefault("sections", {})

    if "executive_summary_html" in data:
        sections.setdefault("executive_summary", {})["html"] = data["executive_summary_html"]

    if "em_execucao" in data or "pontos_atencao" in data:
        obs = sections.setdefault("observacoes", {"em_execucao": [], "pontos_atencao": []})
        if "em_execucao" in data:
            obs["em_execucao"] = data["em_execucao"]
        if "pontos_atencao" in data:
            obs["pontos_atencao"] = data["pontos_atencao"]

    return content


class ProjectStatusReportPreviewEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="PROJECT")
    def post(self, request, slug, project_id, pk):
        project = Project.objects.get(
            workspace__slug=slug,
            id=project_id,
            archived_at__isnull=True,
        )
        qs = BoardStatusReport.objects.filter(project=project, pk=pk, deleted_at__isnull=True)
        report = qs.select_related("board", "project", "module", "created_by", "workspace").get()
        serializer = ProjectStatusReportPreviewSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        export_format = data.get("format", "html")
        merged_content = _merge_preview_content(report, data)
        merged_content = apply_live_report_row_labels(report, merged_content)
        merged_content = apply_live_entregas_from_module(report, merged_content, request.user)

        ctx = build_export_context(report)
        ctx.content = merged_content
        if not ctx.title:
            ctx.title = report.title or default_report_title(
                report.period_start,
                report.period_end,
                report.module.name if report.module_id else None,
            )

        no_cache = {"Cache-Control": "no-store, no-cache, must-revalidate", "Pragma": "no-cache"}

        if export_format == "md":
            body = content_to_markdown(ctx)
            return HttpResponse(body, content_type="text/plain; charset=utf-8", headers=no_cache)

        if export_format == "pdf":
            html_body = content_to_html(ctx, for_pdf=True)
            pdf_bytes = content_to_pdf_bytes(html_body)
            if pdf_bytes:
                return HttpResponse(pdf_bytes, content_type="application/pdf")
            return HttpResponse(
                html_body,
                content_type="text/html; charset=utf-8",
                headers={**no_cache, "X-Status-Report-Pdf-Fallback": "html-print"},
            )

        html_body = content_to_html(ctx, for_pdf=False)
        return HttpResponse(html_body, content_type="text/html; charset=utf-8", headers=no_cache)
