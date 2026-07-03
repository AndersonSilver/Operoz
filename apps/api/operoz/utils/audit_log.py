"""
Centralized security audit logger.

All security-relevant events are emitted to the `operoz.security.audit` logger
using structured `extra` fields so they can be shipped to SIEM/log aggregators.

Usage:
    from operoz.utils.audit_log import audit_logger, log_login_success, log_login_failure

Categories: login, logout, permission, member, api_token, resource
"""

from __future__ import annotations

import logging
from typing import Any

audit_logger = logging.getLogger("operoz.security.audit")


def _emit(level: str, event: str, extra: dict[str, Any]) -> None:
    getattr(audit_logger, level)(event, extra={"event": event, **extra})


# --- Authentication events ---


def log_login_success(*, user_id: str, email: str, ip: str, provider: str) -> None:
    _emit("info", "login.success", {"user_id": user_id, "email": email, "ip": ip, "provider": provider})


def log_login_failure(*, email: str, ip: str, provider: str, reason: str) -> None:
    _emit("warning", "login.failed", {"email": email, "ip": ip, "provider": provider, "reason": reason})


def log_logout(*, user_id: str, ip: str) -> None:
    _emit("info", "logout", {"user_id": user_id, "ip": ip})


# --- Authorization events ---


def log_permission_denied(*, user_id: str | None, resource: str, action: str, ip: str) -> None:
    _emit("warning", "permission.denied", {"user_id": user_id, "resource": resource, "action": action, "ip": ip})


# --- Member/workspace events ---


def log_member_role_changed(
    *, actor_id: str, target_user_id: str, workspace_slug: str, old_role: str, new_role: str, ip: str
) -> None:
    _emit(
        "info",
        "member.role_changed",
        {
            "actor_id": actor_id,
            "target_user_id": target_user_id,
            "workspace_slug": workspace_slug,
            "old_role": old_role,
            "new_role": new_role,
            "ip": ip,
        },
    )


def log_member_removed(*, actor_id: str, target_user_id: str, workspace_slug: str, ip: str) -> None:
    _emit(
        "info",
        "member.removed",
        {"actor_id": actor_id, "target_user_id": target_user_id, "workspace_slug": workspace_slug, "ip": ip},
    )


# --- API token events ---


def log_api_token_created(*, user_id: str, token_hash: str, workspace_slug: str, ip: str) -> None:
    _emit(
        "info",
        "api_token.created",
        {"user_id": user_id, "token_hash": token_hash, "workspace_slug": workspace_slug, "ip": ip},
    )


def log_api_token_revoked(*, user_id: str, token_hash: str, workspace_slug: str, ip: str) -> None:
    _emit(
        "info",
        "api_token.revoked",
        {"user_id": user_id, "token_hash": token_hash, "workspace_slug": workspace_slug, "ip": ip},
    )
