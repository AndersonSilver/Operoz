from __future__ import annotations

import statistics
from collections.abc import Iterable
from datetime import date, timedelta
from typing import Literal

from django.db.models import Count, Q
from django.utils import timezone

from operis.db.models import (
    BoardClient360HealthSettings,
    BoardClient360IntakeType,
    Issue,
    IssueRelation,
    Label,
    Module,
    ModuleIssue,
)
from operis.utils.client_360 import CLOSED_STATE_GROUPS, WeekPeriod

DEFAULT_SUPPORT_SLA_DAYS = 7
DEFAULT_INTAKE_TYPE_PATTERNS = ("intake", "entrada")

RaidCategory = Literal["risk", "assumption", "issue", "dependency"]

RAID_LABEL_PREFIX = "raid:"
RAID_TYPE_PATTERNS: dict[RaidCategory, tuple[str, ...]] = {
    "risk": ("risco", "risk"),
    "assumption": ("assun", "assumption"),
    "issue": ("imped", "issue", "bloqueio"),
    "dependency": ("depend", "dependency"),
}


def load_board_support_sla_map(board_ids: Iterable) -> dict[str, int]:
    ids = list(board_ids)
    if not ids:
        return {}
    rows = BoardClient360HealthSettings.objects.filter(
        board_id__in=ids,
        deleted_at__isnull=True,
    )
    return {str(row.board_id): row.support_sla_days for row in rows}


def resolve_support_sla_days(board_id, sla_map: dict[str, int] | None) -> int:
    if sla_map and board_id is not None:
        return sla_map.get(str(board_id), DEFAULT_SUPPORT_SLA_DAYS)
    return DEFAULT_SUPPORT_SLA_DAYS


def load_intake_types_by_board(board_ids: Iterable) -> dict[str, list[BoardClient360IntakeType]]:
    ids = list(board_ids)
    if not ids:
        return {}
    rows = BoardClient360IntakeType.objects.filter(
        board_id__in=ids,
        is_active=True,
        deleted_at__isnull=True,
    ).order_by("sort_order", "name")
    result: dict[str, list[BoardClient360IntakeType]] = {}
    for row in rows:
        result.setdefault(str(row.board_id), []).append(row)
    return result


def _intake_q_for_board(intake_types: list[BoardClient360IntakeType] | None) -> Q:
    if not intake_types:
        q = Q()
        for pattern in DEFAULT_INTAKE_TYPE_PATTERNS:
            q |= Q(type__name__icontains=pattern)
        return q
    q = Q()
    for row in intake_types:
        pattern = (row.type_name_pattern or row.slug or row.name).strip()
        if pattern:
            q |= Q(type__name__icontains=pattern)
    return q


def aggregate_intake_stats(
    issue_queryset,
    *,
    board_ids: Iterable,
    intake_types_map: dict[str, list[BoardClient360IntakeType]] | None = None,
) -> dict[str, dict[str, int]]:
    pending_filter = ~Q(state__group__in=CLOSED_STATE_GROUPS)
    board_ids = [str(bid) for bid in board_ids]
    if not board_ids:
        return {}

    intake_types_map = intake_types_map or {}
    result: dict[str, dict[str, int]] = {}

    projects_by_board: dict[str, set[str]] = {}
    for row in issue_queryset.values("project_id", "project__board_id").distinct():
        bid = str(row["project__board_id"]) if row["project__board_id"] else None
        pid = str(row["project_id"])
        if bid:
            projects_by_board.setdefault(bid, set()).add(pid)

    for bid in board_ids:
        intake_q = _intake_q_for_board(intake_types_map.get(bid))
        if not intake_q:
            continue
        project_ids = projects_by_board.get(bid, set())
        if not project_ids:
            continue
        rows = (
            issue_queryset.filter(project_id__in=project_ids)
            .filter(pending_filter)
            .filter(intake_q)
            .values("project_id")
            .annotate(pending=Count("pk", distinct=True))
        )
        for row in rows:
            pid = str(row["project_id"])
            result[pid] = {"pending": row["pending"]}

    return result


