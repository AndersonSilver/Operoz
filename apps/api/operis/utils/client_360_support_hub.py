"""Client 360 — métricas de sustentação a partir do hub (aba Sustentação)."""

from __future__ import annotations

import csv
import io
import statistics
from datetime import date
from typing import Iterable

from django.utils import timezone

from operis.db.models import IntakeIssue
from operis.db.models.intake import IntakeIssueStatus, IntakeTicketKind
from operis.utils.board_support_sla import compute_support_sla_breach, parse_iso_datetime
from operis.utils.support_criticality import CRITICALITY_VALUES
from operis.utils.support_ticket import compute_support_metrics, get_support_namespace

SUPPORT_ANALYTICS_CRITICALITY_ORDER = (*sorted(CRITICALITY_VALUES), "unknown")

DEFAULT_SUPPORT_SLA_DAYS = 7


def resolve_support_sla_days(board_id, sla_map: dict[str, int] | None) -> int:
    if not board_id or not sla_map:
        return DEFAULT_SUPPORT_SLA_DAYS
    return max(1, int(sla_map.get(str(board_id), DEFAULT_SUPPORT_SLA_DAYS)))


SUPPORT_HUB_ACTIVE_STATUSES = (
    IntakeIssueStatus.PENDING,
    IntakeIssueStatus.SNOOZED,
    IntakeIssueStatus.ACCEPTED,
)


def _support_hub_base_queryset(project_ids: Iterable):
    ids = [pid for pid in project_ids if pid]
    if not ids:
        return IntakeIssue.objects.none()
    return IntakeIssue.objects.filter(
        project_id__in=ids,
        ticket_kind=IntakeTicketKind.SUPPORT,
        deleted_at__isnull=True,
        status__in=SUPPORT_HUB_ACTIVE_STATUSES,
    )


def _issue_sla_breached(row, *, board_id, sla_map: dict[str, int] | None) -> bool:
    extra = row.get("extra") or {}
    support = get_support_namespace(extra)
    sla_due_at = parse_iso_datetime(support.get("sla_due_at"))
    legacy_days = resolve_support_sla_days(board_id, sla_map) if not support.get("criticality") else None
    return compute_support_sla_breach(
        sla_due_at=sla_due_at,
        status=row["status"],
        closed_at=None,
        legacy_sla_days=legacy_days,
        opened_at=row.get("created_at"),
    )


def aggregate_support_hub_stats(
    project_ids: Iterable,
    today: date,
    *,
    project_board_map: dict[str, str | None] | None = None,
    sla_map: dict[str, int] | None = None,
) -> dict[str, dict[str, int]]:
    """project_id -> {support_open, support_overdue}."""
    project_board_map = project_board_map or {}
    sla_map = sla_map or {}
    result: dict[str, dict[str, int]] = {}

    for row in _support_hub_base_queryset(project_ids).values("project_id", "status", "created_at", "extra"):
        pid = str(row["project_id"])
        bucket = result.setdefault(pid, {"support_open": 0, "support_overdue": 0})
        bucket["support_open"] += 1

        board_id = project_board_map.get(pid)
        if _issue_sla_breached(row, board_id=board_id, sla_map=sla_map):
            bucket["support_overdue"] += 1

    return result


def list_support_hub_issues(project_id, *, limit: int = 15) -> list[dict]:
    rows = (
        _support_hub_base_queryset([project_id])
        .select_related("issue", "issue__state", "issue__type")
        .order_by("-created_at")[:limit]
    )
    items: list[dict] = []
    for intake_issue in rows:
        issue = intake_issue.issue
        items.append(
            {
                "id": str(issue.id),
                "name": issue.name,
                "sequence_id": issue.sequence_id,
                "target_date": issue.target_date,
                "priority": issue.priority,
                "state__name": issue.state.name if issue.state_id else None,
                "type__name": issue.type.name if issue.type_id else None,
            }
        )
    return items


def aggregate_support_sla_from_hub(
    project_ids: Iterable,
    today: date,
    *,
    project_board_map: dict[str, str | None],
    sla_map: dict[str, int] | None,
) -> dict[str, dict]:
    stats = aggregate_support_hub_stats(
        project_ids,
        today,
        project_board_map=project_board_map,
        sla_map=sla_map,
    )
    return {
        pid: {
            "breach_count": values["support_overdue"],
            "breached": values["support_overdue"] > 0,
        }
        for pid, values in stats.items()
    }


def _median_seconds(values: list[int]) -> int | None:
    if not values:
        return None
    return int(statistics.median(values))


def _empty_metric_bucket() -> dict:
    return {
        "count": 0,
        "median_tta_seconds": None,
        "median_ttr_seconds": None,
        "median_in_progress_seconds": None,
    }


