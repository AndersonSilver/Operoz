from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.response import Response

from operis.app.permissions import ROLE, allow_permission
from operis.app.views.base import BaseViewSet
from operis.app.views.board.meta import CLOSED_STATE_GROUPS, _project_permission_filters
from operis.db.models import Board, BoardStatusReport, Issue, Module, Project
from operis.utils.client_360 import (
    aggregate_issue_stats,
    aggregate_module_counts,
    aggregate_status_reports,
    build_client_row,
    build_module_report_rows,
    parse_week_period,
)

SUPPORT_TYPE_NAME_Q = Q(type__name__icontains="sustent") | Q(type__name__icontains="chamado")


class BoardClient360ViewSet(BaseViewSet):
    """Vista agregada Cliente 360 por board (1 projeto = 1 cliente)."""

    use_read_replica = True

    def _get_board(self, slug: str, board_slug: str):
        return Board.objects.filter(
            workspace__slug=slug,
            slug=board_slug,
            archived_at__isnull=True,
            deleted_at__isnull=True,
        ).first()

    def _accessible_projects(self, slug: str, board_id: str):
        return (
            Project.objects.filter(
                workspace__slug=slug,
                board_id=board_id,
                archived_at__isnull=True,
                project_projectmember__member=self.request.user,
                project_projectmember__is_active=True,
            )
            .select_related("project_lead")
            .distinct()
            .order_by("name")
        )

    def _board_issues_queryset(self, slug: str, board_id: str, project_ids: list | None = None):
        qs = Issue.issue_objects.filter(
            workspace__slug=slug,
            project__board_id=board_id,
        ).filter(_project_permission_filters(self.request.user))
        if project_ids is not None:
            qs = qs.filter(project_id__in=project_ids)
        return qs.distinct()

    def _parse_period(self, request):
        period_start = parse_date(request.query_params.get("period_start", "") or "")
        period_end = parse_date(request.query_params.get("period_end", "") or "")
        try:
            return parse_week_period(period_start, period_end), None
        except ValueError as exc:
            return None, str(exc)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug, board_slug):
        board = self._get_board(slug, board_slug)
        if not board:
            return Response({"error": "Board not found"}, status=status.HTTP_404_NOT_FOUND)

        period, err = self._parse_period(request)
        if err:
            return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)

        projects = list(self._accessible_projects(slug, board.id))
        project_ids = [p.id for p in projects]
        today = timezone.now().date()

        issue_stats_map = aggregate_issue_stats(
            self._board_issues_queryset(slug, board.id, project_ids),
            today,
        )
        module_counts = aggregate_module_counts(project_ids)
        report_stats_map = aggregate_status_reports(project_ids, period)

        clients = [
            build_client_row(
                project,
                period=period,
                modules_total=module_counts.get(str(project.id), 0),
                issue_stats=issue_stats_map.get(str(project.id)),
                report_stats=report_stats_map.get(str(project.id)),
            )
            for project in projects
        ]

        summary = {
            "total_clients": len(clients),
            "health_critical": sum(1 for c in clients if c["health"] == "critical"),
            "health_warning": sum(1 for c in clients if c["health"] == "warning"),
            "report_missing": sum(
                1 for c in clients if c["status_report"]["coverage"] == "missing"
            ),
            "total_overdue": sum(c["issues"]["overdue"] for c in clients),
            "total_support_open": sum(c["support"]["open_count"] for c in clients),
        }

        return Response(
            {
                "period_start": period.start.isoformat(),
                "period_end": period.end.isoformat(),
                "summary": summary,
                "clients": clients,
            },
            status=status.HTTP_200_OK,
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def retrieve(self, request, slug, board_slug, project_id):
        board = self._get_board(slug, board_slug)
        if not board:
            return Response({"error": "Board not found"}, status=status.HTTP_404_NOT_FOUND)

        period, err = self._parse_period(request)
        if err:
            return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)

        project = (
            self._accessible_projects(slug, board.id)
            .filter(id=project_id)
            .first()
        )
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        today = timezone.now().date()
        pid = project.id
        issue_qs = self._board_issues_queryset(slug, board.id, [pid])
        issue_stats_map = aggregate_issue_stats(issue_qs, today)
        module_counts = aggregate_module_counts([pid])
        report_stats_map = aggregate_status_reports([pid], period)

        client = build_client_row(
            project,
            period=period,
            modules_total=module_counts.get(str(pid), 0),
            issue_stats=issue_stats_map.get(str(pid)),
            report_stats=report_stats_map.get(str(pid)),
        )

        modules = list(
            Module.objects.filter(project_id=pid, archived_at__isnull=True).order_by("name")
        )
        reports: dict[str | None, BoardStatusReport] = {}
        for r in BoardStatusReport.objects.filter(
            project_id=pid,
            period_start=period.start,
            period_end=period.end,
            deleted_at__isnull=True,
        ):
            key = str(r.module_id) if r.module_id else None
            existing = reports.get(key)
            if existing is None:
                reports[key] = r
            elif r.published_at and not existing.published_at:
                reports[key] = r
        module_rows = build_module_report_rows(str(pid), period, modules, reports)

        pending_filter = ~Q(state__group__in=CLOSED_STATE_GROUPS)
        overdue_issues = list(
            issue_qs.filter(
                pending_filter,
                target_date__lt=today,
                target_date__isnull=False,
            )
            .select_related("state", "assignees")
            .order_by("target_date")[:15]
            .values(
                "id",
                "name",
                "sequence_id",
                "target_date",
                "priority",
                "state__name",
                "state__group",
            )
        )
        support_issues = list(
            issue_qs.filter(pending_filter)
            .filter(SUPPORT_TYPE_NAME_Q)
            .select_related("state", "type")
            .order_by("-created_at")[:15]
            .values(
                "id",
                "name",
                "sequence_id",
                "target_date",
                "priority",
                "state__name",
                "type__name",
            )
        )

        return Response(
            {
                **client,
                "modules": module_rows,
                "overdue_issues": overdue_issues,
                "support_issues": support_issues,
            },
            status=status.HTTP_200_OK,
        )
