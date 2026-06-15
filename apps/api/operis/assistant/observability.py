from __future__ import annotations

import os
import time
from typing import Any

from django.conf import settings

from operis.assistant.llm.concurrency import llm_semaphore_available, llm_slots_in_use
from operis.assistant.quality import _percentile
from operis.devops.celery_queue_monitor import get_queue_depths
from operis.settings.redis import redis_instance

RAG_CACHE_STATS_KEY = "assistant:metrics:rag_cache:hits"
RAG_CACHE_STATS_MISSES_KEY = "assistant:metrics:rag_cache:misses"
CHAT_OUTCOME_SUCCESS_KEY = "assistant:metrics:chat:success:hour"
CHAT_OUTCOME_ERROR_KEY = "assistant:metrics:chat:error:hour"
OUTCOME_TTL_SECONDS = 3600 * 2


def record_rag_cache_access(*, hit: bool) -> None:
    try:
        ri = redis_instance()
        key = RAG_CACHE_STATS_KEY if hit else RAG_CACHE_STATS_MISSES_KEY
        ri.incr(key)
        ri.expire(key, 86400 * 7)
    except Exception:
        return


def record_chat_outcome(*, success: bool) -> None:
    try:
        ri = redis_instance()
        key = CHAT_OUTCOME_SUCCESS_KEY if success else CHAT_OUTCOME_ERROR_KEY
        ri.incr(key)
        ri.expire(key, OUTCOME_TTL_SECONDS)
    except Exception:
        return


def _assistant_chat_queue_name() -> str:
    return getattr(settings, "ASSISTANT_CHAT_CELERY_QUEUE", "assistant-chat")


def _stale_job_threshold_seconds() -> int:
    return int(getattr(settings, "ASSISTANT_CHAT_JOB_STALE_SECONDS", 900))


def count_stale_assistant_jobs() -> int:
    from datetime import timedelta

    from django.utils import timezone

    from operis.db.models import AssistantChatJob

    cutoff = timezone.now() - timedelta(seconds=_stale_job_threshold_seconds())
    return AssistantChatJob.objects.filter(
        status__in=(AssistantChatJob.STATUS_QUEUED, AssistantChatJob.STATUS_RUNNING),
        updated_at__lt=cutoff,
    ).count()


def _count_active_chats() -> int:
    try:
        ri = redis_instance()
        active = 0
        cursor = 0
        while True:
            cursor, keys = ri.scan(cursor=cursor, match="assistant:active:chat:*", count=200)
            active += len(keys)
            if cursor == 0:
                break
        return active
    except Exception:
        return 0


def _global_latency_p95_ms() -> int | None:
    try:
        ri = redis_instance()
        values: list[int] = []
        cursor = 0
        while True:
            cursor, keys = ri.scan(cursor=cursor, match="assistant:latency:*", count=100)
            for key in keys:
                samples = ri.zrange(key, 0, -1, withscores=True)
                values.extend(int(score) for _, score in samples)
            if cursor == 0:
                break
        return _percentile(values, 95)
    except Exception:
        return None


def _chat_error_rate() -> float | None:
    try:
        ri = redis_instance()
        success = int(ri.get(CHAT_OUTCOME_SUCCESS_KEY) or 0)
        errors = int(ri.get(CHAT_OUTCOME_ERROR_KEY) or 0)
        total = success + errors
        if total <= 0:
            return None
        return round(errors / total, 4)
    except Exception:
        return None


def _rag_cache_hit_ratio() -> float | None:
    try:
        ri = redis_instance()
        hits = int(ri.get(RAG_CACHE_STATS_KEY) or 0)
        misses = int(ri.get(RAG_CACHE_STATS_MISSES_KEY) or 0)
        total = hits + misses
        if total <= 0:
            return None
        return round(hits / total, 4)
    except Exception:
        return None


def collect_assistant_metrics() -> dict[str, Any]:
    chat_queue = _assistant_chat_queue_name()
    depths = get_queue_depths([chat_queue])
    queue_depth = depths.get(chat_queue)

    return {
        "assistant_chat_active": _count_active_chats(),
        "assistant_chat_queue_depth": queue_depth,
        "assistant_chat_stale_jobs": count_stale_assistant_jobs(),
        "assistant_llm_semaphore_available": llm_semaphore_available(),
        "assistant_llm_semaphore_in_use": llm_slots_in_use(),
        "assistant_rag_cache_hit_ratio": _rag_cache_hit_ratio(),
        "assistant_latency_p95_first_token_ms": _global_latency_p95_ms(),
        "assistant_chat_error_rate": _chat_error_rate(),
        "collected_at": int(time.time()),
    }