def _build_metric_bucket(samples: list[dict[str, int | None]]) -> dict:
    tta_values = [row["tta"] for row in samples if row.get("tta") is not None]
    ttr_values = [row["ttr"] for row in samples if row.get("ttr") is not None]
    tip_values = [row["tip"] for row in samples if row.get("tip") is not None]
    return {
        "count": len(samples),
        "median_tta_seconds": _median_seconds(tta_values),
        "median_ttr_seconds": _median_seconds(ttr_values),
        "median_in_progress_seconds": _median_seconds(tip_values),
    }


def _closed_at_in_period(extra: dict, period_start: date | None, period_end: date | None) -> bool:
    closed_at = parse_iso_datetime(extra.get("closed_at"))
    if not closed_at:
        return False
    closed_date = timezone.localdate(closed_at)
    if period_start and closed_date < period_start:
        return False
    if period_end and closed_date > period_end:
        return False
    return True


def aggregate_support_metrics_analytics(
    project_ids: Iterable,
    *,
    period_start: date | None = None,
    period_end: date | None = None,
) -> dict:
    """Mediana TTA/TTR por criticidade (portfólio + por cliente) — chamados encerrados no período."""
    ids = [pid for pid in project_ids if pid]
    portfolio_samples: dict[str, list[dict]] = {key: [] for key in SUPPORT_ANALYTICS_CRITICALITY_ORDER}
    client_samples: dict[str, dict[str, list[dict]]] = {}

    if not ids:
        return {
            "by_criticality": {key: _empty_metric_bucket() for key in SUPPORT_ANALYTICS_CRITICALITY_ORDER},
            "by_client": {},
        }

    rows = IntakeIssue.objects.filter(
        project_id__in=ids,
        ticket_kind=IntakeTicketKind.SUPPORT,
        deleted_at__isnull=True,
        status=IntakeIssueStatus.CLOSED,
    ).values("project_id", "created_at", "extra")

    for row in rows:
        extra = row.get("extra") or {}
        if not _closed_at_in_period(extra, period_start, period_end):
            continue

        support = get_support_namespace(extra)
        criticality = support.get("criticality")
        if criticality not in CRITICALITY_VALUES:
            criticality = "unknown"

        metrics = compute_support_metrics(extra, row.get("created_at"))
        sample = {
            "tta": metrics.get("time_to_accept_seconds"),
            "ttr": metrics.get("time_to_resolve_seconds"),
            "tip": metrics.get("time_in_progress_seconds"),
        }

        portfolio_samples[criticality].append(sample)
        pid = str(row["project_id"])
        client_samples.setdefault(pid, {key: [] for key in SUPPORT_ANALYTICS_CRITICALITY_ORDER})
        client_samples[pid][criticality].append(sample)

    return {
        "by_criticality": {
            key: _build_metric_bucket(portfolio_samples[key]) for key in SUPPORT_ANALYTICS_CRITICALITY_ORDER
        },
        "by_client": {
            pid: {key: _build_metric_bucket(buckets[key]) for key in SUPPORT_ANALYTICS_CRITICALITY_ORDER}
            for pid, buckets in client_samples.items()
        },
    }


def build_support_analytics_csv_content(
    *,
    clients: list[dict],
    analytics: dict,
    delimiter: str = ";",
) -> str:
    """CSV: Cliente, Criticidade, Chamados, Mediana TTA, Mediana TTR, Mediana em atendimento."""
    client_name_by_id = {str(row.get("project_id")): row.get("name", "") for row in clients}
    by_client = analytics.get("by_client") or {}
    portfolio = analytics.get("by_criticality") or {}

    buffer = io.StringIO()
    writer = csv.writer(buffer, delimiter=delimiter, lineterminator="\n")
    writer.writerow(
        [
            "cliente",
            "criticidade",
            "chamados",
            "mediana_tta_segundos",
            "mediana_ttr_segundos",
            "mediana_em_atendimento_segundos",
        ]
    )

    for criticality in SUPPORT_ANALYTICS_CRITICALITY_ORDER:
        bucket = portfolio.get(criticality) or _empty_metric_bucket()
        if bucket.get("count", 0) <= 0:
            continue
        writer.writerow(
            [
                "PORTFÓLIO",
                criticality,
                bucket.get("count", 0),
                bucket.get("median_tta_seconds") or "",
                bucket.get("median_ttr_seconds") or "",
                bucket.get("median_in_progress_seconds") or "",
            ]
        )

    for pid in sorted(by_client.keys(), key=lambda value: client_name_by_id.get(value, value)):
        client_buckets = by_client[pid]
        client_name = client_name_by_id.get(pid, pid)
        for criticality in SUPPORT_ANALYTICS_CRITICALITY_ORDER:
            bucket = client_buckets.get(criticality) or _empty_metric_bucket()
            if bucket.get("count", 0) <= 0:
                continue
            writer.writerow(
                [
                    client_name,
                    criticality,
                    bucket.get("count", 0),
                    bucket.get("median_tta_seconds") or "",
                    bucket.get("median_ttr_seconds") or "",
                    bucket.get("median_in_progress_seconds") or "",
                ]
            )

    return buffer.getvalue()
