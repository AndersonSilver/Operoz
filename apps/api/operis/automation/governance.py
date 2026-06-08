from __future__ import annotations

from django.conf import settings

from operis.automation.domain import DomainEvent
from operis.settings.redis import redis_instance


def _board_rate_key(board_id: str) -> str:
    return f"automation:rate:board:{board_id}:hour"


def _workspace_rate_key(workspace_id: str) -> str:
    return f"automation:rate:workspace:{workspace_id}:hour"


def _circuit_failures_key(rule_id: str) -> str:
    return f"automation:circuit:failures:{rule_id}"


def _circuit_open_key(rule_id: str) -> str:
    return f"automation:circuit:open:{rule_id}"


def check_dispatch_allowed(rule, event: DomainEvent) -> tuple[bool, str]:
    if is_circuit_open(str(rule.id)):
        return False, "circuit_open"

    board_limit = getattr(settings, "AUTOMATION_MAX_RUNS_PER_BOARD_PER_HOUR", 500)
    workspace_limit = getattr(settings, "AUTOMATION_MAX_RUNS_PER_WORKSPACE_PER_HOUR", 5000)

    try:
        ri = redis_instance()
        board_count = int(ri.get(_board_rate_key(event.board_id)) or 0)
        workspace_count = int(ri.get(_workspace_rate_key(event.workspace_id)) or 0)
    except Exception:
        return True, "ok"

    if board_count >= board_limit:
        return False, "board_rate_limit"
    if workspace_count >= workspace_limit:
        return False, "workspace_rate_limit"
    return True, "ok"


def record_dispatch(rule, event: DomainEvent) -> None:
    try:
        ri = redis_instance()
        pipe = ri.pipeline()
        board_key = _board_rate_key(event.board_id)
        workspace_key = _workspace_rate_key(event.workspace_id)
        pipe.incr(board_key)
        pipe.expire(board_key, 3600)
        pipe.incr(workspace_key)
        pipe.expire(workspace_key, 3600)
        pipe.execute()
    except Exception:
        return


def is_circuit_open(rule_id: str) -> bool:
    try:
        ri = redis_instance()
        return bool(ri.exists(_circuit_open_key(rule_id)))
    except Exception:
        return False


def record_rule_success(rule_id: str) -> None:
    try:
        ri = redis_instance()
        ri.delete(_circuit_failures_key(rule_id))
        ri.delete(_circuit_open_key(rule_id))
    except Exception:
        return


def record_rule_failure(rule_id: str) -> None:
    threshold = getattr(settings, "AUTOMATION_CIRCUIT_FAILURE_THRESHOLD", 10)
    open_seconds = getattr(settings, "AUTOMATION_CIRCUIT_OPEN_SECONDS", 300)

    try:
        ri = redis_instance()
        failures_key = _circuit_failures_key(rule_id)
        count = ri.incr(failures_key)
        ri.expire(failures_key, 3600)
        if count >= threshold:
            ri.setex(_circuit_open_key(rule_id), open_seconds, "1")
    except Exception:
        return
