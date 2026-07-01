# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers.board_status_report import (
    BoardStatusReportCreateSerializer,
    BoardStatusReportSerializer,
    BoardStatusReportUpdateSerializer,
)
from plane.app.views.base import BaseAPIView
from plane.db.models import Board, BoardStatusReport, WorkspaceMember
from plane.utils.board_status_report import (
    build_status_report_content,
    content_to_markdown,
    default_report_title,
)


class BoardStatusReportEndpoint(BaseAPIView):
    def _get_board(self, slug: str, board_slug: str):
        return Board.objects.get(
            workspace__slug=slug,
            slug=board_slug,
            deleted_at__isnull=True,
            archived_at__isnull=True,
        )

    def _is_workspace_admin(self, request, slug: str) -> bool:
        return WorkspaceMember.objects.filter(
            member=request.user,
            workspace__slug=slug,
            role=ROLE.ADMIN.value,
            is_active=True,
        ).exists()

    def _queryset(self, board, request, slug: str):
        qs = BoardStatusReport.objects.filter(board=board, deleted_at__isnull=True).select_related(
            "created_by"
        )
        if not self._is_workspace_admin(request, slug):
            qs = qs.filter(published_at__isnull=False)
        return qs.order_by("-period_end", "-created_at")

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, board_slug):
        board = self._get_board(slug, board_slug)
        items = self._queryset(board, request, slug)
        return Response(BoardStatusReportSerializer(items, many=True).data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug, board_slug):
        board = self._get_board(slug, board_slug)
        serializer = BoardStatusReportCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        if data["period_end"] < data["period_start"]:
            return Response(
                {"period_end": "Must be on or after period_start."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        content = build_status_report_content(
            board=board,
            user=request.user,
            workspace_slug=slug,
            period_start=data["period_start"],
            period_end=data["period_end"],
        )
        summary_html = data.get("executive_summary_html", "")
        if summary_html:
            content["sections"]["executive_summary"]["html"] = summary_html

        title = (data.get("title") or "").strip() or default_report_title(
            data["period_start"], data["period_end"]
        )

        report = BoardStatusReport.objects.create(
            board=board,
            workspace_id=board.workspace_id,
            title=title,
            period_start=data["period_start"],
            period_end=data["period_end"],
            content=content,
            created_by=request.user,
        )
        return Response(BoardStatusReportSerializer(report).data, status=status.HTTP_201_CREATED)


class BoardStatusReportDetailEndpoint(BaseAPIView):
    def _get_board(self, slug: str, board_slug: str):
        return Board.objects.get(
            workspace__slug=slug,
            slug=board_slug,
            deleted_at__isnull=True,
            archived_at__isnull=True,
        )

    def _is_workspace_admin(self, request, slug: str) -> bool:
        return WorkspaceMember.objects.filter(
            member=request.user,
            workspace__slug=slug,
            role=ROLE.ADMIN.value,
            is_active=True,
        ).exists()

    def _get_report(self, board, pk, request, slug: str):
        qs = BoardStatusReport.objects.filter(board=board, pk=pk, deleted_at__isnull=True)
        if not self._is_workspace_admin(request, slug):
            qs = qs.filter(published_at__isnull=False)
        return qs.select_related("created_by", "board").get()

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, board_slug, pk):
        board = self._get_board(slug, board_slug)
        report = self._get_report(board, pk, request, slug)
        return Response(BoardStatusReportSerializer(report).data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug, board_slug, pk):
        board = self._get_board(slug, board_slug)
        report = BoardStatusReport.objects.get(board=board, pk=pk, deleted_at__isnull=True)

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

        if data.get("publish"):
            report.published_at = timezone.now()
        if data.get("unpublish"):
            report.published_at = None

        report.save()
        return Response(BoardStatusReportSerializer(report).data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, board_slug, pk):
        board = self._get_board(slug, board_slug)
        report = BoardStatusReport.objects.get(board=board, pk=pk, deleted_at__isnull=True)
        report.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class BoardStatusReportExportEndpoint(BaseAPIView):
    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug, board_slug, pk):
        board = Board.objects.get(
            workspace__slug=slug,
            slug=board_slug,
            deleted_at__isnull=True,
        )
        qs = BoardStatusReport.objects.filter(board=board, pk=pk, deleted_at__isnull=True)
        if not WorkspaceMember.objects.filter(
            member=request.user,
            workspace__slug=slug,
            role=ROLE.ADMIN.value,
            is_active=True,
        ).exists():
            qs = qs.filter(published_at__isnull=False)
        report = qs.select_related("board").get()

        module_name = report.module.name if report.module_id else None
        markdown = content_to_markdown(
            board_name=report.board.name if report.board_id else None,
            project_name=report.project.name if report.project_id else None,
            module_name=module_name,
            title=report.title or default_report_title(report.period_start, report.period_end, module_name),
            period_start=report.period_start,
            period_end=report.period_end,
            content=report.content or {},
        )
        filename = f"status-report-{report.period_end.isoformat()}.md"
        response = HttpResponse(markdown, content_type="text/markdown; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response
