from __future__ import annotations

import logging
import os
import time
from collections.abc import Callable
from typing import Any

from django.conf import settings

from operis.settings.redis import redis_instance

logger = logging.getLogger(__name__)

SEMAPHORE_HOLDERS = "assistant:llm:semaphore:holders"
FAIR_WORKSPACES = "assistant:fair:active_workspaces"
FAIR_WS_PREFIX = "assistant:fair:ws:"


def _max_concurrent_llm() -> int:
    return int(getattr(settings, "ASSISTANT_MAX_CONCURRENT_LLM", 40))


def _slot_key(holder_id: str) -> str:
    return f"assistant:llm:semaphore:slot:{holder_id}"


def _fair_ws_key(workspace_id: str) -> str:
    return f"{FAIR_WS_PREFIX}{workspace_id}"


def _avg_wait_seconds() -> int:
    return int(getattr(settings, "ASSISTANT_FAIR_QUEUE_AVG_SECONDS", 15))


def _cleanup_stale_holders() -> int:
    ri = redis_instance()
    members = ri.smembers(SEMAPHORE_HOLDERS)
    active = 0
    for raw in members:
        holder = raw.decode() if isinstance(raw, bytes) else str(raw)
        if ri.exists(_slot_key(holder)):
            active += 1
        else:
            ri.srem(SEMAPHORE_HOLDERS, holder)
    return active


def llm_slots_in_use() -> int:
    try:
        return _cleanup_stale_holders()
    except Exception:
        return 0


def llm_semaphore_available() -> int:
    return max(0, _max_concurrent_llm() - llm_slots_in_use())


def try_acquire_llm_slot(holder_id: str, *, ttl_seconds: int = 600) -> bool:
    try:
        ri = redis_instance()
        if ri.exists(_slot_key(holder_id)):
            return True
        if _cleanup_stale_holders() >= _max_concurrent_llm():
            return False
        if ri.set(_slot_key(holder_id), "1", nx=True, ex=ttl_seconds):
            ri.sadd(SEMAPHORE_HOLDERS, holder_id)
            return True
        return bool(ri.exists(_slot_key(holder_id)))
    except Exception:
        return True


def release_llm_slot(holder_id: str) -> None:
    try:
        ri = redis_instance()
        ri.delete(_slot_key(holder_id))
        ri.srem(SEMAPHORE_HOLDERS, holder_id)
    except Exception:
        return


def register_fair_job(job_id: str, workspace_id: str) -> None:
    try:
        ri = redis_instance()
        ri.rpush(_fair_ws_key(workspace_id), job_id)
        ri.sadd(FAIR_WORKSPACES, workspace_id)
    except Exception:
        return


def unregister_fair_job(job_id: str, workspace_id: str) -> None:
    try:
        ri = redis_instance()
        ri.lrem(_fair_ws_key(workspace_id), 0, job_id)
        if ri.llen(_fair_ws_key(workspace_id)) == 0:
            ri.srem(FAIR_WORKSPACES, workspace_id)
            ri.delete(_fair_ws_key(workspace_id))
    except Exception:
        return


def _fair_workspace_order() -> list[str]:
    ri = redis_instance()
    workspaces = ri.smembers(FAIR_WORKSPACES)
    ordered: list[str] = []
    for raw in workspaces:
        ws = raw.decode() if isinstance(raw, bytes) else str(raw)
        if ri.llen(_fair_ws_key(ws)) > 0:
            ordered.append(ws)
        else:
            ri.srem(FAIR_WORKSPACES, ws)
    ordered.sort()
    return ordered


def is_fair_turn(job_id: str, workspace_id: str) -> bool:
    try:
        ri = redis_instance()
        head = ri.lindex(_fair_ws_key(workspace_id), 0)
        if head is None:
            return True
        head_id = head.decode() if isinstance(head, bytes) else str(head)
        if head_id != job_id:
            return False
        workspaces = _fair_workspace_order()
        if not workspaces:
            return True
        return workspaces[0] == workspace_id
    except Exception:
        return True


def get_fair_queue_status(job_id: str, workspace_id: str) -> tuple[int, int]:
    try:
        workspaces = _fair_workspace_order()
        position = 0
        found = False
        for ws in workspaces:
            ri = redis_instance()
            jobs = ri.lrange(_fair_ws_key(ws), 0, -1)
            for raw in jobs:
                current = raw.decode() if isinstance(raw, bytes) else str(raw)
                position += 1
                if current == job_id and ws == workspace_id:
                    found = True
                    break
            if found:
                break
        if not found:
            position = max(1, llm_slots_in_use())
        estimated = max(_avg_wait_seconds(), position * _avg_wait_seconds())
        return position, estimated
    except Exception:
        return 1, _avg_wait_seconds()


def wait_for_llm_resources(
    holder_id: str,
    workspace_id: str,
    *,
    publish: Callable[[dict[str, Any]], None] | None = None,
    max_wait_seconds: float | None = None,
) -> bool:
    max_wait = float(
        max_wait_seconds
        if max_wait_seconds is not None
        else getattr(settings, "ASSISTANT_LLM_WAIT_TIMEOUT_SECONDS", 600)
    )
    register_fair_job(holder_id, workspace_id)
    deadline = time.monotonic() + max_wait
    acquired = False
    try:
        while time.monotonic() < deadline:
            position, estimated_wait = get_fair_queue_status(holder_id, workspace_id)
            if publish:
                publish(
                    {
                        "type": "queue_update",
                        "queue_position": position,
                        "estimated_wait_seconds": estimated_wait,
                    }
                )
            if is_fair_turn(holder_id, workspace_id) and try_acquire_llm_slot(holder_id):
                acquired = True
                unregister_fair_job(holder_id, workspace_id)
                return True
            time.sleep(0.5)
        return False
    finally:
        if not acquired:
            unregister_fair_job(holder_id, workspace_id)
