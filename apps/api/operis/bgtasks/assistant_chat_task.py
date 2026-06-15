import logging

from celery import shared_task
from django.db import OperationalError

from operis.assistant.chat_jobs import (
    mark_job_completed,
    mark_job_failed,
    mark_job_running,
    publish_job_event,
    update_job_queue_status,
)
from operis.assistant.llm.concurrency import release_llm_slot, wait_for_llm_resources
from operis.assistant.service import AssistantServiceError, iter_chat_events
from operis.db.models import AssistantChatJob

logger = logging.getLogger(__name__)

ASSISTANT_CHAT_QUEUE = "assistant-chat"
TRANSIENT_ERRORS = (OperationalError, ConnectionError, TimeoutError)


@shared_task(
    bind=True,
    autoretry_for=TRANSIENT_ERRORS,
    retry_backoff=True,
    retry_backoff_max=120,
    max_retries=2,
    queue=ASSISTANT_CHAT_QUEUE,
)
def run_assistant_chat_job_task(self, job_id: str) -> dict:
    job = AssistantChatJob.objects.select_related("session", "session__workspace", "session__user").filter(
        pk=job_id
    ).first()
    if not job:
        logger.warning("assistant chat job not found job_id=%s", job_id)
        return {"ok": False, "error": "job_not_found"}

    if job.status == AssistantChatJob.STATUS_COMPLETED:
        return {"ok": True, "status": "already_completed"}

    job.retry_count = self.request.retries
    job.celery_task_id = self.request.id or job.celery_task_id
    job.save(update_fields=["retry_count", "celery_task_id", "updated_at"])

    workspace_id = str(job.session.workspace_id)
    holder_id = str(job.id)

    def _publish_queue(event: dict) -> None:
        publish_job_event(job_id, event)
        if event.get("type") == "queue_update":
            update_job_queue_status(
                job,
                queue_position=int(event.get("queue_position") or 0),
                estimated_wait_seconds=int(event.get("estimated_wait_seconds") or 0),
            )

    if not wait_for_llm_resources(holder_id, workspace_id, publish=_publish_queue):
        mark_job_failed(
            job,
            error_code="llm_wait_timeout",
            error_message="Tempo de espera na fila excedido",
        )
        publish_job_event(
            job_id,
            {
                "type": "error",
                "error": "llm_wait_timeout",
                "message": "Tempo de espera na fila excedido",
                "retry_after": 30,
            },
        )
        return {"ok": False, "error": "llm_wait_timeout"}

    mark_job_running(job)
    publish_job_event(job_id, {"type": "started", "job_id": job_id, "status": "running"})

    session = job.session
    terminal_event: dict | None = None

    try:
        for event in iter_chat_events(
            session,
            job.message,
            stream=True,
            chat_holder_id=holder_id,
            skip_llm_wait=True,
        ):
            publish_job_event(job_id, event)
            if event.get("type") == "done":
                terminal_event = event
                break
            if event.get("type") == "error":
                terminal_event = event
                mark_job_failed(
                    job,
                    error_code=str(event.get("error") or "job_failed"),
                    error_message=str(event.get("message") or "Falha no chat"),
                )
                return {"ok": False, "error": event.get("error")}
    except AssistantServiceError as exc:
        error_event = {
            "type": "error",
            "error": exc.code,
            "message": exc.message,
            "retry_after": exc.retry_after,
        }
        publish_job_event(job_id, error_event)
        mark_job_failed(job, error_code=exc.code, error_message=exc.message)
        return {"ok": False, "error": exc.code}
    except Exception as exc:
        logger.exception("assistant chat job failed job_id=%s", job_id)
        publish_job_event(
            job_id,
            {"type": "error", "error": "job_failed", "message": "Erro interno ao processar chat"},
        )
        mark_job_failed(job, error_code="job_failed", error_message=str(exc))
        raise
    finally:
        release_llm_slot(holder_id)

    if terminal_event and terminal_event.get("type") == "done":
        mark_job_completed(job)
        return {"ok": True, "status": "completed"}

    mark_job_failed(job, error_code="empty_response", error_message="Resposta vazia do job")
    publish_job_event(
        job_id,
        {"type": "error", "error": "empty_response", "message": "Resposta vazia do job"},
    )
    return {"ok": False, "error": "empty_response"}