def aggregate_blocker_stats(issue_queryset, today: date) -> dict[str, dict[str, int]]:
    project_ids = list(issue_queryset.values_list("project_id", flat=True).distinct())
    if not project_ids:
        return {}

    relations = (
        IssueRelation.objects.filter(
            issue__project_id__in=project_ids,
            relation_type="blocked_by",
            deleted_at__isnull=True,
        )
        .filter(~Q(issue__state__group__in=CLOSED_STATE_GROUPS))
        .select_related("issue")
    )

    counts: dict[str, int] = {}
    for rel in relations:
        pid = str(rel.issue.project_id)
        counts[pid] = counts.get(pid, 0) + 1
    return {pid: {"count": count} for pid, count in counts.items()}


def build_blockers_panel(issue_queryset, today: date, *, limit: int = 10) -> list[dict]:
    pending_filter = ~Q(state__group__in=CLOSED_STATE_GROUPS)
    relations = (
        IssueRelation.objects.filter(
            issue__in=issue_queryset.filter(pending_filter),
            relation_type="blocked_by",
            deleted_at__isnull=True,
        )
        .select_related("issue", "related_issue", "issue__state")
        .order_by("created_at")[:limit]
    )
    items = []
    for rel in relations:
        issue = rel.issue
        created = rel.created_at.date() if rel.created_at else today
        items.append(
            {
                "id": str(issue.id),
                "name": issue.name,
                "sequence_id": issue.sequence_id,
                "project_id": str(issue.project_id),
                "blocked_by_id": str(rel.related_issue_id),
                "blocked_by_name": rel.related_issue.name,
                "state__name": issue.state.name if issue.state_id else None,
                "aging_days": max(0, (today - created).days),
            }
        )
    return items


def _raid_category_q(category: RaidCategory) -> Q:
    label_name = f"{RAID_LABEL_PREFIX}{category}"
    q = Q(labels__name__iexact=label_name)
    for pattern in RAID_TYPE_PATTERNS[category]:
        q |= Q(type__name__icontains=pattern)
    return q


def build_raid_log(issue_queryset, *, limit_per_category: int = 20) -> dict[str, list[dict]]:
    pending_filter = ~Q(state__group__in=CLOSED_STATE_GROUPS)
    today = timezone.now().date()
    open_qs = issue_queryset.filter(pending_filter).distinct()
    result: dict[str, list[dict]] = {}
    for category in ("risk", "assumption", "issue", "dependency"):
        rows = (
            open_qs.filter(_raid_category_q(category))
            .select_related("state", "type")
            .order_by("-priority", "target_date")[:limit_per_category]
        )
        items = []
        for issue in rows:
            created = issue.created_at.date() if issue.created_at else today
            items.append(
                {
                    "id": str(issue.id),
                    "name": issue.name,
                    "sequence_id": issue.sequence_id,
                    "priority": issue.priority,
                    "state__name": issue.state.name if issue.state_id else None,
                    "type__name": issue.type.name if issue.type_id else None,
                    "target_date": issue.target_date.isoformat() if issue.target_date else None,
                    "age_days": max(0, (today - created).days),
                    "category": category,
                }
            )
        result[category] = items
    return result


def aggregate_throughput_stats(
    issue_queryset,
    period: WeekPeriod,
) -> dict[str, dict]:
    closed_filter = Q(state__group="completed", completed_at__isnull=False)
    period_filter = Q(
        completed_at__date__gte=period.start,
        completed_at__date__lte=period.end,
    )
    rows = (
        issue_queryset.filter(closed_filter & period_filter)
        .values("project_id")
        .annotate(throughput=Count("pk", distinct=True))
    )
    result: dict[str, dict] = {}
    for row in rows:
        pid = str(row["project_id"])
        result[pid] = {"throughput": row["throughput"], "cycle_time_days_median": None}

    for pid in result:
        issues = issue_queryset.filter(
            project_id=pid,
            state__group="completed",
            completed_at__isnull=False,
            completed_at__date__gte=period.start,
            completed_at__date__lte=period.end,
        ).values_list("created_at", "completed_at")
        deltas = []
        for created_at, completed_at in issues:
            if created_at and completed_at:
                days = (completed_at.date() - created_at.date()).days
                deltas.append(max(0, days))
        if deltas:
            result[pid]["cycle_time_days_median"] = int(statistics.median(deltas))
    return result


