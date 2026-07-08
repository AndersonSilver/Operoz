from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.response import Response

from operoz.app.permissions import ROLE, allow_permission
from operoz.app.views.base import BaseViewSet
from operoz.app.views.board.meta import CLOSED_STATE_GROUPS, _project_permission_filters
from operoz.db.models import BoardStatusReport, Issue, Module, Project, Workspace
from operoz.db.models import Client360Narrative
from operoz.utils.client_360 import (
    aggregate_client360_issue_stats,
    aggregate_module_counts,
    aggregate_status_reports,
    build_client_row,
    build_module_report_rows,
    parse_week_period,
)
from operoz.utils.client_360_operational import load_board_support_sla_map
from operoz.utils.client_360_support_hub import (
    aggregate_support_metrics_analytics,
    build_support_analytics_csv_content,
    list_support_hub_issues,
)
from operoz.utils.client_360_health_settings import (
    load_board_health_config_map,
    load_board_score_alert_threshold_map,
)
from operoz.utils.client_360_health_alerts import build_client360_list_summary
from operoz.utils.client_360_display import client_360_display_payload
from operoz.utils.client_360_period_compare import attach_period_compare, parse_compare_query
from operoz.utils.client_360_health_history import (
    build_health_history_payload,
    parse_health_history_weeks,
)
from operoz.utils.client_360_matrix import (
    build_client360_matrix_payload,
    parse_matrix_pagination,
    parse_matrix_weeks,
)
from operoz.utils.client_360_matrix_csv_export import build_client360_matrix_csv_content, matrix_csv_filename
from operoz.utils.client_360_narrative import serialize_narrative
from operoz.utils.client_360_qbr_export import parse_qbr_format, parse_qbr_weeks, qbr_to_markdown, qbr_to_pdf_bytes
from operoz.utils.client_360_qbr_service import build_client_qbr_context, build_workspace_portfolio_qbr_context
from operoz.utils.client_360_operational import apply_operational_enrichment, build_detail_operational_payload
from operoz.utils.client_360_finops import (
    apply_finops_enrichment,
    build_detail_finops_payload,
    build_finops_summary,
    load_finops_profiles,
    load_finops_settings,
    month_start,
)
from operoz.utils.client_360_enterprise import (
    group_clients_by_customer,
    is_phase_enabled,
    load_enterprise_settings,
)
from operoz.db.models.workspace_client_360_enterprise_settings import WorkspaceClient360EnterpriseSettings


