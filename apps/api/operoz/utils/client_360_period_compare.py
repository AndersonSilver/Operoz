from __future__ import annotations

from datetime import date

from operoz.db.models import Project
from operoz.utils.client_360 import (
    ReportCoverage,
    WeekPeriod,
    aggregate_client360_issue_stats,
    aggregate_module_counts,
    aggregate_status_reports,
    build_client_row,
)
from operoz.utils.client_360_operational import load_board_support_sla_map
from operoz.utils.client_360_health_alerts import build_client360_list_summary
from operoz.utils.client_360_health_history import week_period_before

REPORT_COVERAGE_RANK: dict[ReportCoverage, int] = {
    "missing": 0,
    "partial": 1,
    "complete": 2,
    "n_a": 3,
}

SUMMARY_DELTA_KEYS = (
    "health_critical",
    "health_warning",
    "report_missing",
    "total_overdue",
    "total_support_open",
    "health_score_alert",
)


def parse_compare_query(raw: str | None) -> bool:
    if raw is None or raw == "":
        return False
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def reference_date_for_period(period: WeekPeriod, today: date) -> date:
    return min(today, period.end)


def report_coverage_delta(current: ReportCoverage, previous: ReportCoverage) -> int:
    return REPORT_COVERAGE_RANK[current] - REPORT_COVERAGE_RANK[previous]


def compute_summary_delta(current: dict, previous: dict) -> dict[str, int]:
    return {key: current.get(key, 0) - previous.get(key, 0) for key in SUMMARY_DELTA_KEYS}


def build_client_period_compare(current: dict, previous: dict | None) -> dict:
    if previous is None:
        return {"available": False}

    current_coverage = current["status_report"]["coverage"]
    previous_coverage = previous["status_report"]["coverage"]

    return {
        "available": True,
        "overdue_delta": current["issues"]["overdue"] - previous["issues"]["overdue"],
        "health_score_delta": current["health_score"] - previous["health_score"],
        "report_coverage_delta": report_coverage_delta(current_coverage, previous_coverage),
        "support_open_delta": current["support"]["open_count"] - previous["support"]["open_count"],
        "previous_report_coverage": previous_coverage,
    }


def build_clients_for_period(
    projects: list[Project],
    *,
    period: WeekPeriod,
    reference_date: date,
    issue_queryset,
    include_board: bool,
    health_config_map: dict,
    alert_threshold_map: dict,
    module_counts: dict[str, int] | None = None,
) -> list[dict]:
    project_ids = [project.id for project in projects]
    counts = module_counts if module_counts is not None else aggregate_module_counts(project_ids)
    board_ids = list({project.board_id for project in projects if project.board_id})
    project_board_map = {str(project.id): str(project.board_id) if project.board_id else None for project in projects}
    issue_stats_map = aggregate_client360_issue_stats(
        issue_queryset,
        reference_date,
        project_ids=project_ids,
        project_board_map=project_board_map,
        sla_map=load_board_support_sla_map(board_ids),
    )
    report_stats_map = aggregate_status_reports(project_ids, period)

    clients: list[dict] = []
    for project in projects:
        board = getattr(project, "board", None)
        board_id = str(project.board_id) if project.board_id else None
        clients.append(
            build_client_row(
                project,
                period=period,
                modules_total=counts.get(str(project.id), 0),
                issue_stats=issue_stats_map.get(str(project.id)),
                report_stats=report_stats_map.get(str(project.id)),
                board=board if include_board else None,
                health_config=health_config_map.get(board_id) if board_id else None,
                score_alert_threshold=alert_threshold_map.get(board_id) if board_id else None,
            )
        )
    return clients


def attach_period_compare(
    *,
    clients: list[dict],
    summary: dict,
    projects: list[Project],
    current_period: WeekPeriod,
    issue_queryset,
    today: date,
    include_board: bool,
    health_config_map: dict,
    alert_threshold_map: dict,
    module_counts: dict[str, int],
) -> dict:
    previous_period = week_period_before(current_period)
    previous_reference = reference_date_for_period(previous_period, today)

    previous_clients = build_clients_for_period(
        projects,
        period=previous_period,
        reference_date=previous_reference,
        issue_queryset=issue_queryset,
        include_board=include_board,
        health_config_map=health_config_map,
        alert_threshold_map=alert_threshold_map,
        module_counts=module_counts,
    )
    previous_by_id = {row["project_id"]: row for row in previous_clients}
    previous_summary = build_client360_list_summary(previous_clients)

    for client in clients:
        client["period_compare"] = build_client_period_compare(
            client,
            previous_by_id.get(client["project_id"]),
        )

    return {
        "available": True,
        "previous_period_start": previous_period.start.isoformat(),
        "previous_period_end": previous_period.end.isoformat(),
        "summary_delta": compute_summary_delta(summary, previous_summary),
    }