def _format_metric(name: str, value: float | int | None, *, help_text: str, metric_type: str = "gauge") -> str:
    lines = [f"# HELP {name} {help_text}", f"# TYPE {name} {metric_type}"]
    if value is None:
        lines.append(f"{name} 0")
    else:
        lines.append(f"{name} {value}")
    return "\n".join(lines)


def render_prometheus_metrics() -> str:
    metrics = collect_assistant_metrics()
    parts = [
        _format_metric(
            "assistant_chat_active",
            metrics["assistant_chat_active"],
            help_text="Active assistant chat streams (Redis slots)",
        ),
        _format_metric(
            "assistant_chat_queue_depth",
            metrics["assistant_chat_queue_depth"],
            help_text="Depth of the assistant-chat Celery queue",
        ),
        _format_metric(
            "assistant_chat_stale_jobs",
            metrics["assistant_chat_stale_jobs"],
            help_text="Queued/running chat jobs older than stale threshold",
        ),
        _format_metric(
            "assistant_llm_semaphore_available",
            metrics["assistant_llm_semaphore_available"],
            help_text="Available global LLM concurrency slots",
        ),
        _format_metric(
            "assistant_llm_semaphore_in_use",
            metrics["assistant_llm_semaphore_in_use"],
            help_text="LLM concurrency slots currently in use",
        ),
        _format_metric(
            "assistant_rag_cache_hit_ratio",
            metrics["assistant_rag_cache_hit_ratio"],
            help_text="RAG cache hit ratio (0-1)",
        ),
        _format_metric(
            "assistant_latency_p95_first_token_ms",
            metrics["assistant_latency_p95_first_token_ms"],
            help_text="Global P95 first token latency in milliseconds",
        ),
        _format_metric(
            "assistant_chat_error_rate",
            metrics["assistant_chat_error_rate"],
            help_text="Chat error rate over the last hour (0-1)",
        ),
    ]
    return "\n".join(parts) + "\n"


def default_alert_thresholds() -> dict[str, int | float]:
    return {
        "latency_p95_first_token_ms": int(
            os.environ.get("ASSISTANT_ALERT_P95_FIRST_TOKEN_MS", "3000")
        ),
        "chat_error_rate": float(os.environ.get("ASSISTANT_ALERT_ERROR_RATE", "0.05")),
        "assistant_chat_queue_depth": int(
            os.environ.get(
                "ASSISTANT_CHAT_QUEUE_ALERT_THRESHOLD",
                str(getattr(settings, "ASSISTANT_CHAT_QUEUE_ALERT_THRESHOLD", 100)),
            )
        ),
        "assistant_chat_stale_jobs": int(
            os.environ.get(
                "ASSISTANT_ALERT_STALE_JOBS",
                str(getattr(settings, "ASSISTANT_ALERT_STALE_JOBS", 1)),
            )
        ),
    }


def evaluate_assistant_alerts() -> list[dict[str, Any]]:
    metrics = collect_assistant_metrics()
    thresholds = default_alert_thresholds()
    alerts: list[dict[str, Any]] = []

    p95 = metrics.get("assistant_latency_p95_first_token_ms")
    if p95 is not None and p95 > thresholds["latency_p95_first_token_ms"]:
        alerts.append(
            {
                "code": "latency_p95_first_token",
                "value": p95,
                "threshold": thresholds["latency_p95_first_token_ms"],
                "message": f"P95 first token {p95}ms > {thresholds['latency_p95_first_token_ms']}ms",
            }
        )

    error_rate = metrics.get("assistant_chat_error_rate")
    if error_rate is not None and error_rate > thresholds["chat_error_rate"]:
        alerts.append(
            {
                "code": "chat_error_rate",
                "value": error_rate,
                "threshold": thresholds["chat_error_rate"],
                "message": f"Chat error rate {error_rate:.2%} > {thresholds['chat_error_rate']:.0%}",
            }
        )

    queue_depth = metrics.get("assistant_chat_queue_depth")
    if queue_depth is not None and queue_depth >= thresholds["assistant_chat_queue_depth"]:
        alerts.append(
            {
                "code": "assistant_chat_queue_depth",
                "value": queue_depth,
                "threshold": thresholds["assistant_chat_queue_depth"],
                "message": (
                    f"assistant-chat queue {queue_depth} >= {thresholds['assistant_chat_queue_depth']}"
                ),
            }
        )

    stale_jobs = metrics.get("assistant_chat_stale_jobs")
    if stale_jobs is not None and stale_jobs >= thresholds["assistant_chat_stale_jobs"]:
        alerts.append(
            {
                "code": "assistant_chat_stale_jobs",
                "value": stale_jobs,
                "threshold": thresholds["assistant_chat_stale_jobs"],
                "message": (
                    f"stale chat jobs {stale_jobs} >= {thresholds['assistant_chat_stale_jobs']}"
                ),
            }
        )

    return alerts
