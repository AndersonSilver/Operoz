from __future__ import annotations

import os
from typing import Any

from django.conf import settings

from operoz.celery import app


def default_monitored_queues() -> list[str]:
    automation = getattr(settings, "AUTOMATION_CELERY_QUEUE", "automation")
    automation_email = getattr(settings, "AUTOMATION_EMAIL_CELERY_QUEUE", "automation_email")
    assistant = getattr(settings, "ASSISTANT_CELERY_QUEUE", "assistant")
    assistant_chat = getattr(settings, "ASSISTANT_CHAT_CELERY_QUEUE", "assistant-chat")
    return [automation, automation_email, assistant, assistant_chat, "celery"]


def get_queue_depths(queue_names: list[str] | None = None) -> dict[str, int | None]:
    """Passive queue_declare via Kombu; None quando a fila não existe."""
    names = queue_names or default_monitored_queues()
    depths: dict[str, int | None] = {name: None for name in names}
    try:
        with app.connection_or_acquire() as conn:
            channel = conn.default_channel
            for name in names:
                try:
                    _, count, _ = channel.queue_declare(queue=name, passive=True)
                    depths[name] = int(count)
                except Exception:
                    depths[name] = None
    except Exception:
        return depths
    return depths


def default_alert_threshold() -> int:
    raw = os.environ.get("CELERY_QUEUE_ALERT_THRESHOLD", "500")
    try:
        return max(1, int(raw))
    except ValueError:
        return 500


def queue_alert_threshold(queue_name: str, *, global_threshold: int | None = None) -> int:
    """Per-queue alert threshold; assistant-chat defaults to 100."""
    fallback = global_threshold if global_threshold is not None else default_alert_threshold()
    if queue_name == getattr(settings, "ASSISTANT_CHAT_CELERY_QUEUE", "assistant-chat"):
        raw = os.environ.get(
            "ASSISTANT_CHAT_QUEUE_ALERT_THRESHOLD",
            str(getattr(settings, "ASSISTANT_CHAT_QUEUE_ALERT_THRESHOLD", 100)),
        )
        try:
            return max(1, int(raw))
        except ValueError:
            return 100
    return fallback


def queues_exceeding_threshold(
    depths: dict[str, int | None],
    threshold: int,
    *,
    per_queue: bool = True,
) -> list[dict[str, Any]]:
    alerts: list[dict[str, Any]] = []
    for queue_name, depth in depths.items():
        if depth is None:
            continue
        effective = queue_alert_threshold(queue_name, global_threshold=threshold) if per_queue else threshold
        if depth >= effective:
            alerts.append({"queue": queue_name, "depth": depth, "threshold": effective})
    return alerts
