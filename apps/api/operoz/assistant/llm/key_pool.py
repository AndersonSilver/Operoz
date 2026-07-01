from __future__ import annotations

import hashlib
import itertools
import os
import threading
from typing import Iterator

from django.conf import settings

from operoz.settings.redis import redis_instance

_lock = threading.Lock()
_round_robin: Iterator[int] | None = None
_round_robin_size: int = 0


def _failure_key(key_hash: str) -> str:
    return f"assistant:llm:circuit:failures:{key_hash}"


def _open_key(key_hash: str) -> str:
    return f"assistant:llm:circuit:open:{key_hash}"


def _failure_threshold() -> int:
    return int(getattr(settings, "ASSISTANT_LLM_KEY_FAILURE_THRESHOLD", 3))


def _open_seconds() -> int:
    return int(getattr(settings, "ASSISTANT_LLM_KEY_OPEN_SECONDS", 120))


def _key_hash(api_key: str) -> str:
    return hashlib.sha256(api_key.encode()).hexdigest()[:16]


def list_api_keys() -> list[str]:
    raw = os.environ.get("LLM_API_KEYS", "").strip()
    keys = [part.strip() for part in raw.split(",") if part.strip()]
    if keys:
        return keys
    single = os.environ.get("LLM_API_KEY", "").strip()
    if single:
        return [single]
    try:
        from operoz.license.utils.instance_value import get_configuration_value

        (db_key,) = get_configuration_value([{"key": "LLM_API_KEY", "default": None}])
        if db_key and str(db_key).strip():
            return [str(db_key).strip()]
    except Exception:
        pass
    return []


def _next_index(size: int) -> int:
    global _round_robin, _round_robin_size
    with _lock:
        normalized_size = max(size, 1)
        if _round_robin is None or _round_robin_size != normalized_size:
            _round_robin = itertools.cycle(range(normalized_size))
            _round_robin_size = normalized_size
        return next(_round_robin)


def is_key_open(api_key: str) -> bool:
    try:
        ri = redis_instance()
        return bool(ri.exists(_open_key(_key_hash(api_key))))
    except Exception:
        return False


def record_key_success(api_key: str) -> None:
    try:
        ri = redis_instance()
        digest = _key_hash(api_key)
        ri.delete(_failure_key(digest))
        ri.delete(_open_key(digest))
    except Exception:
        return


def record_key_failure(api_key: str) -> None:
    try:
        ri = redis_instance()
        digest = _key_hash(api_key)
        failures = ri.incr(_failure_key(digest))
        ri.expire(_failure_key(digest), _open_seconds())
        if failures >= _failure_threshold():
            ri.setex(_open_key(digest), _open_seconds(), "1")
    except Exception:
        return


def get_api_key() -> str | None:
    keys = [key for key in list_api_keys() if not is_key_open(key)]
    if not keys:
        keys = list_api_keys()
    if not keys:
        return None
    index = _next_index(len(keys)) % len(keys)
    return keys[index]


def iter_available_keys() -> list[str]:
    keys = list_api_keys()
    available = [key for key in keys if not is_key_open(key)]
    return available or keys
