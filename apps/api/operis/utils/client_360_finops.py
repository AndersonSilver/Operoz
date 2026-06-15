from __future__ import annotations

import csv
import io
from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal
from typing import Any

from django.db.models import Count, Q, Sum
from django.utils import timezone

from operis.db.models import (
    Client360ConsultantAllocation,
    Client360HarnessCostLineItem,
    Client360ProjectFinopsProfile,
    Issue,
    WorkspaceClient360FinopsSettings,
)
from operis.utils.client_360 import CLOSED_STATE_GROUPS, WeekPeriod

DEFAULT_CAPACITY_HOURS = Decimal("160")
DEFAULT_SQUAD_WEEKLY_CAPACITY = 40
DEFAULT_VARIANCE_ALERT_PCT = 10
DEFAULT_MARGIN_ALERT_PCT = 15


def month_start(d: date | None = None) -> date:
    today = d or timezone.now().date()
    return today.replace(day=1)


def load_finops_settings(workspace_id) -> dict:
    if not workspace_id:
        return {
            "variance_alert_pct": DEFAULT_VARIANCE_ALERT_PCT,
            "margin_alert_pct": DEFAULT_MARGIN_ALERT_PCT,
            "squad_weekly_capacity_hours": DEFAULT_SQUAD_WEEKLY_CAPACITY,
            "is_custom": False,
        }
    row = WorkspaceClient360FinopsSettings.objects.filter(
        workspace_id=workspace_id,
        deleted_at__isnull=True,
    ).first()
    if not row:
        return {
            "variance_alert_pct": DEFAULT_VARIANCE_ALERT_PCT,
            "margin_alert_pct": DEFAULT_MARGIN_ALERT_PCT,
            "squad_weekly_capacity_hours": DEFAULT_SQUAD_WEEKLY_CAPACITY,
            "is_custom": False,
        }
    return {
        "variance_alert_pct": row.variance_alert_pct,
        "margin_alert_pct": row.margin_alert_pct,
        "squad_weekly_capacity_hours": row.squad_weekly_capacity_hours,
        "is_custom": True,
    }


def load_finops_profiles(project_ids: list, period_month: date) -> dict[str, Client360ProjectFinopsProfile]:
    if not project_ids:
        return {}
    rows = Client360ProjectFinopsProfile.objects.filter(
        project_id__in=project_ids,
        period_month=period_month,
        deleted_at__isnull=True,
    )
    return {str(row.project_id): row for row in rows}


def _decimal(value) -> Decimal | None:
    if value is None:
        return None
    return Decimal(str(value))


def compute_utilization_pct(hours_allocated, capacity_hours) -> float | None:
    cap = _decimal(capacity_hours)
    hrs = _decimal(hours_allocated)
    if cap is None or cap <= 0 or hrs is None:
        return None
    return round(float(hrs / cap * 100), 1)


def compute_variance_pct(budget_planned, budget_actual) -> float | None:
    planned = _decimal(budget_planned)
    actual = _decimal(budget_actual)
    if planned is None or planned <= 0 or actual is None:
        return None
    return round(float((actual - planned) / planned * 100), 1)


def compute_margin_pct(revenue_contract, delivery_cost) -> float | None:
    revenue = _decimal(revenue_contract)
    cost = _decimal(delivery_cost)
    if revenue is None or revenue <= 0 or cost is None:
        return None
    return round(float((revenue - cost) / revenue * 100), 1)


def resolve_delivery_cost(profile: Client360ProjectFinopsProfile | None) -> Decimal | None:
    if profile is None:
        return None
    if profile.budget_actual is not None:
        return profile.budget_actual
    if profile.harness_cost_mtd is not None:
        return profile.harness_cost_mtd
    return None


def serialize_finops_list_fields(
    profile: Client360ProjectFinopsProfile | None,
    *,
    settings: dict,
) -> dict:
    if profile is None:
        return {
            "utilization": None,
            "harness_cost_mtd": None,
            "budget_variance_pct": None,
            "margin_pct": None,
            "finops_alert": False,
        }
    utilization_pct = compute_utilization_pct(profile.hours_allocated, profile.capacity_hours)
    variance_pct = compute_variance_pct(profile.budget_planned, profile.budget_actual)
    delivery_cost = resolve_delivery_cost(profile)
    margin_pct = compute_margin_pct(profile.revenue_contract, delivery_cost)
    finops_alert = False
    if variance_pct is not None and abs(variance_pct) > settings["variance_alert_pct"]:
        finops_alert = True
    if margin_pct is not None and margin_pct < settings["margin_alert_pct"]:
        finops_alert = True
    if utilization_pct is not None and utilization_pct > 100:
        finops_alert = True
    return {
        "utilization": {
            "hours_allocated": float(profile.hours_allocated),
            "capacity_hours": float(profile.capacity_hours),
            "pct": utilization_pct,
            "over_allocated": utilization_pct is not None and utilization_pct > 100,
        }
        if profile.hours_allocated or profile.capacity_hours
        else None,
        "harness_cost_mtd": float(profile.harness_cost_mtd) if profile.harness_cost_mtd is not None else None,
        "harness_last_sync_at": profile.harness_last_sync_at.isoformat() if profile.harness_last_sync_at else None,
        "budget_planned": float(profile.budget_planned) if profile.budget_planned is not None else None,
        "budget_actual": float(profile.budget_actual) if profile.budget_actual is not None else None,
        "budget_variance_pct": variance_pct,
        "revenue_contract": float(profile.revenue_contract) if profile.revenue_contract is not None else None,
        "margin_pct": margin_pct,
        "finops_alert": finops_alert,
    }


