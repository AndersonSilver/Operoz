from __future__ import annotations

from django.conf import settings

from operis.settings.redis import redis_instance

DEFAULT_THROTTLE_TTL_SECONDS = 6 * 60 * 60
WORKSPACE_RATE_LIMIT = 50
USER_CHANNEL_RATE_LIMIT = 10


def _throttle_key(*, user_id: str, issue_id: str, alert_type: str, channel: str) -> str:
    return f"alert:{user_id}:{issue_id}:{alert_type}:{channel}"


def _workspace_rate_key(*, workspace_id: str) -> str:
    return f"alert:rate:workspace:{workspace_id}:hour"


def _user_channel_rate_key(*, user_id: str, channel: str) -> str:
    return f"alert:rate:user:{user_id}:{channel}:hour"


def throttle_check(*, user_id: str, issue_id: str, alert_type: str, channel: str) -> bool:
    """Return True when dispatch is allowed (no recent duplicate)."""
    ttl = int(getattr(settings, "ALERT_THROTTLE_TTL_SECONDS", DEFAULT_THROTTLE_TTL_SECONDS))
    try:
        ri = redis_instance()
        key = _throttle_key(user_id=user_id, issue_id=issue_id, alert_type=alert_type, channel=channel)
        if ri.exists(key):
            return False
        ri.setex(key, ttl, "1")
        return True
    except Exception:
        return True


def rate_limit_check(*, workspace_id: str, user_id: str, channel: str) -> bool:
    """Return True when workspace/user channel limits are not exceeded."""
    workspace_limit = int(getattr(settings, "ALERT_MAX_PER_WORKSPACE_HOUR", WORKSPACE_RATE_LIMIT))
    user_limit = int(getattr(settings, "ALERT_MAX_PER_USER_CHANNEL_HOUR", USER_CHANNEL_RATE_LIMIT))
    try:
        ri = redis_instance()
        workspace_key = _workspace_rate_key(workspace_id=workspace_id)
        user_key = _user_channel_rate_key(user_id=user_id, channel=channel)
        workspace_count = int(ri.get(workspace_key) or 0)
        user_count = int(ri.get(user_key) or 0)
        if workspace_count >= workspace_limit or user_count >= user_limit:
            return False
        pipe = ri.pipeline()
        pipe.incr(workspace_key)
        pipe.expire(workspace_key, 3600)
        pipe.incr(user_key)
        pipe.expire(user_key, 3600)
        pipe.execute()
        return True
    except Exception:
        return True
