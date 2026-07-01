from __future__ import annotations

import os
from typing import Any

from django.conf import settings

from operoz.db.models import AssistantActionAudit, AssistantSession, Workspace
from operoz.db.models.user import User


def _defer_enabled() -> bool:
    return str(getattr(settings, "ASSISTANT_DEFER_NONCRITICAL", os.environ.get("ASSISTANT_DEFER_NONCRITICAL", "1"))).lower() not in (
        "0",
        "false",
        "no",
    )


def log_assistant_action_sync(
    *,
    workspace: Workspace,
    user: User,
    session: AssistantSession | None,
    tool_name: str = "",
    action_type: str = "",
    status: str = AssistantActionAudit.STATUS_OK,
    payload: dict[str, Any] | None = None,
    error_code: str = "",
) -> AssistantActionAudit:
    return AssistantActionAudit.objects.create(
        workspace=workspace,
        user=user,
        session=session,
        tool_name=tool_name[:128],
        action_type=action_type[:64],
        status=status,
        payload=payload or {},
        error_code=error_code[:64],
        created_by=user,
    )


def log_assistant_action(
    *,
    workspace: Workspace,
    user: User,
    session: AssistantSession | None,
    tool_name: str = "",
    action_type: str = "",
    status: str = AssistantActionAudit.STATUS_OK,
    payload: dict[str, Any] | None = None,
    error_code: str = "",
) -> AssistantActionAudit | None:
    if _defer_enabled():
        from operoz.bgtasks.assistant_deferred_task import log_assistant_action_task

        log_assistant_action_task.delay(
            workspace_id=str(workspace.id),
            user_id=str(user.id),
            session_id=str(session.id) if session else None,
            tool_name=tool_name,
            action_type=action_type,
            status=status,
            payload=payload or {},
            error_code=error_code,
        )
        return None
    return log_assistant_action_sync(
        workspace=workspace,
        user=user,
        session=session,
        tool_name=tool_name,
        action_type=action_type,
        status=status,
        payload=payload,
        error_code=error_code,
    )