def aggregate_backlog_points(issue_queryset, project_id: str) -> int:
    pending_filter = ~Q(state__group__in=CLOSED_STATE_GROUPS)
    rows = (
        issue_queryset.filter(project_id=project_id)
        .filter(pending_filter)
        .aggregate(total=Sum("point"), count=Count("pk"))
    )
    total = rows.get("total") or 0
    if total:
        return int(total)
    return int(rows.get("count") or 0)


def compute_burn_rate(issue_queryset, project_id: str, period: WeekPeriod, weeks: int = 8) -> float:
    closed_filter = Q(state__group__in=CLOSED_STATE_GROUPS)
    anchor_end = period.end
    rates: list[float] = []
    for i in range(weeks):
        w_end = anchor_end - timedelta(days=7 * i)
        w_start = w_end - timedelta(days=6)
        done = (
            issue_queryset.filter(project_id=project_id)
            .filter(closed_filter)
            .filter(updated_at__date__gte=w_start, updated_at__date__lte=w_end)
            .aggregate(points=Sum("point"), count=Count("pk"))
        )
        points = done.get("points") or done.get("count") or 0
        rates.append(float(points))
    positive = [r for r in rates if r > 0]
    if not positive:
        return 0.0
    return round(sum(positive) / len(positive), 2)


def compute_forecast(backlog_points: int, burn_rate: float) -> dict:
    if backlog_points <= 0:
        return {"weeks": 0, "status": "empty", "optimistic_weeks": None, "pessimistic_weeks": None}
    if burn_rate <= 0:
        return {"weeks": None, "status": "indeterminate", "optimistic_weeks": None, "pessimistic_weeks": None}
    weeks = round(backlog_points / burn_rate, 1)
    return {
        "weeks": weeks,
        "status": "ok",
        "optimistic_weeks": round(backlog_points / (burn_rate * 1.25), 1),
        "pessimistic_weeks": round(backlog_points / max(burn_rate * 0.75, 0.01), 1),
    }


def build_forward_capacity(
    *,
    issue_queryset,
    project_id: str,
    period: WeekPeriod,
    weekly_capacity_hours: int,
    horizon_weeks: int = 8,
) -> dict:
    backlog_points = aggregate_backlog_points(issue_queryset, project_id)
    burn_rate = compute_burn_rate(issue_queryset, project_id, period)
    weeks_to_clear = backlog_points / burn_rate if burn_rate > 0 else None
    overload = weeks_to_clear is not None and weeks_to_clear > horizon_weeks
    capacity_points = weekly_capacity_hours * horizon_weeks
    return {
        "horizon_weeks": horizon_weeks,
        "weekly_capacity_hours": weekly_capacity_hours,
        "backlog_points": backlog_points,
        "burn_rate": burn_rate,
        "weeks_to_clear": round(weeks_to_clear, 1) if weeks_to_clear is not None else None,
        "overload": overload,
        "capacity_points": capacity_points,
    }


def build_detail_finops_payload(
    *,
    project_id: str,
    profile: Client360ProjectFinopsProfile | None,
    settings: dict,
    issue_queryset,
    period: WeekPeriod,
    throughput: dict | None,
) -> dict:
    list_fields = serialize_finops_list_fields(profile, settings=settings)
    backlog_points = aggregate_backlog_points(issue_queryset, str(project_id))
    burn_rate = compute_burn_rate(issue_queryset, str(project_id), period)
    forecast = compute_forecast(backlog_points, burn_rate)
    forward = build_forward_capacity(
        issue_queryset=issue_queryset,
        project_id=str(project_id),
        period=period,
        weekly_capacity_hours=settings["squad_weekly_capacity_hours"],
    )
    delivery_cost = resolve_delivery_cost(profile)
    return {
        **list_fields,
        "harness_cost_breakdown": profile.harness_cost_breakdown if profile else [],
        "harness_project_tag": profile.harness_project_tag if profile else "",
        "burn_rate": burn_rate,
        "backlog_points": backlog_points,
        "forecast": forecast,
        "forward_capacity": forward,
        "delivery_cost": float(delivery_cost) if delivery_cost is not None else None,
        "throughput_week": throughput.get("throughput") if throughput else 0,
    }


def apply_finops_enrichment(
    clients: list[dict],
    *,
    profiles: dict[str, Client360ProjectFinopsProfile],
    settings: dict,
) -> list[dict]:
    for row in clients:
        pid = row["project_id"]
        finops = serialize_finops_list_fields(profiles.get(pid), settings=settings)
        row["finops"] = finops
    return clients


