from __future__ import annotations

import traceback
from typing import Any

from operoz.automation.secrets import redact_for_storage


def persist_dead_letter(
    *,
    rule_id: str | None,
    board_id: str,
    workspace_id: str,
    event_id: str,
    event_payload: dict[str, Any],
    error_message: str,
    exc: BaseException | None = None,
    retry_count: int = 0,
    task_id: str = "",
) -> None:
    from operoz.db.models import BoardAutomationDeadLetter

    BoardAutomationDeadLetter.objects.create(
        rule_id=rule_id,
        board_id=board_id,
        workspace_id=workspace_id,
        event_id=event_id,
        event_payload=redact_for_storage(event_payload),
        error_message=error_message[:4000],
        traceback_text=traceback.format_exc() if exc else "",
        retry_count=retry_count,
        celery_task_id=task_id or "",
    )
