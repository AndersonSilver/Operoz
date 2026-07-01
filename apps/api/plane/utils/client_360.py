# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Literal

from django.db.models import Count, Q
from django.utils import timezone

from plane.db.models import BoardStatusReport, Issue, Module, Project
from plane.utils.status_report_export import user_consultor_label

CLOSED_STATE_GROUPS = ("completed", "cancelled")
SUPPORT_TYPE_NAME_Q = Q(type__name__icontains="sustent") | Q(type__name__icontains="chamado")

HealthLevel = Literal["ok", "warning", "critical"]
ReportCoverage = Literal["complete", "partial", "missing", "n_a"]


@dataclass(frozen=True)
class WeekPeriod:
    start: date
    end: date


def current_week_period(today: date | None = None) -> WeekPeriod:
    today = today or timezone.now().date()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)
    return WeekPeriod(start=week_start, end=week_end)


def parse_week_period(period_start: date | None, period_end: date | None) -> WeekPeriod:
    if period_start and period_end:
        if period_end < period_start:
            raise ValueError("period_end must be on or after period_start")
        return WeekPeriod(start=period_start, end=period_end)
    return current_week_period()


def compute_report_coverage(
    modules_total: int,
    modules_published: int,
    modules_draft_only: int,
    has_project_level_published: bool,
) -> ReportCoverage:
    if modules_total == 0:
        if has_project_level_published:
            return "complete"
        return "n_a"
    if modules_published >= modules_total:
        return "complete"
    if modules_published > 0 or modules_draft_only > 0 or has_project_level_published:
        return "partial"
    return "missing"


def project_lead_payload(project: Project) -> dict | None:
    lead = getattr(project, "project_lead", None)
    if lead is None:
        return None
    return {"id": str(lead.id), "display_name": user_consultor_label(lead)}


def compute_health(
    *,
    report_coverage: ReportCoverage,
    overdue_issues: int,
    support_open: int,
    support_overdue: int,
) -> HealthLevel:
    if report_coverage == "missing" or overdue_issues >= 5 or support_overdue > 0:
        return "critical"
    if overdue_issues > 0 or report_coverage == "partial" or support_open > 0:
        return "warning"
    return "ok"


def aggregate_issue_stats(issue_queryset, today: date) -> dict[str, dict[str, int]]:
    """project_id (str) -> {total, pending, overdue, support_open, support_overdue}."""
    pending_filter = ~Q(state__group__in=CLOSED_STATE_GROUPS)
    overdue_filter = pending_filter & Q(target_date__lt=today, target_date__isnull=False)
    support_open_filter = pending_filter & SUPPORT_TYPE_NAME_Q
    support_overdue_filter = support_open_filter & Q(target_date__lt=today, target_date__isnull=False)

    rows = (
        issue_queryset.values("project_id")
        .annotate(
            total=Count("pk", distinct=True),
            pending=Count("pk", filter=pending_filter, distinct=True),
            overdue=Count("pk", filter=overdue_filter, distinct=True),
            support_open=Count("pk", filter=support_open_filter, distinct=True),
            support_overdue=Count("pk", filter=support_overdue_filter, distinct=True),
        )
    )
    return {
        str(row["project_id"]): {
            "total": row["total"],
            "pending": row["pending"],
            "overdue": row["overdue"],
            "support_open": row["support_open"],
            "support_overdue": row["support_overdue"],
        }
        for row in rows
    }


def aggregate_module_counts(project_ids: list) -> dict[str, int]:
    if not project_ids:
        return {}
    rows = (
        Module.objects.filter(project_id__in=project_ids, archived_at__isnull=True)
        .values("project_id")
        .annotate(modules_total=Count("pk", distinct=True))
    )
    return {str(row["project_id"]): row["modules_total"] for row in rows}