def build_finops_summary(clients: list[dict], settings: dict) -> dict:
    with_cost = [c for c in clients if c.get("finops", {}).get("harness_cost_mtd") is not None]
    with_margin = [c for c in clients if c.get("finops", {}).get("margin_pct") is not None]
    total_cost = sum(c["finops"]["harness_cost_mtd"] for c in with_cost)
    avg_margin = (
        round(sum(c["finops"]["margin_pct"] for c in with_margin) / len(with_margin), 1)
        if with_margin
        else None
    )
    alerts = sum(1 for c in clients if c.get("finops", {}).get("finops_alert"))
    top_variance = sorted(
        [
            {
                "project_id": c["project_id"],
                "name": c["name"],
                "identifier": c["identifier"],
                "variance_pct": c["finops"]["budget_variance_pct"],
            }
            for c in clients
            if c.get("finops", {}).get("budget_variance_pct") is not None
        ],
        key=lambda x: x["variance_pct"],
        reverse=True,
    )[:5]
    return {
        "total_cost_mtd": round(total_cost, 2) if with_cost else None,
        "avg_margin_pct": avg_margin,
        "finops_alerts": alerts,
        "clients_with_cost": len(with_cost),
        "top_variance": top_variance,
        "settings": settings,
    }


def build_consultant_heatmap(
    workspace_id,
    *,
    period_month: date,
    project_ids: list[str] | None = None,
) -> dict:
    qs = Client360ConsultantAllocation.objects.filter(
        workspace_id=workspace_id,
        period_month=period_month,
        deleted_at__isnull=True,
    ).select_related("member", "project")
    if project_ids:
        qs = qs.filter(project_id__in=project_ids)
    consultants: dict[str, dict] = {}
    projects: dict[str, dict] = {}
    cells: dict[str, dict[str, float]] = defaultdict(dict)
    for row in qs:
        cid = str(row.member_id)
        pid = str(row.project_id)
        consultants[cid] = {
            "id": cid,
            "display_name": row.member.display_name if row.member else cid,
        }
        projects[pid] = {"id": pid, "name": row.project.name, "identifier": row.project.identifier}
        cells[cid][pid] = float(row.hours)
    return {
        "period_month": period_month.isoformat(),
        "consultants": list(consultants.values()),
        "projects": list(projects.values()),
        "cells": {cid: dict(projs) for cid, projs in cells.items()},
    }


def build_finops_csv_content(clients: list[dict], *, workspace_slug: str, period_month: date) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "client_name",
            "identifier",
            "hours_allocated",
            "capacity_hours",
            "utilization_pct",
            "harness_cost_mtd",
            "budget_planned",
            "budget_actual",
            "budget_variance_pct",
            "revenue_contract",
            "margin_pct",
            "finops_alert",
        ]
    )
    for client in clients:
        finops = client.get("finops") or {}
        util = finops.get("utilization") or {}
        writer.writerow(
            [
                client.get("name", ""),
                client.get("identifier", ""),
                util.get("hours_allocated", ""),
                util.get("capacity_hours", ""),
                util.get("pct", ""),
                finops.get("harness_cost_mtd", ""),
                finops.get("budget_planned", ""),
                finops.get("budget_actual", ""),
                finops.get("budget_variance_pct", ""),
                finops.get("revenue_contract", ""),
                finops.get("margin_pct", ""),
                "yes" if finops.get("finops_alert") else "",
            ]
        )
    header = f"# Operoz Visão 360 FinOps\n# workspace: {workspace_slug}\n# period_month: {period_month.isoformat()}\n"
    return header + output.getvalue()


def sync_harness_costs_for_workspace(workspace_id, period_month: date | None = None) -> dict[str, Any]:
    period_month = period_month or month_start()
    lines = Client360HarnessCostLineItem.objects.filter(
        workspace_id=workspace_id,
        attributed_month=period_month,
        deleted_at__isnull=True,
    )
    by_project: dict[str, dict] = defaultdict(lambda: {"total": Decimal("0"), "breakdown": []})
    for line in lines:
        if not line.project_id:
            continue
        pid = str(line.project_id)
        by_project[pid]["total"] += line.cost_usd
        by_project[pid]["breakdown"].append(
            {
                "pipeline_id": line.pipeline_id,
                "cost_usd": float(line.cost_usd),
                "tags": line.attribution_tags,
            }
        )
    now = timezone.now()
    updated = 0
    for pid, bucket in by_project.items():
        profile, _ = Client360ProjectFinopsProfile.objects.get_or_create(
            workspace_id=workspace_id,
            project_id=pid,
            period_month=period_month,
            defaults={"capacity_hours": DEFAULT_CAPACITY_HOURS},
        )
        profile.harness_cost_mtd = bucket["total"]
        profile.harness_cost_breakdown = bucket["breakdown"]
        profile.harness_last_sync_at = now
        profile.save(
            update_fields=[
                "harness_cost_mtd",
                "harness_cost_breakdown",
                "harness_last_sync_at",
                "updated_at",
            ]
        )
        updated += 1
    return {"period_month": period_month.isoformat(), "projects_updated": updated}
