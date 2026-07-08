from __future__ import annotations

import os
from datetime import date
from typing import Any

from django.db.models import Sum

from operoz.db.models import AssistantUsageDaily, Workspace


def _daily_token_budget() -> int:
    raw = os.environ.get("ASSISTANT_DAILY_TOKEN_BUDGET", "200000")
    try:
        return max(1000, int(raw))
    except ValueError:
        return 200_000


def _budget_alert_ratio() -> float:
    raw = os.environ.get("ASSISTANT_BUDGET_ALERT_RATIO", "0.8")
    try:
        return min(1.0, max(0.1, float(raw)))
    except ValueError:
        return 0.8


def estimate_tokens(text: str) -> int:
    return max(0, len(text or "") // 4)


def record_assistant_usage(
    workspace: Workspace,
    *,
    prompt_tokens: int = 0,
    completion_tokens: int = 0,
) -> AssistantUsageDaily:
    today = date.today()
    row, _ = AssistantUsageDaily.objects.get_or_create(
        workspace=workspace,
        usage_date=today,
        defaults={"created_by": None},
    )
    row.prompt_tokens += max(0, prompt_tokens)
    row.completion_tokens += max(0, completion_tokens)
    row.request_count += 1
    row.save(update_fields=["prompt_tokens", "completion_tokens", "request_count", "updated_at"])
    return row


def get_usage_summary(workspace: Workspace, *, days: int = 7) -> dict[str, Any]:
    budget = _daily_token_budget()
    alert_ratio = _budget_alert_ratio()
    today = date.today()
    rows = AssistantUsageDaily.objects.filter(workspace=workspace).order_by("-usage_date")[:days]
    today_row = AssistantUsageDaily.objects.filter(workspace=workspace, usage_date=today).first()
    today_total = 0
    if today_row:
        today_total = int(today_row.prompt_tokens + today_row.completion_tokens)

    totals = rows.aggregate(
        prompt=Sum("prompt_tokens"),
        completion=Sum("completion_tokens"),
        requests=Sum("request_count"),
    )
    total_tokens = int((totals.get("prompt") or 0) + (totals.get("completion") or 0))
    utilization = today_total / budget if budget else 0.0

    return {
        "daily_token_budget": budget,
        "budget_alert_ratio": alert_ratio,
        "budget_alert": utilization >= alert_ratio,
        "today_tokens": today_total,
        "today_utilization": round(utilization, 4),
        "period_days": days,
        "period_tokens": total_tokens,
        "period_requests": int(totals.get("requests") or 0),
        "daily": [
            {
                "date": str(row.usage_date),
                "prompt_tokens": row.prompt_tokens,
                "completion_tokens": row.completion_tokens,
                "total_tokens": row.prompt_tokens + row.completion_tokens,
                "request_count": row.request_count,
            }
            for row in rows
        ],
    }
