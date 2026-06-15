from __future__ import annotations

from datetime import date

from operis.db.models import BoardStatusReport, Module, Project
from operis.utils.client_360 import (
    ReportCoverage,
    WeekPeriod,
    compute_report_coverage,
)
from operis.utils.client_360_health_history import (
    parse_health_history_weeks,
    week_period_before,
)

CLIENT_360_MATRIX_SCHEMA_VERSION = 1
DEFAULT_MATRIX_PAGE_SIZE = 50
MAX_MATRIX_PAGE_SIZE = 100


def parse_matrix_pagination(
    raw_page: str | None,
    raw_page_size: str | None,
) -> tuple[int, int, str | None]:
    try:
        page = int(raw_page) if raw_page not in (None, "") else 1
    except (TypeError, ValueError):
        return 1, DEFAULT_MATRIX_PAGE_SIZE, "page must be a positive integer"
    try:
        page_size = int(raw_page_size) if raw_page_size not in (None, "") else DEFAULT_MATRIX_PAGE_SIZE
    except (TypeError, ValueError):
        return 1, DEFAULT_MATRIX_PAGE_SIZE, "page_size must be a positive integer"
    if page < 1:
        return 1, DEFAULT_MATRIX_PAGE_SIZE, "page must be >= 1"
    if page_size < 1 or page_size > MAX_MATRIX_PAGE_SIZE:
        return 1, DEFAULT_MATRIX_PAGE_SIZE, f"page_size must be between 1 and {MAX_MATRIX_PAGE_SIZE}"
    return page, page_size, None


def week_periods_ending_at(reference: WeekPeriod, count: int) -> list[WeekPeriod]:
    periods = [reference]
    cursor = reference
    for _ in range(count - 1):
        cursor = week_period_before(cursor)
        periods.append(cursor)
    periods.reverse()
    return periods


def _empty_report_bucket() -> dict:
    return {
        "published_module_ids": set(),
        "draft_module_ids": set(),
        "has_project_level_published": False,
    }


def aggregate_status_reports_matrix(
    project_ids: list,
    periods: list[WeekPeriod],
) -> dict[tuple[str, date], dict]:
    """
    (project_id, period_start) -> report stats compatible with :func:`compute_report_coverage`.
    """
    if not project_ids or not periods:
        return {}

    period_starts = {period.start for period in periods}
    period_end_by_start = {period.start: period.end for period in periods}

    reports = BoardStatusReport.objects.filter(
        project_id__in=project_ids,
        period_start__in=period_starts,
        deleted_at__isnull=True,
    ).values("id", "project_id", "module_id", "published_at", "period_start", "period_end")

    by_key: dict[tuple[str, date], dict] = {}
    for row in reports:
        period_start = row["period_start"]
        if period_start not in period_starts:
            continue
        expected_end = period_end_by_start.get(period_start)
        if expected_end is not None and row["period_end"] != expected_end:
            continue

        pid = str(row["project_id"])
        key = (pid, period_start)
        bucket = by_key.setdefault(key, _empty_report_bucket())

        is_published = row["published_at"] is not None
        module_id = row["module_id"]
        if is_published:
            if module_id:
                bucket["published_module_ids"].add(str(module_id))
            else:
                bucket["has_project_level_published"] = True
        elif module_id:
            mid = str(module_id)
            if mid not in bucket["published_module_ids"]:
                bucket["draft_module_ids"].add(mid)

    result: dict[tuple[str, date], dict] = {}
    for key, bucket in by_key.items():
        published = bucket["published_module_ids"]
        draft_only = bucket["draft_module_ids"] - published
        result[key] = {
            "modules_published": len(published),
            "modules_draft_only": len(draft_only),
            "has_project_level_published": bucket["has_project_level_published"],
        }
    return result


def _module_breakdown_for_period(
    modules: list[Module],
    reports: list[dict],
) -> list[dict]:
    reports_by_module: dict[str | None, dict] = {}
    for row in reports:
        key = str(row["module_id"]) if row.get("module_id") else None
        existing = reports_by_module.get(key)
        if existing is None:
            reports_by_module[key] = row
            continue
        if row.get("published_at") and not existing.get("published_at"):
            reports_by_module[key] = row

    rows: list[dict] = []
    for module in modules:
        report = reports_by_module.get(str(module.id))
        if report:
            status = "published" if report.get("published_at") else "draft"
        else:
            status = "missing"
        rows.append(
            {
                "module_id": str(module.id),
                "module_name": module.name,
                "status": status,
            }
        )
    return rows