def aggregate_status_reports(
    project_ids: list,
    period: WeekPeriod,
) -> dict[str, dict]:
    """
    project_id -> {
        modules_published, modules_draft_only, has_project_level_published,
        latest_published_at, latest_report_id
    }
    """
    if not project_ids:
        return {}

    reports = BoardStatusReport.objects.filter(
        project_id__in=project_ids,
        period_start=period.start,
        period_end=period.end,
        deleted_at__isnull=True,
    ).values("id", "project_id", "module_id", "published_at")

    by_project: dict[str, dict] = {}
    for row in reports:
        pid = str(row["project_id"])
        bucket = by_project.setdefault(
            pid,
            {
                "published_module_ids": set(),
                "draft_module_ids": set(),
                "has_project_level_published": False,
                "latest_published_at": None,
                "latest_report_id": None,
            },
        )
        is_published = row["published_at"] is not None
        module_id = row["module_id"]

        if is_published:
            published_at = row["published_at"]
            if bucket["latest_published_at"] is None or published_at > bucket["latest_published_at"]:
                bucket["latest_published_at"] = published_at
                bucket["latest_report_id"] = str(row["id"])
            if module_id:
                bucket["published_module_ids"].add(str(module_id))
            else:
                bucket["has_project_level_published"] = True
        elif module_id:
            mid = str(module_id)
            if mid not in bucket["published_module_ids"]:
                bucket["draft_module_ids"].add(mid)

    result: dict[str, dict] = {}
    for pid, bucket in by_project.items():
        published = bucket["published_module_ids"]
        draft_only = bucket["draft_module_ids"] - published
        result[pid] = {
            "modules_published": len(published),
            "modules_draft_only": len(draft_only),
            "has_project_level_published": bucket["has_project_level_published"],
            "latest_published_at": bucket["latest_published_at"],
            "latest_report_id": bucket["latest_report_id"],
        }
    return result


def build_client_row(
    project: Project,
    *,
    period: WeekPeriod,
    modules_total: int,
    issue_stats: dict[str, int],
    report_stats: dict | None,
) -> dict:
    pid = str(project.id)
    issues = issue_stats or {
        "total": 0,
        "pending": 0,
        "overdue": 0,
        "support_open": 0,
        "support_overdue": 0,
    }
    rs = report_stats or {}
    modules_published = rs.get("modules_published", 0)
    modules_draft_only = rs.get("modules_draft_only", 0)
    has_project_level_published = rs.get("has_project_level_published", False)

    report_coverage = compute_report_coverage(
        modules_total,
        modules_published,
        modules_draft_only,
        has_project_level_published,
    )
    health = compute_health(
        report_coverage=report_coverage,
        overdue_issues=issues["overdue"],
        support_open=issues["support_open"],
        support_overdue=issues["support_overdue"],
    )

    return {
        "project_id": pid,
        "name": project.name,
        "identifier": project.identifier,
        "logo_props": project.logo_props,
        "responsible_stakeholder": (project.responsible_stakeholder or "").strip(),
        "project_lead": project_lead_payload(project),
        "issues": {
            "total": issues["total"],
            "pending": issues["pending"],
            "overdue": issues["overdue"],
        },
        "support": {
            "open_count": issues["support_open"],
            "overdue_count": issues["support_overdue"],
        },
        "status_report": {
            "period_start": period.start.isoformat(),
            "period_end": period.end.isoformat(),
            "coverage": report_coverage,
            "modules_total": modules_total,
            "modules_published": modules_published,
            "modules_draft": modules_draft_only,
            "latest_report_id": rs.get("latest_report_id"),
            "latest_published_at": (
                rs["latest_published_at"].isoformat() if rs.get("latest_published_at") else None
            ),
        },
        "health": health,
    }


def build_module_report_rows(
    project_id: str,
    period: WeekPeriod,
    modules: list[Module],
    reports_by_module: dict[str | None, BoardStatusReport],
) -> list[dict]:
    rows = []
    for module in modules:
        report = reports_by_module.get(str(module.id))
        if report:
            status = "published" if report.published_at else "draft"
            report_id = str(report.id)
            published_at = report.published_at.isoformat() if report.published_at else None
        else:
            status = "missing"
            report_id = None
            published_at = None
        rows.append(
            {
                "module_id": str(module.id),
                "module_name": module.name,
                "status": status,
                "report_id": report_id,
                "published_at": published_at,
            }
        )
    project_report = reports_by_module.get(None)
    if project_report:
        rows.insert(
            0,
            {
                "module_id": None,
                "module_name": None,
                "status": "published" if project_report.published_at else "draft",
                "report_id": str(project_report.id),
                "published_at": (
                    project_report.published_at.isoformat() if project_report.published_at else None
                ),
            },
        )
    return rows