def build_throughput_history(
    issue_queryset,
    *,
    anchor_period: WeekPeriod,
    weeks: int = 8,
) -> list[dict]:
    history = []
    start = anchor_period.start
    for offset in range(weeks - 1, -1, -1):
        week_start = start - timedelta(days=7 * offset)
        week_end = week_start + timedelta(days=6)
        period = WeekPeriod(start=week_start, end=week_end)
        stats = aggregate_throughput_stats(issue_queryset, period)
        throughput = sum(row.get("throughput", 0) for row in stats.values())
        history.append(
            {
                "period_start": week_start.isoformat(),
                "period_end": week_end.isoformat(),
                "throughput": throughput,
            }
        )
    return history


def build_milestones(project_id, *, today: date | None = None, horizon_days: int = 90) -> list[dict]:
    today = today or timezone.now().date()
    horizon = today + timedelta(days=horizon_days)
    items: list[dict] = []

    modules = Module.objects.filter(
        project_id=project_id,
        archived_at__isnull=True,
        target_date__isnull=False,
        target_date__lte=horizon,
    ).order_by("target_date")
    for module in modules:
        status = "pending"
        if module.status == "completed":
            status = "done"
        elif module.target_date and module.target_date < today and module.status != "completed":
            status = "overdue"
        items.append(
            {
                "id": str(module.id),
                "kind": "module",
                "name": module.name,
                "target_date": module.target_date.isoformat(),
                "status": status,
            }
        )

    milestone_issues = (
        Issue.objects.filter(
            project_id=project_id,
            archived_at__isnull=True,
            target_date__isnull=False,
            target_date__lte=horizon,
        )
        .filter(Q(type__name__icontains="milestone") | Q(type__name__icontains="marco"))
        .exclude(state__group__in=CLOSED_STATE_GROUPS)
        .select_related("state")
        .order_by("target_date")[:20]
    )
    for issue in milestone_issues:
        status = "pending"
        if issue.state and issue.state.group == "completed":
            status = "done"
        elif issue.target_date and issue.target_date < today:
            status = "overdue"
        items.append(
            {
                "id": str(issue.id),
                "kind": "issue",
                "name": issue.name,
                "sequence_id": issue.sequence_id,
                "target_date": issue.target_date.isoformat(),
                "status": status,
            }
        )

    items.sort(key=lambda row: row["target_date"])
    return items


def aggregate_support_sla_stats(
    issue_queryset,
    today: date,
    *,
    project_board_map: dict[str, str | None],
    sla_map: dict[str, int] | None,
) -> dict[str, dict]:
    del issue_queryset  # sustentação vem do hub IntakeIssue, não do queryset de Issue
    from operis.utils.client_360_support_hub import aggregate_support_sla_from_hub

    return aggregate_support_sla_from_hub(
        project_board_map.keys(),
        today,
        project_board_map=project_board_map,
        sla_map=sla_map,
    )


def apply_operational_enrichment(
    clients: list[dict],
    *,
    issue_queryset,
    period: WeekPeriod,
    today: date,
    board_ids: list,
    project_board_map: dict[str, str | None],
) -> list[dict]:
    if not clients:
        return clients
    sla_map = load_board_support_sla_map(board_ids)
    intake_types_map = load_intake_types_by_board(board_ids)
    intake_map = aggregate_intake_stats(
        issue_queryset,
        board_ids=board_ids,
        intake_types_map=intake_types_map,
    )
    blockers_map = aggregate_blocker_stats(issue_queryset, today)
    throughput_map = aggregate_throughput_stats(issue_queryset, period)
    sla_map_stats = aggregate_support_sla_stats(
        issue_queryset,
        today,
        project_board_map=project_board_map,
        sla_map=sla_map,
    )
    for row in clients:
        pid = row["project_id"]
        enrich_client_row_operational(
            row,
            intake=intake_map.get(pid),
            blockers=blockers_map.get(pid),
            throughput=throughput_map.get(pid),
            support_sla=sla_map_stats.get(pid),
        )
    return clients