def build_matrix_cell(
    *,
    period: WeekPeriod,
    modules_total: int,
    report_stats: dict | None,
    modules: list[Module] | None = None,
    raw_reports: list[dict] | None = None,
) -> dict:
    rs = report_stats or {}
    modules_published = rs.get("modules_published", 0)
    modules_draft_only = rs.get("modules_draft_only", 0)
    has_project_level_published = rs.get("has_project_level_published", False)

    coverage: ReportCoverage = compute_report_coverage(
        modules_total,
        modules_published,
        modules_draft_only,
        has_project_level_published,
    )

    cell = {
        "period_start": period.start.isoformat(),
        "period_end": period.end.isoformat(),
        "coverage": coverage,
        "modules_total": modules_total,
        "modules_published": modules_published,
        "modules_draft": modules_draft_only,
    }

    if coverage == "partial" and modules and raw_reports is not None:
        cell["module_breakdown"] = _module_breakdown_for_period(modules, raw_reports)
    else:
        cell["module_breakdown"] = None

    return cell


def load_modules_by_project(project_ids: list) -> dict[str, list[Module]]:
    if not project_ids:
        return {}
    modules = Module.objects.filter(project_id__in=project_ids, archived_at__isnull=True).order_by("name")
    grouped: dict[str, list[Module]] = {}
    for module in modules:
        grouped.setdefault(str(module.project_id), []).append(module)
    return grouped


def load_raw_reports_matrix(
    project_ids: list,
    periods: list[WeekPeriod],
) -> dict[tuple[str, date], list[dict]]:
    if not project_ids or not periods:
        return {}

    period_starts = {period.start for period in periods}
    period_end_by_start = {period.start: period.end for period in periods}

    rows = BoardStatusReport.objects.filter(
        project_id__in=project_ids,
        period_start__in=period_starts,
        deleted_at__isnull=True,
    ).values("project_id", "module_id", "published_at", "period_start", "period_end")

    grouped: dict[tuple[str, date], list[dict]] = {}
    for row in rows:
        period_start = row["period_start"]
        if period_start not in period_starts:
            continue
        expected_end = period_end_by_start.get(period_start)
        if expected_end is not None and row["period_end"] != expected_end:
            continue
        key = (str(row["project_id"]), period_start)
        grouped.setdefault(key, []).append(row)
    return grouped


def build_client360_matrix_payload(
    projects: list[Project],
    *,
    anchor_period: WeekPeriod,
    weeks: int,
    module_counts: dict[str, int],
    page: int,
    page_size: int,
    include_board: bool = True,
) -> dict:
    periods = week_periods_ending_at(anchor_period, weeks)
    total = len(projects)
    start_index = (page - 1) * page_size
    end_index = start_index + page_size
    page_projects = projects[start_index:end_index]
    page_ids = [project.id for project in page_projects]

    report_stats_map = aggregate_status_reports_matrix(page_ids, periods)
    modules_by_project = load_modules_by_project(page_ids)
    raw_reports_map = load_raw_reports_matrix(page_ids, periods)

    clients: list[dict] = []
    for project in page_projects:
        pid = str(project.id)
        modules_total = module_counts.get(pid, 0)
        modules = modules_by_project.get(pid, [])

        cells = []
        for period in periods:
            key = (pid, period.start)
            cells.append(
                build_matrix_cell(
                    period=period,
                    modules_total=modules_total,
                    report_stats=report_stats_map.get(key),
                    modules=modules,
                    raw_reports=raw_reports_map.get(key, []),
                )
            )

        row: dict = {
            "project_id": pid,
            "name": project.name,
            "identifier": project.identifier,
            "cells": cells,
        }
        board = getattr(project, "board", None)
        if include_board and board is not None:
            row["board"] = {
                "id": str(board.id),
                "slug": board.slug,
                "name": board.name,
            }
        clients.append(row)

    return {
        "schema_version": CLIENT_360_MATRIX_SCHEMA_VERSION,
        "weeks_requested": weeks,
        "anchor_period_start": anchor_period.start.isoformat(),
        "anchor_period_end": anchor_period.end.isoformat(),
        "weeks": [
            {"period_start": period.start.isoformat(), "period_end": period.end.isoformat()}
            for period in periods
        ],
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": max(1, (total + page_size - 1) // page_size) if total else 1,
        },
        "clients": clients,
    }


def parse_matrix_weeks(raw: str | None) -> tuple[int, str | None]:
    return parse_health_history_weeks(raw)
