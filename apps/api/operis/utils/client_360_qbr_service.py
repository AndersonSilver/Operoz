from __future__ import annotations

from datetime import date

from django.db.models import Q
from django.utils import timezone

from operis.db.models import BoardStatusReport, Issue, Module, Project, Workspace
from operis.utils.client_360 import (
    aggregate_client360_issue_stats,
    aggregate_module_counts,
    aggregate_status_reports,
    build_client_row,
    build_module_report_rows,
    parse_week_period,
    CLOSED_STATE_GROUPS,
)
from operis.utils.client_360_operational import load_board_support_sla_map
from operis.utils.client_360_support_hub import list_support_hub_issues
from operis.utils.client_360_health_alerts import build_client360_list_summary
from operis.utils.client_360_health_history import build_health_history_payload
from operis.utils.client_360_health_settings import (
    load_board_health_config_map,
    load_board_score_alert_threshold_map,
)
from operis.utils.client_360_matrix import build_client360_matrix_payload
from operis.utils.client_360_period_compare import attach_period_compare
from operis.utils.client_360_qbr_export import QbrBuildInput, build_qbr_payload

def build_workspace_portfolio_qbr_context(
    *,
    workspace: Workspace,
    projects: list[Project],
    period,
    weeks: int,
    issue_queryset,
    include_compare: bool,
) -> dict:
    today = timezone.now().date()
    project_ids = [project.id for project in projects]
    module_counts = aggregate_module_counts(project_ids)
    board_ids = list({project.board_id for project in projects if project.board_id})
    project_board_map = {str(project.id): str(project.board_id) if project.board_id else None for project in projects}
    issue_stats_map = aggregate_client360_issue_stats(
        issue_queryset,
        today,
        project_ids=project_ids,
        project_board_map=project_board_map,
        sla_map=load_board_support_sla_map(board_ids),
    )
    health_config_map = load_board_health_config_map(board_ids)
    alert_threshold_map = load_board_score_alert_threshold_map(board_ids)

    clients = [
        build_client_row(
            project,
            period=period,
            modules_total=module_counts.get(str(project.id), 0),
            issue_stats=issue_stats_map.get(str(project.id)),
            report_stats=aggregate_status_reports(project_ids, period).get(str(project.id)),
            board=project.board,
            health_config=health_config_map.get(str(project.board_id)) if project.board_id else None,
            score_alert_threshold=alert_threshold_map.get(str(project.board_id)) if project.board_id else None,
        )
        for project in projects
    ]
    summary = build_client360_list_summary(clients)

    period_compare = None
    if include_compare and clients:
        period_compare = attach_period_compare(
            clients=clients,
            summary=summary,
            projects=projects,
            current_period=period,
            issue_queryset=issue_queryset,
            today=today,
            include_board=True,
            health_config_map=health_config_map,
            alert_threshold_map=alert_threshold_map,
            module_counts=module_counts,
        )

    matrix_payload = build_client360_matrix_payload(
        projects,
        anchor_period=period,
        weeks=weeks,
        module_counts=module_counts,
        page=1,
        page_size=max(len(projects), 1),
        include_board=True,
    )

    matrix_cells = []
    for client in matrix_payload.get("clients", []):
        matrix_cells.extend(client.get("cells") or [])

    chart_warnings = []
    if weeks == 13 and len(matrix_payload.get("weeks") or []) < 13:
        chart_warnings.append("Matriz trimestral incompleta — menos de 13 semanas disponíveis.")

    return build_qbr_payload(
        QbrBuildInput(
            scope="portfolio",
            workspace_name=workspace.name,
            period=period,
            weeks_requested=weeks,
            summary=summary,
            period_compare=period_compare,
            clients=clients,
            chart_warnings=chart_warnings,
            matrix_weeks=matrix_payload.get("weeks"),
            matrix_cells=matrix_cells,
        )
    )