def build_detail_operational_payload(
    *,
    project_id,
    issue_queryset,
    period: WeekPeriod,
    today: date,
    board_id,
    module_rows: list[dict],
) -> dict:
    board_ids = [board_id] if board_id else []
    sla_map = load_board_support_sla_map(board_ids)
    intake_types_map = load_intake_types_by_board(board_ids)
    intake_map = aggregate_intake_stats(
        issue_queryset,
        board_ids=board_ids,
        intake_types_map=intake_types_map,
    )
    throughput_map = aggregate_throughput_stats(issue_queryset, period)
    sla_stats = aggregate_support_sla_stats(
        issue_queryset,
        today,
        project_board_map={str(project_id): str(board_id) if board_id else None},
        sla_map=sla_map,
    )
    return {
        "intake": intake_map.get(str(project_id), {"pending": 0}),
        "blockers": {
            "count": aggregate_blocker_stats(issue_queryset, today).get(str(project_id), {}).get("count", 0),
            "items": build_blockers_panel(issue_queryset, today),
        },
        "delivery": {
            **throughput_map.get(str(project_id), {"throughput": 0, "cycle_time_days_median": None}),
            "history": build_throughput_history(issue_queryset, anchor_period=period),
        },
        "raid": build_raid_log(issue_queryset),
        "milestones": build_milestones(project_id, today=today),
        "module_heatmap": build_module_delivery_heatmap(
            str(project_id),
            module_rows=module_rows,
            issue_queryset=issue_queryset,
            intake_stats=None,
            today=today,
        ),
        "support_sla": {
            **sla_stats.get(str(project_id), {"breached": False, "breach_count": 0}),
            "sla_days": resolve_support_sla_days(board_id, sla_map),
        },
    }


def build_module_delivery_heatmap(
    project_id: str,
    *,
    module_rows: list[dict],
    issue_queryset,
    intake_stats: dict | None,
    today: date,
) -> list[dict]:
    pending_filter = ~Q(state__group__in=CLOSED_STATE_GROUPS)
    module_ids = [row["module_id"] for row in module_rows if row.get("module_id")]
    overdue_by_module: dict[str, int] = {}
    intake_by_module: dict[str, int] = {}

    if module_ids:
        links = ModuleIssue.objects.filter(
            module_id__in=module_ids,
            deleted_at__isnull=True,
        ).values("module_id", "issue_id")
        issue_ids = [link["issue_id"] for link in links]
        overdue_issue_ids = set(
            issue_queryset.filter(
                pending_filter,
                id__in=issue_ids,
                target_date__lt=today,
                target_date__isnull=False,
            ).values_list("id", flat=True)
        )
        for link in links:
            mid = str(link["module_id"])
            if link["issue_id"] in overdue_issue_ids:
                overdue_by_module[mid] = overdue_by_module.get(mid, 0) + 1

    metrics = ("report", "overdue", "intake")
    heatmap = []
    for row in module_rows:
        mid = row.get("module_id")
        report_level = "missing"
        if row.get("status") == "published":
            report_level = "complete"
        elif row.get("status") == "draft":
            report_level = "partial"
        elif row.get("status") == "missing":
            report_level = "missing"
        overdue = overdue_by_module.get(str(mid), 0) if mid else 0
        intake = 0
        if mid and intake_stats:
            intake = intake_stats.get(str(mid), 0)
        heatmap.append(
            {
                "module_id": mid,
                "module_name": row.get("module_name"),
                "cells": {
                    "report": report_level,
                    "overdue": overdue,
                    "intake": intake,
                },
            }
        )
    return heatmap


def enrich_client_row_operational(
    row: dict,
    *,
    intake: dict | None = None,
    blockers: dict | None = None,
    throughput: dict | None = None,
    support_sla: dict | None = None,
) -> dict:
    row["intake"] = intake or {"pending": 0}
    row["blockers"] = blockers or {"count": 0}
    row["delivery"] = throughput or {"throughput": 0, "cycle_time_days_median": None}
    row["support_sla"] = support_sla or {"breached": False, "breach_count": 0}
    return row


def serialize_intake_type(row: BoardClient360IntakeType) -> dict:
    return {
        "id": str(row.id),
        "board_id": str(row.board_id),
        "name": row.name,
        "slug": row.slug,
        "type_name_pattern": row.type_name_pattern,
        "is_active": row.is_active,
        "sort_order": row.sort_order,
    }
