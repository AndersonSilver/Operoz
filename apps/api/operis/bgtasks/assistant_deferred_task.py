import logging

from celery import shared_task
from django.db import OperationalError

from operis.assistant.quality import record_assistant_response_sync
from operis.assistant.security.audit import log_assistant_action_sync
from operis.assistant.thread_summarization import persist_session_summary
from operis.db.models import AssistantSession

logger = logging.getLogger(__name__)

ASSISTANT_QUEUE = "assistant"
TRANSIENT_ERRORS = (OperationalError, ConnectionError, TimeoutError)


@shared_task(
    bind=True,
    autoretry_for=TRANSIENT_ERRORS,
    retry_backoff=True,
    retry_backoff_max=60,
    max_retries=3,
    queue=ASSISTANT_QUEUE,
)
def log_assistant_action_task(
    self,
    *,
    workspace_id: str,
    user_id: str,
    session_id: str | None,
    tool_name: str = "",
    action_type: str = "",
    status: str = "",
    payload: dict | None = None,
    error_code: str = "",
) -> dict:
    from operis.db.models import User, Workspace

    workspace = Workspace.objects.filter(pk=workspace_id).first()
    user = User.objects.filter(pk=user_id).first()
    session = AssistantSession.objects.filter(pk=session_id).first() if session_id else None
    if not workspace or not user:
        logger.warning("assistant audit deferred: workspace/user missing")
        return {"ok": False}

    log_assistant_action_sync(
        workspace=workspace,
        user=user,
        session=session,
        tool_name=tool_name,
        action_type=action_type,
        status=status or "ok",
        payload=payload,
        error_code=error_code,
    )
    return {"ok": True}


@shared_task(
    bind=True,
    autoretry_for=TRANSIENT_ERRORS,
    retry_backoff=True,
    retry_backoff_max=60,
    max_retries=3,
    queue=ASSISTANT_QUEUE,
)
def record_assistant_response_task(
    self,
    *,
    workspace_id: str,
    used_tools: bool,
    first_token_ms: int | None,
) -> dict:
    from operis.db.models import Workspace

    workspace = Workspace.objects.filter(pk=workspace_id).first()
    if not workspace:
        return {"ok": False}
    record_assistant_response_sync(
        workspace,
        used_tools=used_tools,
        first_token_ms=first_token_ms,
    )
    return {"ok": True}


@shared_task(
    bind=True,
    autoretry_for=TRANSIENT_ERRORS,
    retry_backoff=True,
    retry_backoff_max=120,
    max_retries=2,
    queue=ASSISTANT_QUEUE,
)
def summarize_session_task(self, session_id: str) -> dict:
    session = AssistantSession.objects.filter(pk=session_id).select_related("workspace", "user").first()
    if not session:
        return {"ok": False, "error": "session_not_found"}

    summary = persist_session_summary(session)
    return {"ok": True, "summary_chars": len(summary or "")}
