from __future__ import annotations

import os
import uuid
from datetime import date, timedelta
from typing import Any

from django.conf import settings
from django.db.models import Count, Sum
from django.utils import timezone

from operoz.db.models import AssistantQualityDaily, AssistantQualityReview, Workspace
from operoz.settings.redis import redis_instance

QUALITY_TARGETS = {
    "tool_usage_rate": 0.60,
    "satisfaction_rate": 0.70,
    "latency_p95_ms": 3000,
    "hallucination_rate_max": 0.15,
    "automation_p95_ms": 2000,
}

_LATENCY_SAMPLE_LIMIT = 1000
_LATENCY_TTL_SECONDS = 86400 * 14


def _defer_enabled() -> bool:
    return str(
        getattr(settings, "ASSISTANT_DEFER_NONCRITICAL", os.environ.get("ASSISTANT_DEFER_NONCRITICAL", "1"))
    ).lower() not in (
        "0",
        "false",
        "no",
    )


def _latency_key(workspace_id: str) -> str:
    return f"assistant:latency:{workspace_id}"


def _today_row(workspace: Workspace) -> AssistantQualityDaily:
    today = date.today()
    row, _ = AssistantQualityDaily.objects.get_or_create(
        workspace=workspace,
        quality_date=today,
        defaults={"created_by": None},
    )
    return row


def record_assistant_response(
    workspace: Workspace,
    *,
    used_tools: bool,
    first_token_ms: int | None,
) -> None:
    if _defer_enabled():
        from operoz.bgtasks.assistant_deferred_task import record_assistant_response_task

        record_assistant_response_task.delay(
            workspace_id=str(workspace.id),
            used_tools=used_tools,
            first_token_ms=first_token_ms,
        )
        return

    record_assistant_response_sync(
        workspace,
        used_tools=used_tools,
        first_token_ms=first_token_ms,
    )


def record_assistant_response_sync(
    workspace: Workspace,
    *,
    used_tools: bool,
    first_token_ms: int | None,
) -> None:
    row = _today_row(workspace)
    row.response_count += 1
    if used_tools:
        row.tool_response_count += 1
    row.save(update_fields=["response_count", "tool_response_count", "updated_at"])

    if first_token_ms is None or first_token_ms < 0:
        return
    try:
        ri = redis_instance()
        key = _latency_key(str(workspace.id))
        ri.zadd(key, {str(uuid.uuid4()): first_token_ms})
        ri.zremrangebyrank(key, 0, -(_LATENCY_SAMPLE_LIMIT + 1))
        ri.expire(key, _LATENCY_TTL_SECONDS)
    except Exception:
        return


def adjust_feedback_daily(
    workspace: Workspace,
    *,
    old_rating: str | None,
    new_rating: str | None,
) -> None:
    row = _today_row(workspace)
    changed = False
    if old_rating == "up":
        row.feedback_up = max(0, row.feedback_up - 1)
        changed = True
    elif old_rating == "down":
        row.feedback_down = max(0, row.feedback_down - 1)
        changed = True
    if new_rating == "up":
        row.feedback_up += 1
        changed = True
    elif new_rating == "down":
        row.feedback_down += 1
        changed = True
    if changed:
        row.save(update_fields=["feedback_up", "feedback_down", "updated_at"])


def _percentile(values: list[int], pct: float) -> int | None:
    if not values:
        return None
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, int(round((pct / 100) * (len(ordered) - 1)))))
    return ordered[index]


def _latency_p95_ms(workspace_id: str) -> int | None:
    try:
        ri = redis_instance()
        key = _latency_key(workspace_id)
        samples = ri.zrange(key, 0, -1, withscores=True)
        values = [int(score) for _, score in samples]
        return _percentile(values, 95)
    except Exception:
        return None


def _meets_target(value: float | int | None, target: float, *, lower_is_better: bool = False) -> bool | None:
    if value is None:
        return None
    if lower_is_better:
        return float(value) <= target
    return float(value) >= target


def get_assistant_quality_dashboard(workspace: Workspace, *, days: int = 7) -> dict[str, Any]:
    days = min(max(days, 1), 30)
    cutoff = date.today() - timedelta(days=days - 1)
    rows = AssistantQualityDaily.objects.filter(workspace=workspace, quality_date__gte=cutoff)
    totals = rows.aggregate(
        responses=Sum("response_count"),
        tool_responses=Sum("tool_response_count"),
        feedback_up=Sum("feedback_up"),
        feedback_down=Sum("feedback_down"),
    )
    response_count = int(totals.get("responses") or 0)
    tool_response_count = int(totals.get("tool_responses") or 0)
    feedback_up = int(totals.get("feedback_up") or 0)
    feedback_down = int(totals.get("feedback_down") or 0)
    feedback_total = feedback_up + feedback_down

    tool_usage_rate = round(tool_response_count / response_count, 4) if response_count else None
    satisfaction_rate = round(feedback_up / feedback_total, 4) if feedback_total else None
    latency_p95_ms = _latency_p95_ms(str(workspace.id))

    review_cutoff = timezone.now() - timedelta(days=days)
    review_counts = (
        AssistantQualityReview.objects.filter(workspace=workspace, created_at__gte=review_cutoff)
        .values("verdict")
        .annotate(count=Count("id"))
    )
    verdict_map = {row["verdict"]: row["count"] for row in review_counts}
    review_total = sum(verdict_map.values())
    hallucination_count = verdict_map.get(AssistantQualityReview.VERDICT_HALLUCINATION, 0)
    hallucination_rate = round(hallucination_count / review_total, 4) if review_total else None

    targets = QUALITY_TARGETS
    return {
        "period_days": days,
        "targets": targets,
        "tool_usage": {
            "rate": tool_usage_rate,
            "responses": response_count,
            "with_tools": tool_response_count,
            "meets_target": _meets_target(tool_usage_rate, targets["tool_usage_rate"]),
        },
        "satisfaction": {
            "rate": satisfaction_rate,
            "thumbs_up": feedback_up,
            "thumbs_down": feedback_down,
            "meets_target": _meets_target(satisfaction_rate, targets["satisfaction_rate"]),
        },
        "latency": {
            "p95_first_token_ms": latency_p95_ms,
            "meets_target": _meets_target(latency_p95_ms, targets["latency_p95_ms"], lower_is_better=True),
        },
        "hallucination_reviews": {
            "rate": hallucination_rate,
            "review_count": review_total,
            "hallucination_count": hallucination_count,
            "by_verdict": verdict_map,
            "meets_target": _meets_target(
                hallucination_rate,
                targets["hallucination_rate_max"],
                lower_is_better=True,
            )
            if hallucination_rate is not None
            else None,
        },
        "daily": [
            {
                "date": str(row.quality_date),
                "response_count": row.response_count,
                "tool_response_count": row.tool_response_count,
                "feedback_up": row.feedback_up,
                "feedback_down": row.feedback_down,
            }
            for row in rows.order_by("quality_date")
        ],
    }