class WorkspaceClient360ViewSet(BaseViewSet):
    """Visão 360 agregada do workspace — todos os boards e projetos acessíveis."""

    use_read_replica = True

    def _accessible_projects(self, slug: str):
        return (
            Project.objects.filter(
                workspace__slug=slug,
                archived_at__isnull=True,
                board_id__isnull=False,
                board__archived_at__isnull=True,
                board__deleted_at__isnull=True,
                project_projectmember__member=self.request.user,
                project_projectmember__is_active=True,
            )
            .select_related("project_lead", "board", "client360_customer")
            .distinct()
            .order_by("board__name", "name")
        )

    def _workspace_issues_queryset(self, slug: str, project_ids: list | None = None):
        qs = Issue.issue_objects.filter(
            workspace__slug=slug,
            project__board_id__isnull=False,
            project__board__archived_at__isnull=True,
            project__board__deleted_at__isnull=True,
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
    def list(self, request, slug):
        period, err = self._parse_period(request)
        if err:
            return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)

        projects = list(self._accessible_projects(slug))
        project_ids = [p.id for p in projects]
        today = timezone.now().date()

        board_ids = list({p.board_id for p in projects if p.board_id})
        project_board_map = {str(p.id): str(p.board_id) if p.board_id else None for p in projects}
        issue_stats_map = aggregate_client360_issue_stats(
            self._workspace_issues_queryset(slug, project_ids),
            today,
            project_ids=project_ids,
            project_board_map=project_board_map,
            sla_map=load_board_support_sla_map(board_ids),
        )
        module_counts = aggregate_module_counts(project_ids)
        report_stats_map = aggregate_status_reports(project_ids, period)
        health_config_map = load_board_health_config_map(board_ids)
        alert_threshold_map = load_board_score_alert_threshold_map(board_ids)

        clients = [
            build_client_row(
                project,
                period=period,
                modules_total=module_counts.get(str(project.id), 0),
                issue_stats=issue_stats_map.get(str(project.id)),
                report_stats=report_stats_map.get(str(project.id)),
                board=project.board,
                health_config=health_config_map.get(str(project.board_id)) if project.board_id else None,
                score_alert_threshold=(alert_threshold_map.get(str(project.board_id)) if project.board_id else None),
            )
            for project in projects
        ]

        issue_qs = self._workspace_issues_queryset(slug, project_ids)
        apply_operational_enrichment(
            clients,
            issue_queryset=issue_qs,
            period=period,
            today=today,
            board_ids=board_ids,
            project_board_map=project_board_map,
        )

        summary = build_client360_list_summary(clients)
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        enterprise_settings = load_enterprise_settings(workspace.id if workspace else None)
        finops_summary = None
        if is_phase_enabled(enterprise_settings, "4"):
            finops_settings = load_finops_settings(workspace.id if workspace else None)
            finops_profiles = load_finops_profiles(project_ids, month_start(today))
            apply_finops_enrichment(clients, profiles=finops_profiles, settings=finops_settings)
            finops_summary = build_finops_summary(clients, finops_settings)

        support_analytics = aggregate_support_metrics_analytics(
            project_ids,
            period_start=period.start,
            period_end=period.end,
        )

        if (request.query_params.get("export") or "").lower() == "support_csv":
            delimiter = ";" if (request.query_params.get("delimiter") or "") == "semicolon" else ","
            csv_content = build_support_analytics_csv_content(
                clients=clients,
                analytics=support_analytics,
                delimiter=delimiter,
            )
            filename = f"operoz-sustentacao-analytics-{slug}-{period.end.isoformat()}"
            response = HttpResponse("\ufeff" + csv_content, content_type="text/csv; charset=utf-8")
            response["Content-Disposition"] = f'attachment; filename="{filename}.csv"'
            return response

        payload = {
            "period_start": period.start.isoformat(),
            "period_end": period.end.isoformat(),
            "display": client_360_display_payload(workspace) if workspace else {"health_score_enabled": False},
            "enterprise": enterprise_settings,
            "summary": summary,
            "finops_summary": finops_summary,
            "clients": clients,
            "support_analytics": support_analytics,
        }
        if enterprise_settings.get("list_grouping_mode") == WorkspaceClient360EnterpriseSettings.GROUPING_CUSTOMER:
            payload["customer_groups"] = group_clients_by_customer(clients, projects)

        if parse_compare_query(request.query_params.get("compare")):
            payload["period_compare"] = attach_period_compare(
                clients=clients,
                summary=summary,
                projects=projects,
                current_period=period,
                issue_queryset=self._workspace_issues_queryset(slug, project_ids),
                today=today,
                include_board=True,
                health_config_map=health_config_map,
                alert_threshold_map=alert_threshold_map,
                module_counts=module_counts,
            )

        return Response(payload, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def retrieve(self, request, slug, project_id):
        period, err = self._parse_period(request)
        if err:
            return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)

        project = self._accessible_projects(slug).filter(id=project_id).first()
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        today = timezone.now().date()
        pid = project.id
        issue_qs = self._workspace_issues_queryset(slug, [pid])
        board_ids = [project.board_id] if project.board_id else []
        project_board_map = {str(pid): str(project.board_id) if project.board_id else None}
        issue_stats_map = aggregate_client360_issue_stats(
            issue_qs,
            today,
            project_ids=[pid],
            project_board_map=project_board_map,
            sla_map=load_board_support_sla_map(board_ids),
        )
        module_counts = aggregate_module_counts([pid])
        report_stats_map = aggregate_status_reports([pid], period)
        health_config_map = load_board_health_config_map([project.board_id]) if project.board_id else {}
        alert_threshold_map = load_board_score_alert_threshold_map([project.board_id]) if project.board_id else {}

        client = build_client_row(
            project,
            period=period,
            modules_total=module_counts.get(str(pid), 0),
            issue_stats=issue_stats_map.get(str(pid)),
            report_stats=report_stats_map.get(str(pid)),
            board=project.board,
            health_config=health_config_map.get(str(project.board_id)) if project.board_id else None,
            score_alert_threshold=(alert_threshold_map.get(str(project.board_id)) if project.board_id else None),
        )

        modules = list(Module.objects.filter(project_id=pid, archived_at__isnull=True).order_by("name"))
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
        support_issues = list_support_hub_issues(pid)

        narrative_row = Client360Narrative.objects.filter(project=project, period_start=period.start).first()
        operational = build_detail_operational_payload(
            project_id=pid,
            issue_queryset=issue_qs,
            period=period,
            today=today,
            board_id=project.board_id,
            module_rows=module_rows,
        )
        finops_settings = load_finops_settings(project.workspace_id)
        finops_profile = load_finops_profiles([pid], month_start(today)).get(str(pid))
        throughput = operational.get("delivery", {})
        finops = build_detail_finops_payload(
            project_id=str(pid),
            profile=finops_profile,
            settings=finops_settings,
            issue_queryset=issue_qs,
            period=period,
            throughput=throughput,
        )

        return Response(
            {
                **client,
                "display": client_360_display_payload(project.workspace),
                "modules": module_rows,
                "overdue_issues": overdue_issues,
                "support_issues": support_issues,
                "narrative": serialize_narrative(narrative_row),
                "operational": operational,
                "finops": finops,
            },
            status=status.HTTP_200_OK,
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def health_history(self, request, slug, project_id):
        weeks, err = parse_health_history_weeks(request.query_params.get("weeks"))
        if err:
            return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)

        project = self._accessible_projects(slug).filter(id=project_id).first()
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        payload = build_health_history_payload(
            project,
            weeks=weeks,
            issue_queryset=self._workspace_issues_queryset(slug, [project.id]),
        )
        return Response(payload, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def matrix(self, request, slug):
        anchor_period, err = self._parse_period(request)
        if err:
            return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)

        weeks, weeks_err = parse_matrix_weeks(request.query_params.get("weeks"))
        if weeks_err:
            return Response({"error": weeks_err}, status=status.HTTP_400_BAD_REQUEST)

        page, page_size, page_err = parse_matrix_pagination(
            request.query_params.get("page"),
            request.query_params.get("page_size"),
        )
        if page_err:
            return Response({"error": page_err}, status=status.HTTP_400_BAD_REQUEST)

        projects = list(self._accessible_projects(slug))
        board_ids_raw = (request.query_params.get("board_ids") or "").strip()
        if board_ids_raw:
            allowed = {value.strip() for value in board_ids_raw.split(",") if value.strip()}
            projects = [project for project in projects if str(project.board_id) in allowed]

        project_ids = [project.id for project in projects]
        module_counts = aggregate_module_counts(project_ids)

        payload = build_client360_matrix_payload(
            projects,
            anchor_period=anchor_period,
            weeks=weeks,
            module_counts=module_counts,
            page=page,
            page_size=page_size,
            include_board=True,
        )

        if (request.query_params.get("export") or "").lower() == "csv":
            export_payload = build_client360_matrix_payload(
                projects,
                anchor_period=anchor_period,
                weeks=weeks,
                module_counts=module_counts,
                page=1,
                page_size=max(len(projects), 1),
                include_board=True,
            )
            delimiter = ";" if (request.query_params.get("delimiter") or "") == "semicolon" else ","
            csv_content = build_client360_matrix_csv_content(
                clients=export_payload.get("clients") or [],
                weeks=export_payload.get("weeks") or [],
                delimiter=delimiter,
            )
            filename = matrix_csv_filename(slug, anchor_period.end.isoformat())
            response = HttpResponse("\ufeff" + csv_content, content_type="text/csv; charset=utf-8")
            response["Content-Disposition"] = f'attachment; filename="{filename}.csv"'
            return response

        return Response(payload, status=status.HTTP_200_OK)

    def _qbr_filename_base(self, payload: dict) -> str:
        period_end = payload.get("period_end", "qbr")
        scope = payload.get("scope", "portfolio")
        return f"operoz-qbr-{scope}-{period_end}"

    def _qbr_http_response(self, payload: dict, export_format: str):
        base_name = self._qbr_filename_base(payload)
        if export_format == "pdf":
            pdf_bytes, extra_warnings = qbr_to_pdf_bytes(payload)
            all_warnings = list(payload.get("chart_warnings") or []) + [
                w for w in extra_warnings if w not in (payload.get("chart_warnings") or [])
            ]
            if pdf_bytes:
                response = HttpResponse(pdf_bytes, content_type="application/pdf")
                response["Content-Disposition"] = f'attachment; filename="{base_name}.pdf"'
                if all_warnings:
                    response["X-Client360-Qbr-Warnings"] = "; ".join(all_warnings)[:500]
                return response
            from operoz.utils.client_360_qbr_export import qbr_to_html

            html_body = qbr_to_html({**payload, "chart_warnings": all_warnings})
            response = HttpResponse(html_body, content_type="text/html; charset=utf-8")
            response["Content-Disposition"] = f'inline; filename="{base_name}-print.html"'
            response["X-Client360-Qbr-Pdf-Fallback"] = "html-print"
            if all_warnings:
                response["X-Client360-Qbr-Warnings"] = "; ".join(all_warnings)[:500]
            return response

        markdown = qbr_to_markdown(payload)
        response = HttpResponse(markdown, content_type="text/markdown; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{base_name}.md"'
        return response

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def qbr_portfolio(self, request, slug):
        period, err = self._parse_period(request)
        if err:
            return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)

        weeks, weeks_err = parse_qbr_weeks(request.query_params.get("weeks"))
        if weeks_err:
            return Response({"error": weeks_err}, status=status.HTTP_400_BAD_REQUEST)

        export_format, fmt_err = parse_qbr_format(request.query_params.get("export_format"))
        if fmt_err:
            return Response({"error": fmt_err}, status=status.HTTP_400_BAD_REQUEST)

        projects = list(self._accessible_projects(slug))
        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        payload = build_workspace_portfolio_qbr_context(
            workspace=workspace,
            projects=projects,
            period=period,
            weeks=weeks,
            issue_queryset=self._workspace_issues_queryset(slug, [project.id for project in projects]),
            include_compare=parse_compare_query(request.query_params.get("compare")),
        )
        return self._qbr_http_response(payload, export_format)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def qbr_client(self, request, slug, project_id):
        period, err = self._parse_period(request)
        if err:
            return Response({"error": err}, status=status.HTTP_400_BAD_REQUEST)

        weeks, weeks_err = parse_qbr_weeks(request.query_params.get("weeks"))
        if weeks_err:
            return Response({"error": weeks_err}, status=status.HTTP_400_BAD_REQUEST)

        export_format, fmt_err = parse_qbr_format(request.query_params.get("export_format"))
        if fmt_err:
            return Response({"error": fmt_err}, status=status.HTTP_400_BAD_REQUEST)

        project = self._accessible_projects(slug).filter(id=project_id).first()
        if not project:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        workspace = Workspace.objects.filter(slug=slug, deleted_at__isnull=True).first()
        if not workspace:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        payload = build_client_qbr_context(
            workspace=workspace,
            project=project,
            period=period,
            weeks=weeks,
            issue_queryset=self._workspace_issues_queryset(slug, [project.id]),
            include_compare=parse_compare_query(request.query_params.get("compare")),
        )
        return self._qbr_http_response(payload, export_format)