def build_client_qbr_context(
    *,
    workspace: Workspace,
    project: Project,
    period,
    weeks: int,
    issue_queryset,
    include_compare: bool,
) -> dict:
    today = timezone.now().date()
    pid = project.id
    project_board_map = {str(pid): str(project.board_id) if project.board_id else None}
    board_ids = [project.board_id] if project.board_id else []
    issue_stats_map = aggregate_client360_issue_stats(
        issue_queryset.filter(project_id=pid),
        today,
        project_ids=[pid],
        project_board_map=project_board_map,
        sla_map=load_board_support_sla_map(board_ids),
    )
    module_counts = aggregate_module_counts([pid])
    report_stats_map = aggregate_status_reports([pid], period)
    health_config_map = (
        load_board_health_config_map([project.board_id]) if project.board_id else {}
    )
    alert_threshold_map = (
        load_board_score_alert_threshold_map([project.board_id]) if project.board_id else {}
    )

    client = build_client_row(
        project,
        period=period,
        modules_total=module_counts.get(str(pid), 0),
        issue_stats=issue_stats_map.get(str(pid)),
        report_stats=report_stats_map.get(str(pid)),
        board=project.board,
        health_config=health_config_map.get(str(project.board_id)) if project.board_id else None,
        score_alert_threshold=alert_threshold_map.get(str(project.board_id)) if project.board_id else None,
    )

    clients = [client]
    summary = build_client360_list_summary(clients)

    period_compare = None
    if include_compare:
        period_compare = attach_period_compare(
            clients=clients,
            summary=summary,
            projects=[project],
            current_period=period,
            issue_queryset=issue_queryset,
            today=today,
            include_board=True,
            health_config_map=health_config_map,
            alert_threshold_map=alert_threshold_map or {},
            module_counts=module_counts,
        )

    history_payload = build_health_history_payload(
        project,
        weeks=weeks,
        issue_queryset=issue_queryset,
    )
    health_history = history_payload.get("history") or []
    chart_warnings = []
    if history_payload.get("limitation"):
        chart_warnings.append(str(history_payload["limitation"]))

    modules = list(Module.objects.filter(project_id=pid, archived_at__isnull=True).order_by("name"))
    reports: dict[str | None, BoardStatusReport] = {}
    for report in BoardStatusReport.objects.filter(
        project_id=pid,
        period_start=period.start,
        period_end=period.end,
        deleted_at__isnull=True,
    ):
        key = str(report.module_id) if report.module_id else None
        existing = reports.get(key)
        if existing is None or (report.published_at and not existing.published_at):
            reports[key] = report
    module_rows = build_module_report_rows(str(pid), period, modules, reports)

    pending_filter = ~Q(state__group__in=CLOSED_STATE_GROUPS)
    overdue_issues = list(
        issue_queryset.filter(project_id=pid)
        .filter(pending_filter)
        .filter(target_date__lt=today, target_date__isnull=False)
        .order_by("target_date")[:15]
        .values("id", "name", "sequence_id", "target_date", "priority", "state__name")
    )
    support_issues = list_support_hub_issues(pid)

    client_detail = {
        **client,
        "modules": module_rows,
        "overdue_issues": overdue_issues,
        "support_issues": support_issues,
    }

    from operis.db.models import Client360Narrative
    from operis.utils.client_360_narrative import serialize_narrative

    narrative_row = Client360Narrative.objects.filter(project=project, period_start=period.start).first()
    narrative = serialize_narrative(narrative_row)

    matrix_payload = build_client360_matrix_payload(
        [project],
        anchor_period=period,
        weeks=weeks,
        module_counts=module_counts,
        page=1,
        page_size=1,
        include_board=True,
    )
    matrix_cells = []
    for row in matrix_payload.get("clients", []):
        matrix_cells.extend(row.get("cells") or [])

    return build_qbr_payload(
        QbrBuildInput(
            scope="client",
            workspace_name=workspace.name,
            period=period,
            weeks_requested=weeks,
            summary=summary,
            period_compare=period_compare,
            clients=clients,
            chart_warnings=chart_warnings,
            client_detail=client_detail,
            health_history=health_history,
            matrix_weeks=matrix_payload.get("weeks"),
            matrix_cells=matrix_cells,
            narrative=narrative if any([narrative.get("wins_md"), narrative.get("risks_md"), narrative.get("next_steps_md")]) else None,
        )
    )
