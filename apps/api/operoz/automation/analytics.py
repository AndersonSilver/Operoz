from __future__ import annotations

from collections import defaultdict
from datetime import timedelta
from typing import Any

from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone

from operoz.db.models import Board, BoardAutomationRun

ANALYTICS_PERIOD_DAYS = 7
RUN_STATUSES = (
    BoardAutomationRun.STATUS_SUCCESS,
    BoardAutomationRun.STATUS_FAILED,
    BoardAutomationRun.STATUS_SKIPPED,
    BoardAutomationRun.STATUS_PENDING,
    BoardAutomationRun.STATUS_RUNNING,
)


def _percentile(values: list[int], pct: float) -> int | None:
    if not values:
        return None
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, int(round((pct / 100) * (len(ordered) - 1)))))
    return ordered[index]


def build_board_automation_analytics(board: Board, *, days: int = ANALYTICS_PERIOD_DAYS) -> dict[str, Any]:
    now = timezone.now()
    cutoff = now - timedelta(days=days - 1)
    cutoff = cutoff.replace(hour=0, minute=0, second=0, microsecond=0)

    runs = BoardAutomationRun.objects.filter(
        board=board,
        deleted_at__isnull=True,
        dry_run=False,
        created_at__gte=cutoff,
    ).select_related("rule")

    status_map: dict[str, int] = {status: 0 for status in RUN_STATUSES}
    for row in runs.values("status").annotate(count=Count("id")):
        status_map[row["status"]] = row["count"]

    total_runs = sum(status_map.values())
    success_count = status_map[BoardAutomationRun.STATUS_SUCCESS]
    failed_count = status_map[BoardAutomationRun.STATUS_FAILED]
    skipped_count = status_map[BoardAutomationRun.STATUS_SKIPPED]
    finished_count = success_count + failed_count + skipped_count
    success_rate = round((success_count / finished_count) * 100, 1) if finished_count else None

    durations_ms: list[int] = []
    for started_at, finished_at in runs.filter(
        started_at__isnull=False,
        finished_at__isnull=False,
    ).values_list("started_at", "finished_at"):
        delta_ms = int((finished_at - started_at).total_seconds() * 1000)
        if delta_ms >= 0:
            durations_ms.append(delta_ms)

    avg_duration_ms = int(sum(durations_ms) / len(durations_ms)) if durations_ms else None
    p95_duration_ms = _percentile(durations_ms, 95)

    day_keys: list[str] = []
    day_cursor = cutoff.date()
    end_day = now.date()
    while day_cursor <= end_day:
        day_keys.append(day_cursor.isoformat())
        day_cursor += timedelta(days=1)

    timeline_buckets: dict[str, dict[str, int]] = {day: {status: 0 for status in RUN_STATUSES} for day in day_keys}
    for row in (
        runs.annotate(day=TruncDate("created_at")).values("day", "status").annotate(count=Count("id")).order_by("day")
    ):
        day_key = row["day"].isoformat()
        if day_key in timeline_buckets:
            timeline_buckets[day_key][row["status"]] = row["count"]

    timeline = []
    for day in day_keys:
        bucket = timeline_buckets[day]
        timeline.append(
            {
                "date": day,
                "success": bucket[BoardAutomationRun.STATUS_SUCCESS],
                "failed": bucket[BoardAutomationRun.STATUS_FAILED],
                "skipped": bucket[BoardAutomationRun.STATUS_SKIPPED],
                "pending": bucket[BoardAutomationRun.STATUS_PENDING],
                "running": bucket[BoardAutomationRun.STATUS_RUNNING],
                "total": sum(bucket.values()),
            }
        )

    by_rule_map: dict[str, dict[str, Any]] = defaultdict(
        lambda: {
            "rule_id": "",
            "rule_name": "",
            "total": 0,
            "success": 0,
            "failed": 0,
            "skipped": 0,
        }
    )
    for row in runs.values("rule_id", "rule__name", "status").annotate(count=Count("id")):
        rule_id = str(row["rule_id"])
        entry = by_rule_map[rule_id]
        entry["rule_id"] = rule_id
        entry["rule_name"] = row["rule__name"] or ""
        entry["total"] += row["count"]
        if row["status"] == BoardAutomationRun.STATUS_SUCCESS:
            entry["success"] += row["count"]
        elif row["status"] == BoardAutomationRun.STATUS_FAILED:
            entry["failed"] += row["count"]
        elif row["status"] == BoardAutomationRun.STATUS_SKIPPED:
            entry["skipped"] += row["count"]

    by_rule = sorted(by_rule_map.values(), key=lambda item: item["total"], reverse=True)

    by_event_type = [
        {
            "event_type": row["event_type"],
            "count": row["count"],
        }
        for row in runs.values("event_type").annotate(count=Count("id")).order_by("-count")
    ]

    by_status = [{"status": status, "count": count} for status, count in status_map.items() if count > 0]

    recent_failures = [
        {
            "id": str(run.id),
            "rule_id": str(run.rule_id),
            "rule_name": run.rule.name if run.rule_id else "",
            "event_type": run.event_type,
            "error_message": run.error_message,
            "created_at": run.created_at.isoformat() if run.created_at else None,
        }
        for run in runs.filter(status=BoardAutomationRun.STATUS_FAILED).order_by("-created_at")[:5]
    ]

    last_24h_cutoff = now - timedelta(hours=24)
    runs_last_24h = runs.filter(created_at__gte=last_24h_cutoff).count()

    return {
        "period_days": days,
        "summary": {
            "total_runs": total_runs,
            "success_count": success_count,
            "failed_count": failed_count,
            "skipped_count": skipped_count,
            "success_rate": success_rate,
            "avg_duration_ms": avg_duration_ms,
            "p95_duration_ms": p95_duration_ms,
            "runs_last_24h": runs_last_24h,
        },
        "timeline": timeline,
        "by_rule": by_rule,
        "by_status": by_status,
        "by_event_type": by_event_type,
        "recent_failures": recent_failures,
    }
