from __future__ import annotations

import logging
import time
from contextlib import contextmanager
from contextvars import ContextVar
from typing import Any, Iterator

from operis.settings.redis import redis_instance

logger = logging.getLogger("operis.automation")

_correlation_id: ContextVar[str | None] = ContextVar("automation_correlation_id", default=None)


def bind_correlation(correlation_id: str) -> None:
    _correlation_id.set(correlation_id)


def get_correlation_id() -> str | None:
    return _correlation_id.get()


def automation_log(event: str, **fields: Any) -> None:
    payload = {
        "automation_event": event,
        "correlation_id": get_correlation_id(),
        **fields,
    }
    logger.info("automation %s", event, extra={"automation": payload})


def record_metric(name: str, *, amount: int = 1, **labels: Any) -> None:
    try:
        ri = redis_instance()
        label_suffix = ""
        if labels:
            parts = [f"{k}={v}" for k, v in sorted(labels.items())]
            label_suffix = ":" + ":".join(parts)
        key = f"automation:metrics:{name}{label_suffix}"
        ri.incrby(key, amount)
        ri.expire(key, 86400 * 7)
    except Exception:
        logger.debug("failed to record automation metric %s", name, exc_info=True)


@contextmanager
def observe_duration(metric_name: str, **labels: Any) -> Iterator[None]:
    started = time.perf_counter()
    try:
        yield
    finally:
        elapsed_ms = int((time.perf_counter() - started) * 1000)
        record_metric(metric_name, amount=elapsed_ms, **labels)


def get_metrics_snapshot() -> dict[str, int]:
    try:
        ri = redis_instance()
        keys = list(ri.scan_iter(match="automation:metrics:*", count=200))
        snapshot: dict[str, int] = {}
        if not keys:
            return snapshot
        values = ri.mget(keys)
        for key, value in zip(keys, values, strict=False):
            if value is None:
                continue
            key_str = key.decode() if isinstance(key, bytes) else str(key)
            snapshot[key_str.removeprefix("automation:metrics:")] = int(value)
        return snapshot
    except Exception:
        logger.debug("failed to read automation metrics", exc_info=True)
        return {}
