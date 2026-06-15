from __future__ import annotations

import os

from django.conf import settings

from operis.db.models import Workspace


def _degraded_budget_ratio() -> float:
    raw = os.environ.get("ASSISTANT_DEGRADED_BUDGET_RATIO", "0.9")
    try:
        return min(1.0, max(0.5, float(raw)))
    except ValueError:
        return 0.9


def _queue_threshold() -> int:
    return int(getattr(settings, "ASSISTANT_DEGRADED_QUEUE_THRESHOLD", 10))


def should_use_degraded_mode(workspace: Workspace) -> bool:
    from operis.assistant.llm.concurrency import llm_slots_in_use

    if llm_slots_in_use() >= _queue_threshold():
        return True

    from operis.assistant.usage import get_usage_summary

    summary = get_usage_summary(workspace)
    utilization = float(summary.get("today_utilization") or 0.0)
    if utilization >= _degraded_budget_ratio():
        return True
    return False


def get_fallback_model(provider_key: str, primary_model: str) -> str | None:
    fallback = (os.environ.get("LLM_MODEL_FALLBACK") or getattr(settings, "LLM_MODEL_FALLBACK", "") or "").strip()
    if not fallback or fallback == primary_model:
        return None
    from operis.assistant.llm.config import SUPPORTED_PROVIDERS

    provider_cls = SUPPORTED_PROVIDERS.get((provider_key or "").lower())
    if not provider_cls:
        return None
    if fallback in provider_cls.models or provider_cls.allows_custom_model:
        return fallback
    return None
