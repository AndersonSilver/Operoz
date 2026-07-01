from __future__ import annotations

import os
import re
from typing import Any

from operoz.license.utils.encryption import decrypt_data

SECRET_REF_PATTERN = re.compile(r"\{\{secret:([a-zA-Z0-9_.-]+)\}\}")
ENV_REF_PATTERN = re.compile(r"\{\{env:([A-Z0-9_]+)\}\}")

SENSITIVE_KEY_FRAGMENTS = (
    "password",
    "secret",
    "token",
    "api_key",
    "apikey",
    "authorization",
    "credential",
)


def _is_sensitive_key(key: str) -> bool:
    lowered = key.lower()
    return any(fragment in lowered for fragment in SENSITIVE_KEY_FRAGMENTS)


def resolve_config_value(value: Any, *, workspace_id: str) -> Any:
    if isinstance(value, str):
        return _resolve_string_refs(value, workspace_id=workspace_id)
    if isinstance(value, list):
        return [resolve_config_value(item, workspace_id=workspace_id) for item in value]
    if isinstance(value, dict):
        return {k: resolve_config_value(v, workspace_id=workspace_id) for k, v in value.items()}
    return value


def _resolve_string_refs(value: str, *, workspace_id: str) -> str:
    def secret_replacer(match: re.Match[str]) -> str:
        key = match.group(1)
        from operoz.db.models import BoardAutomationSecret

        secret = BoardAutomationSecret.objects.filter(workspace_id=workspace_id, key=key).first()
        if not secret:
            return ""
        return decrypt_data(secret.value_encrypted) or ""

    def env_replacer(match: re.Match[str]) -> str:
        return os.environ.get(match.group(1), "")

    resolved = SECRET_REF_PATTERN.sub(secret_replacer, value)
    return ENV_REF_PATTERN.sub(env_replacer, resolved)


def redact_for_storage(value: Any) -> Any:
    if isinstance(value, str):
        if SECRET_REF_PATTERN.search(value) or ENV_REF_PATTERN.search(value):
            return "[REDACTED]"
        return value
    if isinstance(value, list):
        return [redact_for_storage(item) for item in value]
    if isinstance(value, dict):
        redacted: dict[str, Any] = {}
        for key, item in value.items():
            if _is_sensitive_key(key):
                redacted[key] = "[REDACTED]"
            else:
                redacted[key] = redact_for_storage(item)
        return redacted
    return value
