from __future__ import annotations

import os

from django.conf import settings

from operis.license.utils.instance_value import get_configuration_value
from operis.settings.redis import redis_instance


def _user_key(workspace_id: str, user_id: str) -> str:
    return f"assistant:rate:user:{workspace_id}:{user_id}:hour"


def _workspace_key(workspace_id: str) -> str:
    return f"assistant:rate:workspace:{workspace_id}:hour"


def _active_user_set_key(workspace_id: str, user_id: str) -> str:
    return f"assistant:active:user:{workspace_id}:{user_id}"


def _active_chat_key(chat_id: str) -> str:
    return f"assistant:active:chat:{chat_id}"


def _assistant_limits() -> tuple[bool, int, int]:
    (
        enabled,
        user_limit,
        workspace_limit,
    ) = get_configuration_value(
        [
            {"key": "ASSISTANT_ENABLED", "default": os.environ.get("ASSISTANT_ENABLED", "1")},
            {
                "key": "ASSISTANT_MAX_MESSAGES_PER_USER_PER_HOUR",
                "default": os.environ.get("ASSISTANT_MAX_MESSAGES_PER_USER_PER_HOUR", "60"),
            },
            {
                "key": "ASSISTANT_MAX_MESSAGES_PER_WORKSPACE_PER_HOUR",
                "default": os.environ.get("ASSISTANT_MAX_MESSAGES_PER_WORKSPACE_PER_HOUR", "500"),
            },
        ]
    )
    return enabled == "1", int(user_limit or 60), int(workspace_limit or 500)


def _max_active_chats_per_user() -> int:
    raw = os.environ.get(
        "ASSISTANT_MAX_ACTIVE_CHATS_PER_USER",
        str(getattr(settings, "ASSISTANT_MAX_ACTIVE_CHATS_PER_USER", 2)),
    )
    try:
        return max(1, int(raw))
    except ValueError:
        return 2


def _retry_after_seconds(ri, key: str) -> int:
    ttl = ri.ttl(key)
    if ttl is None or ttl < 0:
        return 3600
    return max(1, int(ttl))


def _count_active_chats(ri, workspace_id: str, user_id: str) -> int:
    active_key = _active_user_set_key(workspace_id, user_id)
    members = ri.smembers(active_key)
    active = 0
    for raw in members:
        chat_id = raw.decode() if isinstance(raw, bytes) else str(raw)
        if ri.exists(_active_chat_key(chat_id)):
            active += 1
        else:
            ri.srem(active_key, chat_id)
    return active


def check_assistant_rate_limit(workspace_id: str, user_id: str) -> tuple[bool, str, int]:
    enabled, user_limit, workspace_limit = _assistant_limits()
    if not enabled:
        return False, "assistant_disabled", 0

    try:
        ri = redis_instance()
        user_key = _user_key(workspace_id, user_id)
        workspace_key = _workspace_key(workspace_id)
        user_count = int(ri.get(user_key) or 0)
        workspace_count = int(ri.get(workspace_key) or 0)
        active_chats = _count_active_chats(ri, workspace_id, user_id)
    except Exception:
        return True, "ok", 0

    if active_chats >= _max_active_chats_per_user():
        return False, "concurrent_rate_limit", 30
    if user_count >= user_limit:
        return False, "user_rate_limit", _retry_after_seconds(ri, user_key)
    if workspace_count >= workspace_limit:
        return False, "workspace_rate_limit", _retry_after_seconds(ri, workspace_key)
    return True, "ok", 0


def acquire_active_chat(workspace_id: str, user_id: str, chat_id: str, *, ttl_seconds: int = 600) -> bool:
    try:
        ri = redis_instance()
        if _count_active_chats(ri, workspace_id, user_id) >= _max_active_chats_per_user():
            if not ri.exists(_active_chat_key(chat_id)):
                return False
        if ri.set(_active_chat_key(chat_id), "1", nx=True, ex=ttl_seconds):
            ri.sadd(_active_user_set_key(workspace_id, user_id), chat_id)
            return True
        return bool(ri.exists(_active_chat_key(chat_id)))
    except Exception:
        return True


def release_active_chat(workspace_id: str, user_id: str, chat_id: str) -> None:
    try:
        ri = redis_instance()
        ri.delete(_active_chat_key(chat_id))
        ri.srem(_active_user_set_key(workspace_id, user_id), chat_id)
    except Exception:
        return


def record_assistant_message(workspace_id: str, user_id: str) -> None:
    try:
        ri = redis_instance()
        pipe = ri.pipeline()
        user_key = _user_key(workspace_id, user_id)
        workspace_key = _workspace_key(workspace_id)
        pipe.incr(user_key)
        pipe.expire(user_key, 3600)
        pipe.incr(workspace_key)
        pipe.expire(workspace_key, 3600)
        pipe.execute()
    except Exception:
        return
